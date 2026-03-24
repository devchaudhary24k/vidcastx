import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

import { videos } from "@vidcastx/database/schema/video-schema";

/**
 * Schemas derived from Drizzle table using drizzle-typebox
 * These are the source of truth for validation and OpenAPI docs
 */

// Full video response (from database)
const _videoSelect = createSelectSchema(videos);
export const VideoResponse = t.Omit(_videoSelect, ["masterAccessUrl", "metadata"]);

// Create draft video — filename and contentType are API-only, not stored in DB
export const CreateVideoBody = t.Object({
  filename: t.String({ minLength: 1 }),
  contentType: t.String({ pattern: "^video/" }),
  title: t.Optional(t.String({ minLength: 3, maxLength: 200 })),
  folderId: t.Optional(t.Nullable(t.String())),
  description: t.Optional(t.String()),
});

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

// Multipart init response
export const MultipartInitResponse = t.Object({
  uploadId: t.String(),
  key: t.String(),
});

// Multipart sign-part response
export const MultipartSignResponse = t.Object({
  url: t.String(),
});

// Multipart list-parts response
export const MultipartPartsResponse = t.Array(
  t.Object({
    PartNumber: t.Optional(t.Number()),
    ETag: t.Optional(t.String()),
    Size: t.Optional(t.Number()),
  }),
);
