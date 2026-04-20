import fsp from "node:fs/promises";
import { Decoder, Demuxer, Encoder, FilterAPI } from "node-av/api";
import { AVMEDIA_TYPE_VIDEO, AVSEEK_FLAG_BACKWARD, FF_ENCODER_MJPEG } from "node-av/constants";

/**
 * Extract a single poster frame at `atSeconds`. Scaled to 1280 wide, JPEG.
 * Uses libavformat/libavcodec directly; no ffmpeg subprocess.
 */
export async function generatePoster(inputPath: string, outputPath: string, atSeconds = 3): Promise<void> {
  const demuxer = await Demuxer.open(inputPath);

  try {
    const videoStream = demuxer.findBestStream(AVMEDIA_TYPE_VIDEO);
    if (!videoStream) {
      throw new Error("poster: no video stream in source");
    }

    await demuxer.seek(atSeconds, videoStream.index, AVSEEK_FLAG_BACKWARD);

    const decoder = await Decoder.create(videoStream);
    // Use modern yuv420p + explicit full range instead of legacy yuvj420p to silence
    // `deprecated pixel format used` swscaler warning.
    const filter = FilterAPI.create("scale=1280:-2,format=yuv420p,setparams=range=pc");
    const encoder = await Encoder.create(FF_ENCODER_MJPEG, {
      filter,
      options: { "q:v": "3", color_range: "pc" },
    });

    try {
      const packets = encoder.packets(filter.frames(decoder.frames(demuxer.packets(videoStream.index))));
      for await (const packet of packets) {
        if (!packet?.data) continue;
        await fsp.writeFile(outputPath, packet.data);
        return;
      }
      throw new Error("poster: no frame produced");
    } finally {
      encoder.close();
      filter.close();
      decoder.close();
    }
  } finally {
    await demuxer.close();
  }
}
