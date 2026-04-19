export const FOLDER_COLOR_PRESETS: [string, ...string[]] = [
  "#64748b", // slate
  "#71717a", // zinc
  "#ef4444", // red
  "#f43f5e", // rose
  "#ec4899", // pink
  "#d946ef", // fuchsia
  "#a855f7", // purple
  "#8b5cf6", // violet
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#0ea5e9", // sky
  "#06b6d4", // cyan
  "#14b8a6", // teal
  "#10b981", // emerald
  "#22c55e", // green
  "#84cc16", // lime
  "#eab308", // yellow
  "#f59e0b", // amber
  "#f97316", // orange
  "#78716c", // stone
];

export const DEFAULT_FOLDER_COLOR: string = FOLDER_COLOR_PRESETS[0];

/**
 * Append an alpha channel (two hex digits) to a `#rrggbb` color so inline styles
 * can render a subtle tint. Bails out to the raw color if parsing fails.
 */
export function tintColor(hex: string, alphaByte = 0x14): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const alpha = alphaByte.toString(16).padStart(2, "0");
  return `${hex}${alpha}`;
}
