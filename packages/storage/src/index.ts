import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage"; // ⚠️ You need to install this package
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "./env";

// 1. Configuration
export const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID!,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
});

export const BUCKET_NAME = env.S3_BUCKET_NAME!;

// ==================================================================
// 🌐 FRONTEND HELPERS (Presigned URLs)
// ==================================================================

/**
 * Generate a Presigned URL for direct uploads (Browser -> S3)
 */
export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Get a secure URL to view the file (Browser <- S3)
 */
export async function getDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// ==================================================================
// ⚙️ WORKER HELPERS (Server-Side IO)
// ==================================================================

/**
 * Download a file from S3 to the local disk.
 * Critical for FFmpeg which needs a physical file to process efficiently.
 */
export async function downloadToPath(key: string, localPath: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const { Body } = await s3Client.send(command);

  if (!Body) throw new Error("File not found in bucket");

  // Stream the S3 data directly to a file (Memory efficient for 10GB files)
  await pipeline(Body as any, fs.createWriteStream(localPath));
}

/**
 * Upload a local file (stream) to S3.
 * Uses @aws-sdk/lib-storage for automatic multipart uploads (faster/safer).
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
 * Get File Metadata (Size, ContentType) without downloading it.
 * Essential for BILLING (Storage GB usage).
 */
export async function getFileMetadata(key: string) {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType,
    lastModified: response.LastModified,
  };
}

// ==================================================================
// 🧹 MANAGEMENT & CLEANUP
// ==================================================================

/**
 * Delete a single file
 */
export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return s3Client.send(command);
}

/**
 * Delete a "Folder" (Prefix).
 * Essential for deleting an HLS video which contains 100+ .ts segments.
 */
export async function deleteFolder(prefix: string) {
  // 1. List all objects with this prefix
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const listedObjects = await s3Client.send(listCommand);

  if (!listedObjects.Contents || listedObjects.Contents.length === 0) return;

  // 2. Create delete objects array
  const deleteParams = {
    Bucket: BUCKET_NAME,
    Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) },
  };

  // 3. Delete them all in one request
  const deleteCommand = new DeleteObjectsCommand(deleteParams);
  await s3Client.send(deleteCommand);

  // 4. Recursion: If truncated (more than 1000 files), run again
  if (listedObjects.IsTruncated) {
    await deleteFolder(prefix);
  }
}
