import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

import { videos } from "@vidcastx/database/schema/video-schema";

/**
 * Schemas derived from Drizzle table using drizzle-typebox
 * These are the source of truth for validation and OpenAPI docs
 */

// Full video response (from database)
const _videoSelect = createSelectSchema(videos);
export const VideoResponse = t.Omit(_videoSelect, ["masterAccessUrl", "metadata"]);

// Create draft video (minimal fields, excludes system fields)
const _videoInsert = createInsertSchema(videos);
export const CreateVideoBody = t.Omit(_videoInsert, [
  "id",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "status",
  "orgId",
  "uploaderId",
  "masterAccessUrl",
  "playbackUrl",
  "errorReason",
  "duration",
  "resolution",
  "aspectRatio",
  "frameCount",
  "publishedAt",
]);

// Update video metadata
export const UpdateVideoBody = t.Partial(t.Pick(_videoSelect, ["title", "description", "visibility", "scheduledAt"]));

// Pagination query
export const PaginationQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
});

// Video ID param
export const VideoIdParam = t.Object({
  id: t.String({ pattern: "^vid_" }),
});

// Multipart upload init
export const MultipartInitBody = t.Object({
  contentType: t.String({ pattern: "^video/" }),
});

// Multipart sign part
export const MultipartSignQuery = t.Object({
  uploadId: t.String(),
  partNumber: t.Numeric({ minimum: 1 }),
});

// Multipart complete
export const MultipartCompleteBody = t.Object({
  uploadId: t.String(),
  parts: t.Array(
    t.Object({
      ETag: t.String(),
      PartNumber: t.Numeric(),
    }),
  ),
});

// Multipart list parts
export const MultipartListPartsQuery = t.Object({
  uploadId: t.String(),
});

// Multipart abort
export const MultipartAbortBody = t.Object({
  uploadId: t.String(),
});

// List response
export const VideoListResponse = t.Object({
  page: t.Numeric(),
  limit: t.Numeric(),
  total: t.Numeric(),
  videos: t.Array(VideoResponse),
});

// Create response
export const CreateVideoResponse = t.Object({
  status: t.Literal("created"),
  data: VideoResponse,
});

// Error response
export const ErrorResponse = t.Object({
  error: t.String(),
});

// Generic success response
export const SuccessResponse = t.Object({
  status: t.String(),
  videoId: t.String(),
});
