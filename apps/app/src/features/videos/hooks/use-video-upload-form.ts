import { useForm } from "@tanstack/react-form";

import type { VideoUploadFormValues } from "../schemas";
import { videoUploadFormOpts } from "../lib/video-upload-form-opts";
import { videoUploadSchema } from "../schemas";

/**
 * Builds the TanStack Form instance for the video-upload flow. Extracted into a
 * hook so the return type can be captured as `VideoUploadForm` and shared with
 * child subcomponents as a typed prop — no need for `createFormHook`/`withForm`
 * gymnastics when the form is only composed in one tree.
 */
export function useVideoUploadForm(onSubmit: (value: VideoUploadFormValues) => Promise<void> | void) {
  return useForm({
    ...videoUploadFormOpts,
    validators: { onSubmit: videoUploadSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });
}

export type VideoUploadForm = ReturnType<typeof useVideoUploadForm>;
