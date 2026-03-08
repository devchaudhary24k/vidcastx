import { spawn } from "node:child_process";

type TranscodeOptions = {
  inputPath: string;
  outputDir: string;
  onProgress?: (percent: number) => void | Promise<void>;
};

type StreamVariants = {
  name: string;
  height: number;
  fps: number;
  bitrate: number; // in kbps
};

const BASE_RESOLUTIONS = [
  { namePrefix: "4K", height: 2160, baseBitrate: 15000 },
  { namePrefix: "1080p", height: 1080, baseBitrate: 5000 },
  { namePrefix: "720p", height: 720, baseBitrate: 2800 },
  { namePrefix: "480p", height: 480, baseBitrate: 1400 },
];

/**
 * X-Rays the video using ffprobe to get exact duration, height, and precise framerate.
 *
 * @param filePath
 */
async function probeVideo(filePath: string): Promise<{ duration: number; height: number; fps: number }> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=height,duration,r_frame_rate:format=duration",
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
        const height = parseInt(meta.streams[0]?.height || "1080");
        const duration = parseFloat(meta.streams[0]?.duration || meta.format?.duration || 0);

        // Parse framerate (usually stored as a fraction like "60000/1001" "144/1")
        const r_frame_rate = meta.streams[0]?.frame_rate || "30/1";
        const [num, den] = r_frame_rate.split("/");
        const fps = Math.round(parseInt(num, 10) / parseInt(den, 10) || 30);

        resolve({ height, duration, fps });
      } catch (err) {
        reject(new Error("Failed to parse ffprobe output."));
      }
    });
  });
}

/**
 * Dynamically builds the array of variants to encode based on source constraints.
 *
 * @param sourceHeight
 * @param sourceFps
 */
function buildStreamVariants(sourceHeight: number, sourceFps: number): StreamVariants[] {
  const variants: StreamVariants[] = [];

  BASE_RESOLUTIONS.forEach((res) => {
    // Skip upscaling (but always guarantee at least a 480p output)
    // If the input is 8k (4320p), it will hit the 4k (2160p) rule and properly downscale
    if (res.height > sourceHeight && res.height !== 480) return;

    // Determine which framerates to generate for this height
    // Keep the original FPS, if it's cinematic/low (e.g. 28fps), otherwise cap baseline at 30.
    let targetFramerates = [sourceFps < 30 ? sourceFps : 30];

    // Only offer high-framerate option for HD content and above
    if (res.height >= 720) {
      if (sourceFps >= 58) targetFramerates.push(60);
      if (sourceFps >= 115 && sourceFps < 140) targetFramerates.push(120);
      if (sourceFps >= 140) targetFramerates.push(144);
    }

    // Deduplicate and construct specific variants
    targetFramerates = [...new Set(targetFramerates)];

    targetFramerates.forEach((fps) => {
      // Calculate Bitrate scaling for high FPS (more frames = more data needed)
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

export async function runFFmpegTranscode(inputPath: string, outputPath: string): Promise<void> {
  const args = [
    "-i",
    inputPath, // Input file
    "-y", // Overwrite output file if it exists
    "-vf",
    "scale='min(1920,iw)':-2", // Scale to 1080p max, preserve aspect ratio
    "-c:v",
    "libx264", // Standard widely-supported video codec
    "-preset",
    "fast", // Encoding speed vs compression ratio
    "-crf",
    "23", // Visual quality (lower is better, 23 is standard)
    "-c:a",
    "aac", // Standard audio codec
    "-b:a",
    "128k", // Audio bitrate
    "-movflags",
    "+faststart", // Optimizes MP4 for immediate web streaming
    outputPath, // Output file
  ];

  return new Promise((resolve, reject) => {
    // Spawn a native process
    const ffmpeg = spawn("ffmpeg", args);

    //Listen to the output (FFmpeg logs to stderr, not stdout!)
    ffmpeg.stderr.on("data", (data) => {
      const output = data.toString();

      if (output.includes("frame=") || output.includes("time=")) process.stdout.write(`\r[FFmpeg] ${output.trim()}`);
    });

    // Handle completion
    ffmpeg.on("close", (code) => {
      // Print a new line after the progress stream finishes
      process.stdout.write("\n");

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    //
    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
}
