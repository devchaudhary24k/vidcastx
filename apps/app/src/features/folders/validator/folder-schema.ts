import { z } from "zod";

export const FolderVisibilitySchema = z.enum(["private", "unlisted", "public"]);
export const FolderColorSchema = z.enum(["slate", "blue", "green", "purple", "pink", "amber", "rose"]);

export const CreateFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(60, "Folder name must be 60 characters or less"),
  visibility: FolderVisibilitySchema,
  color: FolderColorSchema,
  coverImageUrl: z.string().url().nullable(),
  description: z.string().trim().max(280, "Description must be 280 characters or less").nullable(),
  pinned: z.boolean(),
  defaultVideoPrivate: z.boolean(),
  passwordProtected: z.boolean(),
});

export type CreateFolderInput = z.infer<typeof CreateFolderSchema>;
