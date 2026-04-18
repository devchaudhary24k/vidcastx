import { spawn } from "node:child_process";
import path from "node:path";

import { env } from "../env";
import { probeVideo } from "./probe";
import { buildStreamVariants } from "./variants";

interface TranscodeOptions {
  inputPath: string;
  outputDir: string;
  onProgress?: (percent: number) => void;
}

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
 * Orchestrates the FFmpeg process to transcode an input video into an Adaptive Bitrate (ABR) HLS stream.
 * Automatically generates a master playlist linking multiple resolutions and framerates.
 */
export async function runFFmpegTranscode({
  inputPath,
  outputDir,
  onProgress,
}: TranscodeOptions): Promise<{ duration: number; height: number; fps: number }> {
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
    args.push("-map", "0:v:0");
    if (hasAudio) {
      args.push("-map", "0:a:0");
    }

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

    if (VIDEO_ENCODER === "libx264") {
      args.push(`-crf`, "23");
    }

    if (hasAudio) {
      args.push(`-c:a:${idx}`, "aac", `-b:a:${idx}`, "128k", `-ac:${idx}`, "2");
    }

    const audioMap = hasAudio ? `,a:${idx}` : "";
    varStreamMap += `v:${idx}${audioMap},name:${variant.name} `;
  });

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

    ffmpeg.stderr.on("data", (data: Buffer) => {
      const output = data.toString();

      if (output.includes("frame=") || output.includes("time=")) {
        process.stdout.write(`\r[FFmpeg Engine] ${output.trim()}`);
      }

      const timeMatch = /time=(\d{2}):(\d{2}):(\d{2}\.\d+)/.exec(output);
      if (timeMatch?.[1] && timeMatch[2] && timeMatch[3] && totalDuration > 0 && onProgress) {
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
        resolve({ duration: totalDuration, height: inputHeight, fps: inputFps });
      } else {
        reject(new Error(`FFmpeg exited with error code ${code}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
}
