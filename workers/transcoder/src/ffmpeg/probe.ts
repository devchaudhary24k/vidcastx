import { Demuxer } from "node-av/api";
import { AVMEDIA_TYPE_AUDIO, AVMEDIA_TYPE_VIDEO } from "node-av/constants";

export interface ProbeResult {
  duration: number;
  height: number;
  fps: number;
  hasAudio: boolean;
}

/**
 * Extracts metadata from a video file using libavformat directly.
 * Replaces the previous `spawn("ffprobe", ...)` approach.
 */
export async function probeVideo(filePath: string): Promise<ProbeResult> {
  const demuxer = await Demuxer.open(filePath);

  try {
    const videoStream = demuxer.findBestStream(AVMEDIA_TYPE_VIDEO);
    const audioStream = demuxer.findBestStream(AVMEDIA_TYPE_AUDIO);

    const height = videoStream?.codecpar.height ?? 1080;

    const duration = Math.max(demuxer.duration, 0);

    const rate = videoStream?.avgFrameRate ?? videoStream?.rFrameRate;
    const num = rate?.num ?? 30;
    const den = rate?.den ?? 1;
    const fps = den > 0 ? Math.round(num / den) || 30 : 30;

    return { height, duration, fps, hasAudio: !!audioStream };
  } finally {
    await demuxer.close();
  }
}
