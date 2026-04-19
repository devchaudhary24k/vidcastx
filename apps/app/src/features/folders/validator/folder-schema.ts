import { z } from "zod";

export const FolderVisibilitySchema = z.enum(["private", "public"]);
export const FolderColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a valid color");

export const CreateFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(60, "Folder name must be 60 characters or less"),
  visibility: FolderVisibilitySchema,
  color: FolderColorSchema,
  coverImageUrl: z.url().nullable(),
  description: z.string().trim().max(280, "Description must be 280 characters or less").nullable(),
  pinned: z.boolean(),
  defaultVideoPrivate: z.boolean(),
});

export type CreateFolderInput = z.infer<typeof CreateFolderSchema>;
export type FolderVisibility = z.infer<typeof FolderVisibilitySchema>;
