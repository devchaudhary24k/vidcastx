import { uploadActions } from "@dashboard/features/videos/stores/upload-store";
import client from "@dashboard/lib/api";
import AwsS3 from "@uppy/aws-s3";
import Uppy from "@uppy/core";

export const uppy = new Uppy({
  autoProceed: true,
  restrictions: {
    allowedFileTypes: ["video/*"],
  },
});

uppy.use(AwsS3, {
  id: "AwsS3",
  shouldUseMultipart: true,
  limit: 4,

  createMultipartUpload: async (file) => {
    const videoId = file.meta.videoId as string;
    if (!videoId) throw new Error("Missing videoId metadata");

    const { data: multipartInit } = await client.api.v1
      .videos({ id: videoId })
      .multipart.init.post({
        contentType: file.type,
      });

    if (!multipartInit) throw new Error("Failed API Call");
    return {
      uploadId: multipartInit.uploadId,
      key: multipartInit.key,
    };
  },

  signPart: async (file, partData) => {
    const videoId = file.meta.videoId as string;
    const { uploadId, partNumber } = partData;

    const { data: url } = await client.api.v1
      .videos({ id: videoId })
      .multipart["sign-part"].get({
        query: {
          uploadId,
          partNumber: partNumber,
        },
      });

    if (!url) throw new Error("Failed to sign part");
    return { url };
  },

  completeMultipartUpload: async (file, { uploadId, parts }) => {
    const videoId = file.meta.videoId as string;
    const formattedPart = parts.map((part) => ({
      PartNumber: part.PartNumber!,
      ETag: part.ETag!,
    }));

    const { data } = await client.api.v1
      .videos({ id: videoId })
      .multipart.complete.post({
        uploadId,
        parts: formattedPart,
      });

    return { location: "" };
  },

  abortMultipartUpload: async (file, { uploadId, key }) => {
    console.log("Abort requested for", uploadId);
    return;
  },

  listParts: async (file, { uploadId, key }) => {
    return [];
  },
});

uppy.on("file-added", (file) => {
  uploadActions.addUpload(file.id, {
    id: file.id,
    videoId: file.meta.videoId as string,
    filename: file.name,
    progress: 0,
    status: "uploading",
  });
});

uppy.on("upload-progress", (file, progress) => {
  if (file) {
    const total = progress.bytesTotal || 0;
    const uploaded = progress.bytesUploaded || 0;

    const percentage = total > 0 ? (uploaded / total) * 100 : 0;

    uploadActions.updateProgress(file.id, percentage);
  }
});

uppy.on("upload-success", (file) => {
  if (file) uploadActions.markComplete(file.id);
});

uppy.on("upload-error", (file, error) => {
  if (file) uploadActions.markError(file.id, error.message);
});
