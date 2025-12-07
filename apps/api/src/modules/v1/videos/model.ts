import { z } from "zod";

// Default NanoID is 21 characters
export const VideoModel = {
  // 1. Common Params (Client sends ID in URL)
  params: z.object({
    id: z.string(),
  }),

  // 2. Pagination Query
  pagination: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(10).optional(),
  }),

  // 3. Create Draft
  create: z.object({
    title: z.string().min(3).max(100).optional(),
    folderId: z.string().optional(),
    filename: z.string().min(1),
    contentType: z.string().regex(/^video\//, "Must be a video file"),
    description: z.string().optional(),
  }),

  // 4. Update Metadata
  update: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().optional(),
    visibility: z.enum(["public", "private", "unlisted"]).optional(),
    schedule: z.iso.datetime().optional(), // ISO Date string
  }),

  // =========================================
  // MULTIPART UPLOAD MODELS
  // =========================================

  multipartInit: z.object({
    contentType: z.string(),
  }),

  multipartSign: z.object({
    uploadId: z.string(),
    partNumber: z.coerce.number(),
    // NOTE: We do NOT ask the client for 'key' anymore.
    // We get the key securely from the 'video' object in the database.
  }),

  multipartComplete: z.object({
    uploadId: z.string(),
    parts: z.array(
      z.object({
        ETag: z.string(),
        PartNumber: z.number(),
      }),
    ),
  }),
};
