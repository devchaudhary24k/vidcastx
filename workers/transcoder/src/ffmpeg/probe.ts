import { spawn } from "node:child_process";

export interface ProbeResult {
  duration: number;
  height: number;
  fps: number;
  hasAudio: boolean;
}

interface FfprobeStream {
  codec_type?: string;
  height?: number;
  duration?: string;
  r_frame_rate?: string;
}

interface FfprobeOutput {
  streams?: FfprobeStream[];
  format?: { duration?: string };
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
    ffprobe.stdout.on("data", (data: Buffer) => (output += data.toString()));

    ffprobe.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("ffprobe failed to read video metadata"));
        return;
      }

      try {
        const meta = JSON.parse(output) as FfprobeOutput;
        const streams = meta.streams ?? [];

        const videoStream = streams.find((s) => s.codec_type === "video");
        const hasAudio = streams.some((s) => s.codec_type === "audio");

        const height = videoStream?.height ?? 1080;
        const durationRaw = videoStream?.duration ?? meta.format?.duration ?? "0";
        const duration = parseFloat(durationRaw);

        const rFrameRate = videoStream?.r_frame_rate ?? "30/1";
        const [numStr, denStr] = rFrameRate.split("/");
        const num = parseInt(numStr ?? "30", 10);
        const den = parseInt(denStr ?? "1", 10);
        const fps = Math.round(num / den) || 30;

        resolve({ height, duration, fps, hasAudio });
      } catch {
        reject(new Error("Failed to parse ffprobe output."));
      }
    });
  });
}
