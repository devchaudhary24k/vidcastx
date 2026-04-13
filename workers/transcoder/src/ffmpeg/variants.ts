/**
 * Represents a single HLS stream variant (e.g., 1080p60, 720p30).
 */
export interface StreamVariant {
  name: string;
  height: number;
  fps: number;
  bitrate: number;
}

/**
 * Baseline bitrates for standard 30fps viewing at maximum supported resolutions.
 * High framerates will dynamically multiply these base bitrates.
 */
const BASE_RESOLUTIONS = [
  // { namePrefix: "4K", height: 2160, baseBitrate: 15000 },
  { namePrefix: "1080p", height: 1080, baseBitrate: 5000 },
  { namePrefix: "720p", height: 720, baseBitrate: 2800 },
  { namePrefix: "480p", height: 480, baseBitrate: 1400 },
];

/**
 * Generates an array of optimal stream variants based on the source video's constraints.
 * Ensures the transcoder never attempts to upscale resolutions or interpolate framerates.
 */
export function buildStreamVariants(sourceHeight: number, sourceFps: number): StreamVariant[] {
  const variants: StreamVariant[] = [];

  BASE_RESOLUTIONS.forEach((res) => {
    if (res.height > sourceHeight && res.height !== 480) return;

    let targetFramerates = [sourceFps < 30 ? sourceFps : 30];

    if (res.height >= 720) {
      if (sourceFps >= 58) targetFramerates.push(60);
      if (sourceFps >= 115 && sourceFps < 140) targetFramerates.push(120);
      if (sourceFps >= 140) targetFramerates.push(144);
    }

    targetFramerates = [...new Set(targetFramerates)];

    targetFramerates.forEach((fps) => {
      let fpsMultiplier = 1;
      if (fps > 30 && fps <= 60) fpsMultiplier = 1.5;
      if (fps > 60 && fps <= 120) fpsMultiplier = 2.4;
      if (fps > 120) fpsMultiplier = 3.0;

      const isHighFPS = fps > 30;
      const variantName = isHighFPS ? `${res.namePrefix}${fps}` : res.namePrefix;

      variants.push({
        name: variantName,
        height: res.height,
        fps: fps,
        bitrate: Math.round(res.baseBitrate * fpsMultiplier),
      });
    });
  });

  return variants;
}
