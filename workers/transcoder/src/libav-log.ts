import type { AVLogLevel } from "node-av/constants";
import { Log } from "node-av";
import { AV_LOG_ERROR, AV_LOG_FATAL, AV_LOG_INFO, AV_LOG_WARNING } from "node-av/constants";

/**
 * Known-harmless libav messages that we deliberately suppress so the terminal
 * stays readable. These come from libavcodec's multi-threaded h264 software
 * decoder — one worker thread referencing another thread's frame before that
 * thread has finished decoding it. Output is still correct; the messages are
 * purely a race-condition trace. Will disappear once we move to a hardware
 * decoder via ROADMAP §4 `HW_DECODER`.
 *
 * Everything else from libav (real errors, real warnings, segment-open logs,
 * encoder stats) is preserved.
 */
const SUPPRESSED_PATTERNS = [
  "reference picture missing during reorder",
  "co located POCs unavailable",
  "Missing reference picture, default is",
  "illegal short term buffer state detected",
];

function isSuppressed(message: string): boolean {
  for (const pattern of SUPPRESSED_PATTERNS) {
    if (message.includes(pattern)) return true;
  }
  return false;
}

/**
 * Install a filtered libav log callback. Call once at worker boot before any
 * codec is opened.
 */
export function installLibavLogFilter(): void {
  Log.setLevel(AV_LOG_INFO);
  Log.setCallback((level: AVLogLevel, message: string) => {
    const trimmed = message.replace(/\n+$/u, "");
    if (!trimmed) return;
    if (isSuppressed(trimmed)) return;

    if (level <= AV_LOG_FATAL) {
      console.error(`[libav:FATAL] ${trimmed}`);
    } else if (level <= AV_LOG_ERROR) {
      console.error(`[libav] ${trimmed}`);
    } else if (level <= AV_LOG_WARNING) {
      console.warn(`[libav] ${trimmed}`);
    } else {
      console.log(`[libav] ${trimmed}`);
    }
  });
}
