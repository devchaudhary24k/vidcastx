import { z } from "zod";

export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/mov",
  "video/quicktime",
  "video/webm",
];

export const videoUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  visibility: z.enum(["public", "private", "unlisted"]),
  scheduledAt: z.date().optional(),
  file: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "Video file is required.")
    .refine((files) => {
      const file = files?.[0];
      return !!file && file.size <= MAX_FILE_SIZE;
    }, `Max file size is 5GB.`)
    .refine((files) => {
      const file = files?.[0];
      return !!file && ACCEPTED_VIDEO_TYPES.includes(file.type);
    }, "Only .mp4, .mov, and .webm formats are supported."),
});

export type VideoUploadFormValues = z.infer<typeof videoUploadSchema>;
