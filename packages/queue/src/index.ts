import type { QueueOptions } from "bullmq";
import { Queue } from "bullmq";

import { redis } from "@vidcastx/redis";

import type { TranscodeJobData, TranscriptionJobData } from "./types";
import { QUEUES } from "./types";

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

export const transcodeQueue = new Queue<TranscodeJobData>(QUEUES.VIDEO_TRANSCODE, defaultOptions);

export const transciptionQueue = new Queue<TranscriptionJobData>(QUEUES.AI_TRANSCRIPTION, defaultOptions);
