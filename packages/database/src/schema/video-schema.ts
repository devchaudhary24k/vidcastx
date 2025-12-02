import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth-schema";
import {
  transcripts,
  videoChapters,
  videoSummaries,
} from "./transcript-schema";

// Enums
export const videoStatusEnum = pgEnum("video_status", [
  "waiting_upload",
  "processing",
  "ready",
  "failed",
]);

export const visibilityEnum = pgEnum("visibility", [
  "public",
  "private",
  "unlisted",
]);

export const assetTypeEnum = pgEnum("asset_type", [
  "hls_playlist",
  "thumbnail",
  "preview_gif",
  "audio_track",
  "subtitle_track",
  "storyboard",
  "source_file",
]);

// Tables
export const videos = pgTable(
  "video",
  {
    id: text("id").primaryKey(), // NanoID
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    uploaderId: text("uploader_id").references(() => user.id, {
      onDelete: "set null",
    }),

    title: text("title").notNull().default("Untitled Video"),
    description: text("description"),
    visibility: visibilityEnum("visibility").default("private").notNull(),
    scheduledAt: timestamp("scheduled_at"),
    publishedAt: timestamp("published_at"),
    status: videoStatusEnum("status").default("waiting_upload").notNull(),
    errorReason: text("error_reason"),

    // Technical Metadata
    duration: integer("duration"), // in seconds
    resolution: text("resolution"), // "1920x1080"
    aspectRatio: text("aspect_ratio"), // "16:9"
    frameCount: integer("frame_count"),

    // Security
    masterAccessUrl: text("master_access_url"), // Signed URL for raw file

    // Custom Data
    metadata: jsonb("metadata").default({}),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("video_orgId_idx").on(table.orgId),
    index("video_status_idx").on(table.status),
  ],
);

export const assets = pgTable(
  "asset",
  {
    id: text("id").primaryKey(),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),

    type: assetTypeEnum("type").notNull(),
    storageKey: text("storage_key").notNull(), // S3 Path
    playbackUrl: text("playback_url"),
    byteSize: bigint("byte_size", { mode: "number" }).default(0).notNull(),

    // Globalization Support
    language: text("language").default("en"),
    label: text("label"),
    isOriginal: boolean("is_original").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [index("asset_videoId_idx").on(table.videoId)],
);

// Relations
export const videosRelations = relations(videos, ({ one, many }) => ({
  organization: one(organization, {
    fields: [videos.orgId],
    references: [organization.id],
  }),
  uploader: one(user, {
    fields: [videos.uploaderId],
    references: [user.id],
  }),
  assets: many(assets),

  transcripts: many(transcripts),
  chapters: many(videoChapters),
  summaries: many(videoSummaries),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  video: one(videos, {
    fields: [assets.videoId],
    references: [videos.id],
  }),
}));
