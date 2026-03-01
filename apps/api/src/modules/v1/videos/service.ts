import { and, eq } from "@vidcastx/database";
import { db } from "@vidcastx/database/client";
import { videos } from "@vidcastx/database/schema/video-schema";
import { generateId } from "@vidcastx/database/utils/id";
import {
  abortMultipartUpload,
  completeMultipartUpload,
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
        status: "waiting_upload",
        masterAccessUrl: s3Key,
        folderId: data.folderId || null,
      })
      .returning();

    return video;
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
    const uploadId = await initMultipartUpload(
      video.masterAccessUrl!,
      contentType,
    );

    return { uploadId, key: video.masterAccessUrl! };
  }

  /**
   * Generate a Presigned URL for a specific chunk (Part)
   */
  static async signPart(key: string, uploadId: string, partNumber: number) {
    return await signMultipartPart(key, uploadId, partNumber);
  }

  static async completeMultipart(
    video: Video,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ) {
    await completeMultipartUpload(video.masterAccessUrl!, uploadId, parts);

    await db
      .update(videos)
      .set({ status: "processing" })
      .where(eq(videos.id, video.id));

    //    TODO: Trigger BullMQ Worker here

    console.log(`[VideoService] Queued transcoding for ${video.id}`);
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

    await db
      .update(videos)
      .set({ status: "failed", errorReason: "Upload aborted" })
      .where(eq(videos.id, video.id));

    console.log(`[VideoService] Upload aborted for ${video.id}`);
    return { status: "success", videoId: video.id };
  }
}
