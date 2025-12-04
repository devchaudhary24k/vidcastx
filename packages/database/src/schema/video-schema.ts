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

import { generateId } from "../utils/id";
import { organization, user } from "./auth-schema";
import {
  transcripts,
  videoChapters,
  videoSummaries,
} from "./transcript-schema";

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

export const videos = pgTable(
  "video",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("vid")), // Unique identifier for the video
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the video
    uploaderId: text("uploader_id").references(() => user.id, {
      onDelete: "set null",
    }), // The user who uploaded the video
    title: text("title").notNull().default("Untitled Video"), // The title of the video
    description: text("description"), // The description of the video
    visibility: visibilityEnum("visibility").default("private").notNull(), // The visibility of the video
    scheduledAt: timestamp("scheduled_at"), // The timestamp when the video is scheduled to be published
    publishedAt: timestamp("published_at"), // The timestamp when the video was published
    status: videoStatusEnum("status").default("waiting_upload").notNull(), // The status of the video
    errorReason: text("error_reason"), // The reason for any errors
    duration: integer("duration"), // The duration of the video in seconds
    resolution: text("resolution"), // The resolution of the video
    aspectRatio: text("aspect_ratio"), // The aspect ratio of the video
    frameCount: integer("frame_count"), // The frame count of the video
    masterAccessUrl: text("master_access_url"), // The master access URL for the video
    metadata: jsonb("metadata").default({}), // Metadata associated with the video
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the video was created
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // The timestamp when the video was last updated
    deletedAt: timestamp("deleted_at"), // The timestamp when the video was deleted
  },
  (table) => [
    index("video_orgId_idx").on(table.orgId),
    index("video_status_idx").on(table.status),
  ],
);

export const assets = pgTable(
  "asset",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("ast")), // Unique identifier for the asset
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }), // The video associated with the asset
    type: assetTypeEnum("type").notNull(), // The type of asset
    storageKey: text("storage_key").notNull(), // The storage key for the asset
    playbackUrl: text("playback_url"), // The playback URL for the asset
    byteSize: bigint("byte_size", { mode: "number" }).default(0).notNull(), // The size of the asset in bytes
    language: text("language").default("en"), // The language of the asset
    label: text("label"), // The label of the asset
    isOriginal: boolean("is_original").default(false), // Whether the asset is the original one
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the asset was created
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // The timestamp when the asset was last updated
    deletedAt: timestamp("deleted_at"), // The timestamp when the asset was deleted
  },
  (table) => [index("asset_videoId_idx").on(table.videoId)],
);

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
