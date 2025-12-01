import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization } from "./auth-schema";
import { videos } from "./video-schema";

export const channels = pgTable("channel", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  streamKey: text("stream_key").notNull().unique(), // The Persistent Secret

  isLive: boolean("is_live").default(false).notNull(),
  lastLiveAt: timestamp("last_live_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const streams = pgTable("stream", {
  id: text("id").primaryKey(),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),

  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),

  viewerPeak: integer("viewer_peak").default(0),
  // If we auto-record the stream, we link it here
  recordingVideoId: text("recording_video_id").references(() => videos.id),
});

export const webhooks = pgTable("webhook", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  url: text("url").notNull(),
  secret: text("secret").notNull(), // HMAC secret
  events: jsonb("events").notNull(), // ["video.ready", "stream.started"]
  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channelsRelations = relations(channels, ({ one, many }) => ({
  organization: one(organization, {
    fields: [channels.orgId],
    references: [organization.id],
  }),
  streams: many(streams),
}));

export const streamsRelations = relations(streams, ({ one }) => ({
  channel: one(channels, {
    fields: [streams.channelId],
    references: [channels.id],
  }),
  recording: one(videos, {
    fields: [streams.recordingVideoId],
    references: [videos.id],
  }),
}));
