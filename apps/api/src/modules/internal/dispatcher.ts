import { asc, eq, inArray } from "@vidcastx/database";
import { db } from "@vidcastx/database/client";
import { videos } from "@vidcastx/database/schema/video-schema";
import { transcodeQueue } from "@vidcastx/queue";
import { redis } from "@vidcastx/redis";

/**
 * Runs every few seconds to safely move videos from the DB into BullMQ
 * ensuring strictly 1 active transcode per organization.
 */
export async function dispatchFairly(): Promise<void> {
  const acquiredLock = await redis.set("dispatcher:lock", "locked", "EX", 10, "NX");

  if (!acquiredLock) return;

  try {
    const activeVideos = await db
      .select({ orgId: videos.orgId })
      .from(videos)
      .where(inArray(videos.status, ["dispatched", "processing"]));

    const busyOrgIds = new Set(activeVideos.map((v) => v.orgId));

    const queuedVideos = await db
      .select()
      .from(videos)
      .where(eq(videos.status, "queued"))
      .orderBy(asc(videos.createdAt));

    const videosToDispatch = [];
    const freshlyDispatchedOrgs = new Set<string>();

    for (const video of queuedVideos) {
      if (!busyOrgIds.has(video.orgId) && !freshlyDispatchedOrgs.has(video.orgId)) {
        videosToDispatch.push(video);
        freshlyDispatchedOrgs.add(video.orgId);
      }
    }

    if (videosToDispatch.length === 0) return;

    console.warn(`[Dispatcher] Found ${videosToDispatch.length} fair jobs to dispatch...`);

    await Promise.all(
      videosToDispatch.map(async (video) => {
        if (!video.uploaderId || !video.masterAccessUrl) {
          console.error(`[Dispatcher] Skipping video ${video.id} — missing uploader or master key`);
          return;
        }
        await db.update(videos).set({ status: "dispatched" }).where(eq(videos.id, video.id));
        await transcodeQueue.add("process-video", {
          videoId: video.id,
          orgId: video.orgId,
          userId: video.uploaderId,
          s3InputKey: video.masterAccessUrl,
        });

        console.warn(`[Dispatcher] Queued video ${video.id} for Org ${video.orgId}`);
      }),
    );
  } catch (error) {
    console.error("[Dispatcher] Error during fair dispatch routing:", error);
  } finally {
    await redis.del("dispatcher:lock");
  }
}
