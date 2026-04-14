import { and, desc, eq, isNull, sql } from "@vidcastx/database";
import { db } from "@vidcastx/database/client";
import { assets, videos } from "@vidcastx/database/schema/video-schema";
import { generateId } from "@vidcastx/database/utils/id";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  getDownloadUrl,
  initMultipartUpload,
  listParts,
  signMultipartPart,
} from "@vidcastx/storage";

type Video = typeof videos.$inferSelect;

export class VideoService {
  /**
   * Create a Video Draft and generate the S3 Key
   */
  static async createDraft(
    userId: string,
    orgId: string,
    data: { filename: string; title?: string; folderId?: string | null },
  ) {
    const videoId = generateId("vid");
    const extension = data.filename.split(".").pop();
    const s3Key = `raw/${orgId}/${videoId}.${extension}`;

    const [video] = await db
      .insert(videos)
      .values({
        id: videoId,
        orgId,
        uploaderId: userId,
        title: data.title || data.filename,
        status: "draft",
        masterAccessUrl: s3Key,
        folderId: data.folderId || null,
      })
      .returning();

    return video;
  }

  /**
   * List videos for an organization, excluding soft-deleted rows.
   */
  static async listByOrg(orgId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const where = and(eq(videos.orgId, orgId), isNull(videos.deletedAt));

    const [rows, totalRow] = await Promise.all([
      db.query.videos.findMany({
        where,
        orderBy: [desc(videos.createdAt)],
        limit,
        offset,
        with: {
          assets: {
            columns: { type: true, storageKey: true },
          },
        },
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(videos)
        .where(where),
    ]);

    const hydrated = await Promise.all(
      rows.map(async (v) => {
        const assetMap = new Map(v.assets.map((a) => [a.type, a]));
        const thumb = assetMap.get("thumbnail");
        const preview = assetMap.get("preview_gif");
        const playback = assetMap.get("hls_playlist");
        const [thumbnailUrl, previewUrl, playbackUrl] = await Promise.all([
          thumb ? getDownloadUrl(thumb.storageKey) : Promise.resolve(null),
          preview ? getDownloadUrl(preview.storageKey) : Promise.resolve(null),
          playback ? getDownloadUrl(playback.storageKey) : Promise.resolve(null),
        ]);
        const { assets: _assets, ...rest } = v;
        return { ...rest, thumbnailUrl, previewUrl, playbackUrl };
      }),
    );

    return { videos: hydrated, total: totalRow[0]?.count ?? 0 };
  }

  /**
   * Insert thumbnail + preview assets produced by the transcoder.
   */
  static async addProcessingAssets(
    videoId: string,
    items: { thumbnailKey?: string; previewKey?: string; playbackKey?: string },
  ) {
    const rows: (typeof assets.$inferInsert)[] = [];
    if (items.thumbnailKey) {
      rows.push({ videoId, type: "thumbnail", storageKey: items.thumbnailKey });
    }
    if (items.previewKey) {
      rows.push({ videoId, type: "preview_gif", storageKey: items.previewKey });
    }
    if (items.playbackKey) {
      rows.push({ videoId, type: "hls_playlist", storageKey: items.playbackKey });
    }
    if (rows.length === 0) return;
    await db.insert(assets).values(rows);
  }

  /**
   * Update editable metadata on a video.
   */
  static async updateMetadata(
    videoId: string,
    orgId: string,
    patch: Partial<{
      title: string;
      description: string | null;
      visibility: "private" | "public";
      scheduledAt: Date | null;
      folderId: string | null;
      pinned: boolean;
    }>,
  ) {
    await db
      .update(videos)
      .set(patch)
      .where(and(eq(videos.id, videoId), eq(videos.orgId, orgId)));
  }

  /**
   * Helper: Ensure user owns video
   * Used in the .derive() middleware to secure routes
   */
  static async getVideoIfOwner(videoId: string, orgId: string) {
    const video = await db.query.videos.findFirst({
      where: and(eq(videos.id, videoId), eq(videos.orgId, orgId)),
    });
    return video || null;
  }

  /**
   * Start the Multipart Upload on S3
   */
  static async initMultipart(video: Video, contentType: string) {
    const uploadId = await initMultipartUpload(video.masterAccessUrl!, contentType);

    return { uploadId, key: video.masterAccessUrl! };
  }

  /**
   * Generate a Presigned URL for a specific chunk (Part)
   */
  static async signPart(key: string, uploadId: string, partNumber: number) {
    return await signMultipartPart(key, uploadId, partNumber);
  }

  static async completeMultipart(video: Video, uploadId: string, parts: { ETag: string; PartNumber: number }[]) {
    await completeMultipartUpload(video.masterAccessUrl!, uploadId, parts);

    await db.update(videos).set({ status: "queued" }).where(eq(videos.id, video.id));

    console.log(`[VideoService] Upload complete, video ${video.id} is queued for dispatch`);

    return { status: "success", videoId: video.id };
  }

  /**
   * List parts of a multipart upload to resume it.
   *
   * @param video
   * @param uploadId
   * @returns
   */
  static async listParts(video: Video, uploadId: string) {
    if (!video.masterAccessUrl) throw new Error("Video has no access URL");
    return await listParts(video.masterAccessUrl, uploadId);
  }

  static async abortMultipart(video: Video, uploadId: string) {
    if (!video.masterAccessUrl) throw new Error("Video has no access URL");
    await abortMultipartUpload(video.masterAccessUrl!, uploadId);

    await db.update(videos).set({ status: "failed", errorReason: "Upload aborted" }).where(eq(videos.id, video.id));

    console.log(`[VideoService] Upload aborted for ${video.id}`);
    return { status: "success", videoId: video.id };
  }

  static async updateProcessingStatus(
    videoId: string,
    status: "processing" | "ready" | "failed",
    data?: {
      errorReason?: string;
      duration?: number;
      resolution?: string;
    },
  ) {
    await db
      .update(videos)
      .set({
        status,
        errorReason: data?.errorReason,
        duration: data?.duration,
        resolution: data?.resolution,
      })
      .where(eq(videos.id, videoId));

    console.log(`[Internal API] Video ${videoId} status updated to ${status}`);
    return { success: true };
  }
}
