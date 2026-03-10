import { spawn } from "node:child_process";
import path from "node:path";

import { env } from "./env";

/**
 * Configuration options for the transcoding process.
 */
interface TranscodeOptions {
  inputPath: string;
  outputDir: string;
  onProgress?: (percent: number) => void | Promise<void>;
}

/**
 * Represents a single HLS stream variant (e.g., 1080p60, 720p30).
 */
interface StreamVariant {
  name: string;
  height: number;
  fps: number;
  bitrate: number;
}

/**
 * Baseline bitrates for standard 30fps viewing at maximum supported resolutions.
 * High framerates will dynamically multiply these base bitrates.
 */
const BASE_RESOLUTIONS = [
  { namePrefix: "4K", height: 2160, baseBitrate: 15000 },
  { namePrefix: "1080p", height: 1080, baseBitrate: 5000 },
  { namePrefix: "720p", height: 720, baseBitrate: 2800 },
  { namePrefix: "480p", height: 480, baseBitrate: 1400 },
];

/**
 * Hardware Acceleration Toggle
 * Set HW_ENCODER in your .env file to utilize GPU encoding:
 * - 'h264_nvenc' for NVIDIA GPUs (Production/AWS)
 * - 'h264_videotoolbox' for Apple Silicon (Mac M1/M2/M3)
 * - 'h264_amf' for AMD GPUs
 * Defaults to 'libx264' (CPU) if no hardware encoder is specified.
 */
const VIDEO_ENCODER = env.HW_ENCODER || "libx264";

/**
 * Extracts metadata from a video file using ffprobe.
 * * @param filePath - The absolute path to the video file.
 * @returns A promise resolving to the video's duration, height, fps, and audio presence.
 */
async function probeVideo(
  filePath: string,
): Promise<{ duration: number; height: number; fps: number; hasAudio: boolean }> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_type,height,duration,r_frame_rate:format=duration",
      "-of",
      "json",
      filePath,
    ]);

    let output = "";
    ffprobe.stdout.on("data", (data) => (output += data.toString()));

    ffprobe.on("close", (code) => {
      if (code !== 0) return reject(new Error("ffprobe failed to read video metadata"));

      try {
        const meta = JSON.parse(output);

        const videoStream = meta.streams?.find((s: any) => s.codec_type === "video");
        const hasAudio = meta.streams?.some((s: any) => s.codec_type === "audio") || false;

        const height = parseInt(videoStream?.height || "1080");
        const duration = parseFloat(videoStream?.duration || meta.format?.duration || 0);

        const r_frame_rate = videoStream?.r_frame_rate || "30/1";
        const [num, den] = r_frame_rate.split("/");
        const fps = Math.round(parseInt(num, 10) / parseInt(den, 10) || 30);

        resolve({ height, duration, fps, hasAudio });
      } catch (err) {
        reject(new Error("Failed to parse ffprobe output."));
      }
    });
  });
}

/**
 * Generates an array of optimal stream variants based on the source video's constraints.
 * Ensures the transcoder never attempts to upscale resolutions or interpolate framerates.
 * * @param sourceHeight - The pixel height of the original video.
 * @param sourceFps - The frames per second of the original video.
 * @returns An array of stream configurations to be processed.
 */
function buildStreamVariants(sourceHeight: number, sourceFps: number): StreamVariant[] {
  const variants: StreamVariant[] = [];

  BASE_RESOLUTIONS.forEach((res) => {
    if (res.height > sourceHeight && res.height !== 480) return;

    let targetFramerates = [sourceFps < 30 ? sourceFps : 30];

    if (res.height >= 720) {
      if (sourceFps >= 58) targetFramerates.push(60);
      if (sourceFps >= 115 && sourceFps < 140) targetFramerates.push(120);
      if (sourceFps >= 140) targetFramerates.push(144);
    }

    targetFramerates = [...new Set(targetFramerates)];

    targetFramerates.forEach((fps) => {
      let fpsMultiplier = 1;
      if (fps > 30 && fps <= 60) fpsMultiplier = 1.5;
      if (fps > 60 && fps <= 120) fpsMultiplier = 2.4;
      if (fps > 120) fpsMultiplier = 3.0;

      const isHighFPS = fps > 30;
      const variantName = isHighFPS ? `${res.namePrefix}${fps}` : res.namePrefix;

      variants.push({
        name: variantName,
        height: res.height,
        fps: fps,
        bitrate: Math.round(res.baseBitrate * fpsMultiplier),
      });
    });
  });

  return variants;
}

/**
 * Orchestrates the FFmpeg process to transcode an input video into an Adaptive Bitrate (ABR) HLS stream.
 * Automatically generates a master playlist linking multiple resolutions and framerates.
 * * @param options - Transcoding settings including input/output paths and progress callbacks.
 */
export async function runFFmpegTranscode({ inputPath, outputDir, onProgress }: TranscodeOptions): Promise<void> {
  const { duration: totalDuration, height: inputHeight, fps: inputFps, hasAudio } = await probeVideo(inputPath);

  console.log(
    `[FFmpeg] Probed video: ${inputHeight}p @ ${inputFps}fps, Duration: ${totalDuration}s, Audio: ${hasAudio}`,
  );
  console.log(`[FFmpeg] Using Video Encoder: ${VIDEO_ENCODER}`);

  const streamVariants = buildStreamVariants(inputHeight, inputFps);
  console.log(
    `[FFmpeg] Generating ${streamVariants.length} HLS variants:`,
    streamVariants.map((v) => v.name).join(", "),
  );

  const args = ["-i", inputPath, "-y"];
  let varStreamMap = "";

  streamVariants.forEach((variant, idx) => {
    // Map individual video and audio streams for the current variant to prevent packet starvation
    args.push("-map", "0:v:0");
    if (hasAudio) {
      args.push("-map", "0:a:0");
    }

    // Configure video encoding parameters for the variant, utilizing the hardware toggle
    args.push(
      `-c:v:${idx}`,
      VIDEO_ENCODER,
      `-b:v:${idx}`,
      `${variant.bitrate}k`,
      `-maxrate:v:${idx}`,
      `${Math.round(variant.bitrate * 1.05)}k`,
      `-bufsize:v:${idx}`,
      `${Math.round(variant.bitrate * 1.5)}k`,
      `-filter:v:${idx}`,
      `scale=-2:${variant.height}`,
      `-r:v:${idx}`,
      `${variant.fps}`,
      `-preset`,
      "fast",
    );

    // Only apply CRF to the software encoder, as NVENC and VideoToolbox handle rate control differently
    if (VIDEO_ENCODER === "libx264") {
      args.push(`-crf`, "23");
    }

    // Configure audio encoding parameters matching the current variant index
    if (hasAudio) {
      args.push(`-c:a:${idx}`, "aac", `-b:a:${idx}`, "128k", `-ac:${idx}`, "2");
    }

    // Construct the variant map entry for the HLS master playlist
    const audioMap = hasAudio ? `,a:${idx}` : "";
    varStreamMap += `v:${idx}${audioMap},name:${variant.name} `;
  });

  // Apply global HLS packaging constraints
  args.push(
    "-f",
    "hls",
    "-hls_time",
    "6",
    "-hls_playlist_type",
    "vod",
    "-hls_segment_filename",
    path.join(outputDir, "%v_segment%03d.ts"),
    "-master_pl_name",
    "master.m3u8",
    "-var_stream_map",
    varStreamMap.trim(),
    path.join(outputDir, "%v_playlist.m3u8"),
  );

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);

    ffmpeg.stderr.on("data", (data) => {
      const output = data.toString();

      if (output.includes("frame=") || output.includes("time=")) {
        process.stdout.write(`\r[FFmpeg Engine] ${output.trim()}`);
      }

      // Extract current timestamp to calculate completion percentage
      const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/);
      if (timeMatch && totalDuration > 0 && onProgress) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = parseFloat(timeMatch[3]);

        const currentTime = hours * 3600 + minutes * 60 + seconds;
        let percent = Math.round((currentTime / totalDuration) * 100);
        percent = Math.min(percent, 99);

        onProgress(percent);
      }
    });

    ffmpeg.on("close", (code) => {
      process.stdout.write("\n");
      if (code === 0) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with error code ${code}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
}
