export const QUEUES = {
  VIDEO_TRANSCODE: "video-transcode",
  VIDEO_THUMBNAIL: "video-thumbnail",
  AI_TRANSCRIPTION: "ai-transcription",
  AI_METADATA: "ai-metadata",
  NOTIFICATIONS: "notifications",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

// Define specific job payloads
export interface TranscodeJobData {
  videoId: string;
  orgId: string;
  s3InputKey: string;
  userId: string;
}

export interface TranscriptionJobData {
  videoId: string;
  orgId: string;
  audioAssetId: string;
}
