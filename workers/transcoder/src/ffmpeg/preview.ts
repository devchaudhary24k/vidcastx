import { spawn } from "node:child_process";

/**
 * Generate a short muted WebM preview clip for hover playback (YouTube-style).
 * 6 seconds, 480px wide, 15fps, VP9 ~400kbps — small enough to autoplay-loop in a grid.
 */
export async function generateHoverPreview(
  inputPath: string,
  outputPath: string,
  startSeconds = 3,
  durationSeconds = 6,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y",
      "-ss",
      String(startSeconds),
      "-i",
      inputPath,
      "-t",
      String(durationSeconds),
      "-an",
      "-vf",
      "scale=480:-2,fps=15",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "400k",
      "-deadline",
      "realtime",
      "-cpu-used",
      "5",
      outputPath,
    ]);
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`preview ffmpeg exited ${code}`));
    });
    ff.on("error", reject);
  });
}
