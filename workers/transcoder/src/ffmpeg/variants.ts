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
 * Resolution tiers with per-tier scaling + ceiling. Multipliers are applied to
 * the probe-measured source bitrate to produce per-rung targets:
 *
 *   1080p → probeKbps * 1.10  (native anchor + 10% headroom)
 *    720p → probeKbps * 0.55
 *    480p → probeKbps * 0.25
 *
 * Ceilings cap a pathological probe result from exploding the bandwidth bill.
 * Floor (MIN_BITRATE_KBPS) stops sub-300 kbps rungs from shipping (old players
 * and audio-tracked decoders struggle below that).
 */
const RESOLUTION_TIERS = [
  { namePrefix: "1080p", height: 1080, probeMultiplier: 1.1, ceilingKbps: 5000 },
  { namePrefix: "720p", height: 720, probeMultiplier: 0.55, ceilingKbps: 2800 },
  { namePrefix: "480p", height: 480, probeMultiplier: 0.25, ceilingKbps: 1400 },
] as const;

const MIN_BITRATE_KBPS = 300;

/**
 * Drop a rung if its bitrate is within this fraction of the rung above. Viewers
 * can't distinguish 1080p@700kbps from 720p@550kbps, and we pay 2x storage/CDN
 * for the redundancy. 0.7 = "drop the lower rung if its bitrate is 70%+ of the
 * one above it".
 */
const RUNG_DROP_THRESHOLD = 0.7;

function fpsMultiplierFor(fps: number): number {
  if (fps > 120) return 3;
  if (fps > 60) return 2.4;
  if (fps > 30) return 1.5;
  return 1;
}

function scaledBitrate(probeKbps: number, probeMultiplier: number, ceilingKbps: number, fpsMult: number): number {
  const raw = probeKbps * probeMultiplier * fpsMult;
  return Math.max(MIN_BITRATE_KBPS, Math.min(ceilingKbps, Math.round(raw)));
}

/**
 * Build an ABR ladder scaled from a per-title probe bitrate.
 *
 * - Drops resolutions above the source height (except 480p, which always ships
 *   as a mobile/low-bandwidth fallback when the source allows).
 * - Drops rungs whose bitrate is within 70% of the rung above (redundant).
 * - Drops rungs pinned to the 300 kbps floor by a pathological probe.
 * - Very low-complexity content (<400 kbps probe) ships a single 1080p rung —
 *   no point paying for three copies of a slide deck.
 */
export function buildStreamVariants(sourceHeight: number, sourceFps: number, probeKbps: number): StreamVariant[] {
  if (probeKbps <= 0) {
    throw new Error("buildStreamVariants: probeKbps must be positive");
  }

  const variants: StreamVariant[] = [];

  for (const tier of RESOLUTION_TIERS) {
    if (tier.height > sourceHeight && tier.height !== 480) continue;

    const targetFramerates = new Set<number>([Math.min(sourceFps, 30)]);

    if (tier.height >= 720) {
      if (sourceFps >= 58) targetFramerates.add(60);
      if (sourceFps >= 115 && sourceFps < 140) targetFramerates.add(120);
      if (sourceFps >= 140) targetFramerates.add(144);
    }

    for (const fps of targetFramerates) {
      const fpsMult = fpsMultiplierFor(fps);
      const bitrate = scaledBitrate(probeKbps, tier.probeMultiplier, tier.ceilingKbps, fpsMult);

      variants.push({
        name: fps > 30 ? `${tier.namePrefix}${fps}` : tier.namePrefix,
        height: tier.height,
        fps,
        bitrate,
      });
    }
  }

  // Sort by bitrate descending so rung-drop compares each rung against the one
  // above (higher bitrate). A monotonically decreasing sort is what HLS expects
  // in the master playlist anyway.
  variants.sort((a, b) => b.bitrate - a.bitrate);

  const surviving: StreamVariant[] = [];
  for (const variant of variants) {
    // Drop rungs pinned to the floor by a pathological probe.
    if (variant.bitrate <= MIN_BITRATE_KBPS && surviving.length > 0) continue;

    const previous = surviving.at(-1);
    if (previous && variant.bitrate > previous.bitrate * RUNG_DROP_THRESHOLD) {
      // Too close to the rung above — viewers can't tell the difference.
      continue;
    }

    surviving.push(variant);
  }

  if (surviving.length === 0) {
    // Edge case: nothing survived (probe was near zero or source is tiny).
    // Fall back to a single rung at the lowest resolution we had.
    const fallback = variants.at(-1) ?? variants[0];
    if (fallback) surviving.push(fallback);
  }

  return surviving;
}
