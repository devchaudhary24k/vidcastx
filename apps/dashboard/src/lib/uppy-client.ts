import { uploadActions } from "@dashboard/features/videos/stores/upload-store";
import client from "@dashboard/lib/api";
import AwsS3 from "@uppy/aws-s3";
import Uppy from "@uppy/core";

type UppyMeta = {
  videoId: string;
  [key: string]: unknown; // Uppy requires an index signature for other dynamic meta it might add
};

export const uppy = new Uppy<UppyMeta>({
  autoProceed: true,
  restrictions: {
    allowedFileTypes: ["video/*"],
    maxFileSize: 50 * 1024 * 1024 * 1024, // 50GB
  },
});

uppy.use(AwsS3, {
  id: "AwsS3",
  shouldUseMultipart: true,
  limit: 4,

  createMultipartUpload: async (file) => {
    const videoId = file.meta.videoId as string;
    if (!videoId) throw new Error("Missing videoId metadata");

    const { data: multipartInit } = await client.api.v1.videos({ id: videoId }).multipart.init.post({
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
    if (!uploadId) throw new Error("Missing uploadId");

    const { data } = await client.api.v1.videos({ id: videoId }).multipart["sign-part"].get({
      query: {
        uploadId,
        partNumber: partNumber,
      },
    });

    if (!data) throw new Error("Failed to sign part");
    return { url: data.url };
  },

  completeMultipartUpload: async (file, { uploadId, parts }) => {
    const videoId = file.meta.videoId as string;
    const formattedPart = parts.map((part) => ({
      PartNumber: part.PartNumber!,
      ETag: part.ETag!,
    }));

    await client.api.v1.videos({ id: videoId }).multipart.complete.post({
      uploadId,
      parts: formattedPart,
    });

    return { location: "" };
  },

  abortMultipartUpload: async (file, { uploadId }) => {
    if (!uploadId) throw new Error("Missing uploadId");
    const videoId = file.meta.videoId as string;

    await client.api.v1.videos({ id: videoId }).multipart.abort.delete({
      uploadId,
    });
    return;
  },

  listParts: async (file, { uploadId }) => {
    if (!uploadId) throw new Error("Missing uploadId");
    const videoId = file.meta.videoId as string;

    const { data } = await client.api.v1.videos({ id: videoId }).multipart["list-parts"].get({
      query: { uploadId },
    });

    return data || [];
  },
});

uppy.on("file-added", (file) => {
  uploadActions.addUpload(file.id, {
    id: file.id,
    videoId: file.meta.videoId,
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
