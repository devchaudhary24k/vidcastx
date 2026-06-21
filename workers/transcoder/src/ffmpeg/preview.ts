import type { FFEncoderCodec } from "node-av/constants";
import { Codec } from "node-av";
import { Decoder, Demuxer, Encoder, FilterAPI, Muxer } from "node-av/api";
import { AVMEDIA_TYPE_VIDEO, AVSEEK_FLAG_BACKWARD } from "node-av/constants";

/**
 * Generate a short muted WebM preview clip for hover playback (YouTube-style).
 * 6 seconds, 480px wide, 15fps, VP9 ~400kbps — small enough to autoplay-loop in a grid.
 * Uses libavformat/libavcodec directly; no ffmpeg subprocess.
 *
 * Duration cap enforced at the OUTPUT side (after encoder): we read encoded packets
 * and break once accumulated output duration reaches `durationSeconds`. The `trim`
 * filter is avoided because it emits EOF downstream while we're still feeding the
 * filter's input, throwing "Failed to add frame to filter: End of file".
 */
export async function generateHoverPreview(
  inputPath: string,
  outputPath: string,
  startSeconds = 3,
  durationSeconds = 6,
): Promise<void> {
  const demuxer = await Demuxer.open(inputPath);

  try {
    const videoStream = demuxer.findBestStream(AVMEDIA_TYPE_VIDEO);
    if (!videoStream) {
      throw new Error("preview: no video stream in source");
    }

    await demuxer.seek(startSeconds, videoStream.index, AVSEEK_FLAG_BACKWARD);

    const decoder = await Decoder.create(videoStream);
    const filter = FilterAPI.create("scale=480:-2,fps=15");
    // node-av 5.2.3 exports FF_ENCODER_LIBVPX_VP9 as "libvpx_vp9" (wrong), so resolve by string name.
    const vp9 = Codec.findEncoderByName("libvpx-vp9" as FFEncoderCodec);
    if (!vp9) throw new Error("preview: libvpx-vp9 encoder unavailable");
    const encoder = await Encoder.create(vp9, {
      filter,
      bitrate: "400k",
      options: { deadline: "realtime", "cpu-used": "5" },
    });
    const output = await Muxer.open(outputPath, { format: "webm" });
    const videoIdx = output.addStream(encoder);

    try {
      // Output runs at 15fps; we need durationSeconds * 15 output packets.
      const maxOutputPackets = Math.ceil(durationSeconds * 15);
      let written = 0;

      for await (const packet of encoder.packets(filter.frames(decoder.frames(demuxer.packets(videoStream.index))))) {
        if (!packet) continue;
        await output.writePacket(packet, videoIdx);
        written++;
        if (written >= maxOutputPackets) break;
      }
    } finally {
      await output.close();
      encoder.close();
      filter.close();
      decoder.close();
    }
  } finally {
    await demuxer.close();
  }
}
