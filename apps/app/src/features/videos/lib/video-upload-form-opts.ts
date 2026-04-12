import { formOptions } from "@tanstack/react-form";

import type { VideoUploadFormValues } from "../schemas";

const defaultValues: VideoUploadFormValues = {
  title: "",
  description: "",
  visibility: "public",
  scheduledAt: undefined,
  file: undefined,
};

/**
 * Shared form options for the video-upload form. Used by `useForm` in the
 * top-level form component and by `withForm(...)` in each child subcomponent so
 * every piece stays typed against the same default-values shape.
 */
export const videoUploadFormOpts = formOptions({ defaultValues });
