import { spawn } from "node:child_process";

export interface ProbeResult {
  duration: number;
  height: number;
  fps: number;
  hasAudio: boolean;
}

/**
 * Extracts metadata from a video file using ffprobe.
 */
export async function probeVideo(filePath: string): Promise<ProbeResult> {
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
      } catch {
        reject(new Error("Failed to parse ffprobe output."));
      }
    });
  });
}
