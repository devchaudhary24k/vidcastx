import { z } from "zod";

// Default NanoID is 21 characters and uses A-Za-z0-9_-
const nanoIdValidation = z
  .string()
  .length(21, "ID must be a valid NanoID (21 chars)")
  .regex(/^[A-Za-z0-9_-]+$/, "ID contains invalid characters");

export const VideoModel = {
  // 1. Updated ID validation for NanoID
  params: z.object({
    id: nanoIdValidation,
  }),

  // 2. Query parameters for Pagination
  pagination: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(10).optional(),
  }),

  // 3. Body for creating a draft
  create: z.object({
    title: z.string().min(3).max(100),
    description: z.string().optional(),
  }),

  // 4. Body for updating metadata
  update: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().optional(),
    visibility: z.enum(["public", "private", "unlisted"]).optional(),
    schedule: z.iso.datetime().optional(),
  }),
};
