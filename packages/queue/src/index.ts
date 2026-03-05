import { Queue, QueueOptions } from "bullmq";

import { redis } from "@vidcastx/redis";

import { QUEUES, TranscodeJobData, TranscriptionJobData } from "./types";

const defaultOptions: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const transcodeQueue = new Queue<TranscodeJobData>(
  QUEUES.VIDEO_TRANSCODE,
  defaultOptions,
);

export const transciptionQueue = new Queue<TranscriptionJobData>(
  QUEUES.AI_TRANSCRIPTION,
  defaultOptions,
);
