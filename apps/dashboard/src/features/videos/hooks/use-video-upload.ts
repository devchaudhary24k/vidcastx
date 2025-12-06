import { useState } from "react";
import client from "@dashboard/lib/api";
import AwsS3 from "@uppy/aws-s3";
import Uppy from "@uppy/core";

export const useVideoUpload = () => {
  const [uppy] = useState(
    () =>
      new Uppy({
        autoProceed: true,
        restrictions: {
          maxNumberOfFiles: 1,
          allowedFileTypes: ["video/*"],
        },
      }),
  );

  const startUploadProcess = async (file: File) => {
    try {
      const { data: draftResponse } = await client.api.v1.videos.post({
        filename: "",
        description: "",
        contentType: file.type,
      });

      if (!draftResponse || !draftResponse.data)
        return new Error("Failed API Call");
      const videoId = draftResponse.data.id;

      const existingPlugin = uppy.getPlugin("AwsS3");
      if (existingPlugin) uppy.removePlugin(existingPlugin);

      uppy.use(AwsS3, {
        shouldUseMultipart: true,
        limit: 4,

        createMultipartUpload: async (file) => {
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
    } catch (err) {
      console.error(err);
    }
  };
  return { uppy, startUploadProcess };
};
