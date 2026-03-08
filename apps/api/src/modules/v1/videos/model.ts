import { z } from "zod";

export const VideoModel = {
  // Common Params (Client sends ID in URL)
  params: z.object({
    id: z.string(),
  }),

  // Pagination Query
  pagination: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(10).optional(),
  }),

  // Create Draft
  create: z.object({
    title: z.string().min(3).max(100).optional(),
    folderId: z.string().optional(),
    filename: z.string().min(1),
    contentType: z.string().regex(/^video\//, "Must be a video file"),
    description: z.string().optional(),
  }),

  // Update Metadata
  update: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().optional(),
    visibility: z.enum(["public", "private", "unlisted"]).optional(),
    schedule: z.iso.datetime().optional(), // ISO Date string
  }),

  // Multipart
  multipartInit: z.object({
    contentType: z.string(),
  }),

  multipartSign: z.object({
    uploadId: z.string(),
    partNumber: z.coerce.number(),
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

  multipartListParts: z.object({
    uploadId: z.string(),
  }),

  multipartAbort: z.object({
    uploadId: z.string(),
  }),

  updateProcessingStatus: z.object({
    status: z.enum({ processing: "processing", ready: "ready", failed: "failed" }),
    playbackUrl: z.string().optional(),
    errorReason: z.string().optional(),
  }),
};
