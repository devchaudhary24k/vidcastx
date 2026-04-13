import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { TranscodeJobData } from "@vidcastx/queue/types";
import { Job, Worker } from "bullmq";

import { QUEUES } from "@vidcastx/queue/types";
import { redis } from "@vidcastx/redis";
import { downloadToPath, uploadFile } from "@vidcastx/storage";

import { notifyApiStatus } from "./api";
import { generateHoverPreview, generatePoster, runFFmpegTranscode } from "./ffmpeg";

console.log("Native HLS Transcoder Worker Started. Listening for jobs...");

const transcoderWorker = new Worker<TranscodeJobData>(
  QUEUES.VIDEO_TRANSCODE,
  async (job: Job<TranscodeJobData>) => {
    const { videoId, orgId, s3InputKey } = job.data;
    console.log(`\n[Job ${job.id}] Starting Video: ${videoId}`);

    // Create a unique temporary workspace for this specific job
    const jobWorkspace = path.join(os.tmpdir(), `vidcastx-transcode-${videoId}`);
    const inputPath = path.join(jobWorkspace, "source-video.mp4");
    const outputDir = path.join(jobWorkspace, "output_hls");

    try {
      await notifyApiStatus(videoId, "processing");
      // Prepare local directories
      await fsp.mkdir(jobWorkspace, { recursive: true });
      await fsp.mkdir(outputDir, { recursive: true });

      // Download Video
      console.log(`[Job ${job.id}] Downloading from S3: ${s3InputKey}`);
      await job.updateProgress(5);
      await downloadToPath(s3InputKey, inputPath);

      // Transcode (Adaptive Bitrate HLS)
      console.log(`[Job ${job.id}] Transcoding to HLS via FFmpeg...`);
      const probe = await runFFmpegTranscode({
        inputPath,
        outputDir,
        onProgress: async (percent) => {
          // Scale FFmpeg progress (0-100) to the middle chunk of the worker progress (10-90%)
          const overallProgress = 10 + Math.floor(percent * 0.8);
          await job.updateProgress(overallProgress);
        },
      });

      // Upload Output Directory
      // Because HLS creates many files (playlists + video chunks), we loop through and upload them all.
      // Utilizing the orgId guarantees isolation for multi-tenant users.
      console.log(`[Job ${job.id}] Uploading HLS chunks to S3...`);
      const outputFiles = await fsp.readdir(outputDir);
      let uploadedCount = 0;
      for (const fileName of outputFiles) {
        const filePath = path.join(outputDir, fileName);
        const s3TargetKey = `processed/${orgId}/${videoId}/${fileName}`;

        const contentType = fileName.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/MP2T";
        const fileStream = fs.createReadStream(filePath);
        await uploadFile(s3TargetKey, fileStream, contentType);

        uploadedCount++;
        const uploadProgress = 90 * Math.floor(uploadedCount / outputFiles.length);
        await job.updateProgress(uploadProgress);
      }
      // Generate poster + hover preview in parallel
      console.log(`[Job ${job.id}] Generating poster + hover preview...`);
      const posterPath = path.join(jobWorkspace, "poster.jpg");
      const previewPath = path.join(jobWorkspace, "preview.webm");
      const thumbnailKey = `thumbnails/${orgId}/${videoId}.jpg`;
      const previewKey = `previews/${orgId}/${videoId}.webm`;

      let uploadedThumbnailKey: string | undefined;
      let uploadedPreviewKey: string | undefined;

      try {
        await Promise.all([generatePoster(inputPath, posterPath), generateHoverPreview(inputPath, previewPath)]);

        await uploadFile(thumbnailKey, fs.createReadStream(posterPath), "image/jpeg");
        uploadedThumbnailKey = thumbnailKey;

        await uploadFile(previewKey, fs.createReadStream(previewPath), "video/webm");
        uploadedPreviewKey = previewKey;
      } catch (err) {
        // Poster/preview failure should not fail the main transcode
        console.error(`[Job ${job.id}] Poster/preview generation failed:`, err);
      }

      console.log(`[Job ${job.id}] 💾 Notifying API of completion...`);
      const masterPlaylistKey = `processed/${orgId}/${videoId}/master.m3u8`;

      await notifyApiStatus(videoId, "ready", {
        playbackKey: masterPlaylistKey,
        thumbnailKey: uploadedThumbnailKey,
        previewKey: uploadedPreviewKey,
        duration: Math.round(probe.duration),
        resolution: `${probe.height}p`,
      });

      await job.updateProgress(100);
      return { status: "success", playbackUrl: masterPlaylistKey };
    } catch (err: any) {
      console.error(`\n[Job ${job.id}] Failed:`, err.message);

      await notifyApiStatus(videoId, "failed", { errorReason: err.message });

      throw err;
    } finally {
      await fsp.rm(jobWorkspace, { recursive: true, force: true }).catch(() => {});
      console.log(`[Job ${job.id}] Cleaned up local workspace.`);
    }
  },
  {
    connection: redis,
    concurrency: 1,
  },
);

transcoderWorker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} completely failed after retries. Error: ${err.message}`);
});

transcoderWorker.on("completed", (job) => {
  console.log(`Job ${job.id} has completed successfully!`);
});
