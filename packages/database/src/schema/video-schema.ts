import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth-schema"; // Importing FK targets

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
  "audio_track",
  "subtitle_track",
  "storyboard",
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
    status: videoStatusEnum("status").default("waiting_upload").notNull(),

    // Technical Metadata
    duration: integer("duration"), // in seconds
    resolution: text("resolution"), // e.g. "1920x1080"
    aspectRatio: text("aspect_ratio"), // e.g. "16:9"
    frameCount: integer("frame_count"),

    // Security
    masterAccessUrl: text("master_access_url"), // Signed URL for raw file

    // Custom Data
    metadata: jsonb("metadata").default({}), // Tags, Categories

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("video_orgId_idx").on(table.orgId)],
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
    playbackUrl: text("playback_url"), // Public CDN URL (optional caching)

    // Globalization Support
    language: text("language").default("en"), // 'en', 'es', 'fr'
    label: text("label"), // "Spanish Dub"
    isOriginal: boolean("is_original").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
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
  // Analytics relations are defined in analytics-schema.ts
  // Transcript relations are defined in transcript-schema.ts
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  video: one(videos, {
    fields: [assets.videoId],
    references: [videos.id],
  }),
}));
