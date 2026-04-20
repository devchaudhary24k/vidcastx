import type { Worker } from "bullmq";

/**
 * Register SIGINT/SIGTERM/SIGHUP handlers that call `worker.close(true)` once.
 *
 * BullMQ locks workers with a TTL-based Redis key. If the process dies without
 * calling `worker.close()`, the lock sits in Redis for `lockDuration` and blocks
 * any other worker from picking up the in-flight job until it expires. On dev
 * with `tsx watch`, every file change triggers a restart — without this handler
 * the queue visibly stalls for up to 10 minutes each time.
 *
 * Standard BullMQ shutdown pattern: https://docs.bullmq.io/guide/going-to-production
 */
export function registerWorkerShutdown(worker: Worker, label = worker.name): void {
  let shuttingDown = false;

  async function handle(signal: NodeJS.Signals): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    console.warn(`[${label}] ${signal} received — closing worker`);
    try {
      await worker.close(true);
    } catch (error) {
      console.error(`[${label}] worker.close failed:`, error);
    }
    process.exit(0);
  }

  process.once("SIGINT", () => void handle("SIGINT"));
  process.once("SIGTERM", () => void handle("SIGTERM"));
  process.once("SIGHUP", () => void handle("SIGHUP"));
}
