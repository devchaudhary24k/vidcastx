import { useState } from "react";
import client from "@dashboard/lib/api";
import { uppy } from "@dashboard/lib/uppy-client";

export const useVideoUpload = () => {
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  const startUploadProcess = async (
    file: File,
    metadata: {
      title: string;
      description?: string;
      visibility: string;
    },
  ) => {
    setIsCreatingDraft(true);
    try {
      // 1. Create DB Entry
      const { data: draftResponse } = await client.api.v1.videos.post({
        filename: metadata.title,
        description: metadata.description || "",
        contentType: file.type,
      });

      if (!draftResponse || !draftResponse.data) {
        throw new Error("Failed to create video draft");
      }

      const videoId = draftResponse.data.id;

      // 2. Add to Singleton Uppy (Starts automatically due to autoProceed: true)
      uppy.addFile({
        name: file.name,
        type: file.type,
        data: file,
        meta: {
          videoId,
          ...metadata,
        },
      });

      return videoId;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsCreatingDraft(false);
    }
  };

  return { startUploadProcess, isCreatingDraft };
};
