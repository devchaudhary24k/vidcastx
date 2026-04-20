import fsp from "node:fs/promises";
import path from "node:path";
import type { FFEncoderCodec } from "node-av/constants";
import { Decoder, Demuxer, Encoder, FilterComplexAPI, Muxer } from "node-av/api";
import { AVMEDIA_TYPE_AUDIO, AVMEDIA_TYPE_VIDEO, FF_ENCODER_AAC, FF_ENCODER_LIBX264 } from "node-av/constants";

import type { StreamVariant } from "./variants";
import { env } from "../env";
import { probeVideo } from "./probe";
import { buildStreamVariants } from "./variants";

interface TranscodeOptions {
  inputPath: string;
  outputDir: string;
  onProgress?: (percent: number) => void;
}

const VIDEO_ENCODER = (env.HW_ENCODER ?? FF_ENCODER_LIBX264) as FFEncoderCodec;

const VIDEO_IN = "0:v";
const AUDIO_IN = "0:a";
const videoOutLabel = (name: string) => `v_${name}`;
const audioOutLabel = (name: string) => `a_${name}`;

interface RungContext {
  variant: StreamVariant;
  videoEncoder: Encoder;
  audioEncoder?: Encoder;
  muxer: Muxer;
  videoStreamIndex: number;
  audioStreamIndex?: number;
}

/**
 * Orchestrates an ABR HLS transcode via libavformat/libavcodec directly.
 *
 * Single demuxer + single decoder feeds an N-way `split` filter graph, with
 * each branch scaling + encoding to its own HLS muxer. Replaces the previous
 * per-rung demuxer fan-out that caused h264 decoder races + log spam.
 */
export async function runFFmpegTranscode({
  inputPath,
  outputDir,
  onProgress,
}: TranscodeOptions): Promise<{ duration: number; height: number; fps: number }> {
  const { duration: totalDuration, height: inputHeight, fps: inputFps, hasAudio } = await probeVideo(inputPath);

  console.log(
    `[libav] Probed video: ${inputHeight}p @ ${inputFps}fps, Duration: ${totalDuration}s, Audio: ${hasAudio}`,
  );
  console.log(`[libav] Using Video Encoder: ${VIDEO_ENCODER}`);

  const variants = buildStreamVariants(inputHeight, inputFps);
  console.log(`[libav] Generating ${variants.length} HLS variants:`, variants.map((v) => v.name).join(", "));

  const demuxer = await Demuxer.open(inputPath);

  try {
    const videoStream = demuxer.findBestStream(AVMEDIA_TYPE_VIDEO);
    if (!videoStream) throw new Error("transcode: no video stream in source");

    const audioStream = hasAudio ? demuxer.findBestStream(AVMEDIA_TYPE_AUDIO) : undefined;

    const videoDecoder = await Decoder.create(videoStream);
    const audioDecoder = audioStream ? await Decoder.create(audioStream) : undefined;

    const videoComplex = FilterComplexAPI.create(buildVideoGraph(variants), {
      inputs: [{ label: VIDEO_IN }],
      outputs: variants.map((v) => ({ label: videoOutLabel(v.name), mediaType: AVMEDIA_TYPE_VIDEO })),
    });

    const audioComplex = audioDecoder
      ? FilterComplexAPI.create(buildAudioGraph(variants), {
          inputs: [{ label: AUDIO_IN }],
          outputs: variants.map((v) => ({ label: audioOutLabel(v.name), mediaType: AVMEDIA_TYPE_AUDIO })),
        })
      : undefined;

    const rungs = await Promise.all(
      variants.map((variant) => openRung({ variant, outputDir, hasAudio, audioDecoder })),
    );

    try {
      const estimatedTotalFrames = Math.max(1, Math.round(totalDuration * inputFps));
      let framesDone = 0;
      const reportProgress = () => {
        if (!onProgress) return;
        const pct = Math.min(99, Math.round((framesDone / estimatedTotalFrames) * 100));
        onProgress(pct);
      };

      const videoTask = async () => {
        for await (const frame of videoDecoder.frames(demuxer.packets(videoStream.index))) {
          if (!frame) break;
          await videoComplex.process(VIDEO_IN, frame);
          await drainAndEncode(videoComplex, rungs, "video");
          framesDone++;
          if (framesDone % 10 === 0) reportProgress();
        }
        await videoComplex.flush(VIDEO_IN);
        await drainAndEncode(videoComplex, rungs, "video");
        // Send EOF to each encoder and write trailing packets (B-frame reorder tail)
        for (const rung of rungs) {
          const tail = await rung.videoEncoder.encodeAll(null);
          for (const pkt of tail) {
            await rung.muxer.writePacket(pkt, rung.videoStreamIndex);
          }
        }
      };

      const audioTask = async () => {
        if (!audioDecoder || !audioStream || !audioComplex) return;
        for await (const frame of audioDecoder.frames(demuxer.packets(audioStream.index))) {
          if (!frame) break;
          await audioComplex.process(AUDIO_IN, frame);
          await drainAndEncode(audioComplex, rungs, "audio");
        }
        await audioComplex.flush(AUDIO_IN);
        await drainAndEncode(audioComplex, rungs, "audio");
        // Send EOF to each AAC encoder so the last 1024-sample partial frame is
        // drained rather than discarded ("N frames left in the queue on closing").
        for (const rung of rungs) {
          if (!rung.audioEncoder || rung.audioStreamIndex === undefined) continue;
          const tail = await rung.audioEncoder.encodeAll(null);
          for (const pkt of tail) {
            await rung.muxer.writePacket(pkt, rung.audioStreamIndex);
          }
        }
      };

      await Promise.all([videoTask(), audioTask()]);

      // close muxers (writes trailers)
      await Promise.all(rungs.map((r) => r.muxer.close()));
      onProgress?.(99);
    } finally {
      for (const rung of rungs) {
        rung.videoEncoder.close();
        rung.audioEncoder?.close();
      }
      videoComplex.close();
      audioComplex?.close();
      videoDecoder.close();
      audioDecoder?.close();
    }

    await writeMasterPlaylist(outputDir, variants);
    onProgress?.(100);
    return { duration: totalDuration, height: inputHeight, fps: inputFps };
  } finally {
    await demuxer.close();
  }
}

function buildVideoGraph(variants: StreamVariant[]): string {
  const splitLabels = variants.map((v) => `[s_${v.name}]`).join("");
  const splitStage = `[${VIDEO_IN}]split=${variants.length}${splitLabels}`;
  const scaleStages = variants.map(
    (v) => `[s_${v.name}]scale=-2:${v.height},fps=${v.fps},format=yuv420p[${videoOutLabel(v.name)}]`,
  );
  return [splitStage, ...scaleStages].join(";");
}

function buildAudioGraph(variants: StreamVariant[]): string {
  const splitLabels = variants.map((v) => `[${audioOutLabel(v.name)}]`).join("");
  return `[${AUDIO_IN}]asplit=${variants.length}${splitLabels}`;
}

async function openRung({
  variant,
  outputDir,
  hasAudio,
  audioDecoder,
}: {
  variant: StreamVariant;
  outputDir: string;
  hasAudio: boolean;
  audioDecoder: Decoder | undefined;
}): Promise<RungContext> {
  const bitrateK = variant.bitrate;
  const videoEncoder = await Encoder.create(VIDEO_ENCODER, {
    bitrate: `${bitrateK}k`,
    maxRate: `${Math.round(bitrateK * 1.05)}k`,
    bufSize: `${Math.round(bitrateK * 1.5)}k`,
    gopSize: variant.fps * 2,
    options: VIDEO_ENCODER === FF_ENCODER_LIBX264 ? { preset: "fast", crf: "23" } : { preset: "fast" },
  });

  const audioEncoder =
    hasAudio && audioDecoder
      ? await Encoder.create(FF_ENCODER_AAC, { decoder: audioDecoder, bitrate: "128k" })
      : undefined;

  const playlistPath = path.join(outputDir, `${variant.name}_playlist.m3u8`);
  const segmentPattern = path.join(outputDir, `${variant.name}_segment%03d.ts`);

  const muxer = await Muxer.open(playlistPath, {
    format: "hls",
    options: {
      hls_time: "6",
      hls_playlist_type: "vod",
      hls_segment_filename: segmentPattern,
      hls_flags: "independent_segments",
    },
  });

  const videoStreamIndex = muxer.addStream(videoEncoder);
  const audioStreamIndex = audioEncoder ? muxer.addStream(audioEncoder) : undefined;

  return { variant, videoEncoder, audioEncoder, muxer, videoStreamIndex, audioStreamIndex };
}

async function drainAndEncode(complex: FilterComplexAPI, rungs: RungContext[], kind: "video" | "audio"): Promise<void> {
  for (const rung of rungs) {
    const label = kind === "video" ? videoOutLabel(rung.variant.name) : audioOutLabel(rung.variant.name);
    const encoder = kind === "video" ? rung.videoEncoder : rung.audioEncoder;
    const streamIndex = kind === "video" ? rung.videoStreamIndex : rung.audioStreamIndex;
    if (!encoder || streamIndex === undefined) continue;

    for (;;) {
      const out = await complex.receive(label);
      if (out === null) break; // EAGAIN
      if (out === undefined) break; // EOF
      const packets = await encoder.encodeAll(out);
      for (const pkt of packets) {
        await rung.muxer.writePacket(pkt, streamIndex);
      }
    }

    // also drain any encoder packets that accumulated from previous frames
    for (;;) {
      const pkt = await encoder.receive();
      if (pkt === null) break; // EAGAIN
      if (pkt === undefined) break; // EOF
      await rung.muxer.writePacket(pkt, streamIndex);
    }
  }
}

async function writeMasterPlaylist(outputDir: string, variants: StreamVariant[]): Promise<void> {
  const lines: string[] = ["#EXTM3U", "#EXT-X-VERSION:6"];

  for (const v of variants) {
    const bandwidth = v.bitrate * 1000;
    const resolution = `${approxWidthFor(v.height)}x${v.height}`;
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution},NAME="${v.name}",FRAME-RATE=${v.fps}`,
      `${v.name}_playlist.m3u8`,
    );
  }

  await fsp.writeFile(path.join(outputDir, "master.m3u8"), lines.join("\n") + "\n", "utf8");
}

function approxWidthFor(height: number): number {
  const width = Math.round((height * 16) / 9);
  return width % 2 === 0 ? width : width + 1;
}
