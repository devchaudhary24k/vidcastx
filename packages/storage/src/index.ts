import fs from "fs";
import { pipeline } from "stream/promises";
import type { CompletedPart } from "@aws-sdk/client-s3";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "./env";

export const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID!,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
});

export const BUCKET_NAME = env.S3_BUCKET_NAME;

/**
 * Helper to generate a presigned URL for a given command.
 * Expiration is set to 1 hour.
 */
async function generatePresignedUrl(command: any) {
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Generates a presigned URL for uploading a file directly to S3.
 * @param key - The S3 key (file path).
 * @param contentType - The MIME type of the file.
 * @returns A promise that resolves to the signed upload URL.
 */
export async function getUploadUrl(key: string, contentType: string) {
  return generatePresignedUrl(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
  );
}

/**
 * Generates a presigned URL for downloading/viewing a file from S3.
 * @param key - The S3 key (file path).
 * @returns A promise that resolves to the signed download URL.
 */
export async function getDownloadUrl(key: string) {
  return generatePresignedUrl(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );
}

/**
 * Downloads a file from S3 and saves it to a local path.
 * @param key - The S3 key (file path).
 * @param localPath - The local file system path to save the file.
 */
export async function downloadToPath(key: string, localPath: string) {
  const { Body } = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );

  if (!Body) throw new Error("File not found in bucket");

  // @ts-expect-error - AWS SDK stream types are tricky with Node streams, but this works
  await pipeline(Body, fs.createWriteStream(localPath));
}

/**
 * Uploads a local file stream to S3 using multipart upload if necessary.
 * @param key - The S3 key (destination path).
 * @param fileStream - The read stream of the local file.
 * @param contentType - Optional MIME type.
 */
export async function uploadFile(
  key: string,
  fileStream: fs.ReadStream,
  contentType?: string,
) {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileStream,
      ContentType: contentType,
    },
  });

  return upload.done();
}

/**
 * Retrieves metadata for a file in S3 without downloading the content.
 * @param key - The S3 key (file path).
 * @returns File size, content type, and last modified date.
 */
export async function getFileMetadata(key: string) {
  const response = await s3Client.send(
    new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );
  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType,
    lastModified: response.LastModified,
  };
}

/**
 * Initiates a multipart upload.
 * @param key - The S3 key for the file.
 * @param contentType - The MIME type of the file.
 * @returns The UploadId for the multipart session.
 */
export async function initMultipartUpload(key: string, contentType: string) {
  const { UploadId } = await s3Client.send(
    new CreateMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
  );

  if (!UploadId) throw new Error("Failed to initialize multipart upload");
  return UploadId;
}

/**
 * Generates a presigned URL for uploading a specific part of a multipart upload.
 * @param key - The S3 key.
 * @param uploadId - The multipart upload session ID.
 * @param partNumber - The part number (index).
 * @returns A promise that resolves to the signed URL for the part.
 */
export async function signMultipartPart(
  key: string,
  uploadId: string,
  partNumber: number,
) {
  return generatePresignedUrl(
    new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    }),
  );
}

/**
 * Completes a multipart upload by stitching all parts together.
 * @param key - The S3 key.
 * @param uploadId - The multipart upload session ID.
 * @param parts - Array of completed parts with ETags.
 */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: CompletedPart[],
) {
  return s3Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }),
  );
}

/**
 * Aborts a multipart upload, cleaning up any uploaded parts.
 * @param key - The S3 key.
 * @param uploadId - The multipart upload session ID.
 */
export async function abortMultipartUpload(key: string, uploadId: string) {
  return s3Client.send(
    new AbortMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
    }),
  );
}

/**
 * Deletes a single file from S3.
 * @param key - The S3 key.
 */
export async function deleteFile(key: string) {
  return s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );
}

/**
 * Deletes a "folder" (all objects with a given prefix) from S3.
 * Handles pagination for folders with more than 1000 files.
 * @param prefix - The folder prefix (e.g., "videos/123/").
 */
export async function deleteFolder(prefix: string) {
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const listedObjects = await s3Client.send(listCommand);

  if (!listedObjects.Contents || listedObjects.Contents.length === 0) return;

  const deleteParams = {
    Bucket: BUCKET_NAME,
    Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) },
  };

  await s3Client.send(new DeleteObjectsCommand(deleteParams));

  if (listedObjects.IsTruncated) {
    await deleteFolder(prefix);
  }
}
