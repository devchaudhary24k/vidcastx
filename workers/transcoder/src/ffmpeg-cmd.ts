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
        // const r_frame_rate =
      } catch (err) {
        reject(new Error("Failed to parse ffprobe output."));
      }
    });
  });
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
