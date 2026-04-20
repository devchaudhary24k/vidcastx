import type { Stream } from "node-av";
import { Decoder, Demuxer, Encoder, FilterAPI } from "node-av/api";
import { AVMEDIA_TYPE_AUDIO, AVMEDIA_TYPE_VIDEO, AVSEEK_FLAG_BACKWARD, FF_ENCODER_LIBX264 } from "node-av/constants";

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

interface Sample {
  startSec: number;
  durSec: number;
  weight: number;
}

/**
 * Pick sampling windows based on source duration. Short videos get fewer/smaller
 * samples. Long videos get the 4-sample weighted scheme — head anchor + three
 * body samples — which keeps probe wall-clock bounded at ~75s of footage
 * regardless of source length.
 */
function pickSamples(duration: number): Sample[] {
  if (duration < 60) {
    return [{ startSec: 0, durSec: Math.max(1, Math.floor(duration)), weight: 1 }];
  }
  if (duration < 300) {
    return [
      { startSec: 0, durSec: 30, weight: 1 },
      { startSec: Math.floor(duration * 0.5), durSec: 15, weight: 1.5 },
    ];
  }
  return [
    { startSec: 0, durSec: 30, weight: 1 },
    { startSec: Math.floor(duration * 0.25), durSec: 15, weight: 1.5 },
    { startSec: Math.floor(duration * 0.55), durSec: 15, weight: 1.5 },
    { startSec: Math.floor(duration * 0.85), durSec: 15, weight: 1.5 },
  ];
}

/**
 * Run a fast CRF-23 libx264 probe at multiple offsets and return the
 * weighted-average output bitrate in kbps. The encoder's honest answer to
 * "how many bits does this specific video need at consistent quality?"
 *
 * No disk I/O: encoded packets are counted by `packet.size` and discarded.
 *
 * Total encoded footage is fixed (~75s for videos ≥5min), so probe wall time
 * is bounded regardless of source length. A 2-hour video probes in the same
 * time as a 5-minute one.
 */
export async function probeBitrate(inputPath: string, duration: number, sourceFps: number): Promise<number> {
  if (duration <= 0) {
    throw new Error("probeBitrate: invalid duration");
  }

  const samples = pickSamples(duration);
  const demuxer = await Demuxer.open(inputPath);

  try {
    const videoStream = demuxer.findBestStream(AVMEDIA_TYPE_VIDEO);
    if (!videoStream) {
      throw new Error("probeBitrate: no video stream in source");
    }

    let totalWeightedKbps = 0;
    let totalWeight = 0;

    for (const sample of samples) {
      const bytes = await encodeSampleAndCountBytes(demuxer, videoStream, sample, sourceFps);
      const kbps = (bytes * 8) / (sample.durSec * 1000);
      totalWeightedKbps += kbps * sample.weight;
      totalWeight += sample.weight;
    }

    return Math.max(1, Math.round(totalWeightedKbps / totalWeight));
  } finally {
    await demuxer.close();
  }
}

async function encodeSampleAndCountBytes(
  demuxer: Demuxer,
  videoStream: Stream,
  sample: Sample,
  sourceFps: number,
): Promise<number> {
  await demuxer.seek(sample.startSec, videoStream.index, AVSEEK_FLAG_BACKWARD);

  const decoder = await Decoder.create(videoStream);
  const filter = FilterAPI.create("format=yuv420p");
  const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
    filter,
    options: { preset: "ultrafast", crf: "23" },
  });

  // Output fps matches source fps (we don't rescale timing), so bounding the
  // encoded output by packet count gives us roughly `sample.durSec` of footage.
  const targetPackets = Math.max(1, Math.ceil(sample.durSec * sourceFps));
  let totalBytes = 0;
  let written = 0;

  try {
    for await (const packet of encoder.packets(filter.frames(decoder.frames(demuxer.packets(videoStream.index))))) {
      if (!packet) continue;
      totalBytes += packet.size;
      written++;
      if (written >= targetPackets) break;
    }
  } finally {
    encoder.close();
    filter.close();
    decoder.close();
  }

  return totalBytes;
}
