import { spawn } from "node:child_process";

/**
 * Extract a single poster frame at `atSeconds`. Scaled to 1280 wide, high-quality JPEG.
 */
export async function generatePoster(inputPath: string, outputPath: string, atSeconds = 3): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y",
      "-ss",
      String(atSeconds),
      "-i",
      inputPath,
      "-frames:v",
      "1",
      "-vf",
      "scale=1280:-2",
      "-q:v",
      "3",
      outputPath,
    ]);
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`poster ffmpeg exited ${code}`));
    });
    ff.on("error", reject);
  });
}
