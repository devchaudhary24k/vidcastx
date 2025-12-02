import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization } from "./auth-schema";
import { videos } from "./video-schema";

export const channels = pgTable(
  "channel",
  {
    id: text("id").primaryKey(), // Unique identifier for the channel
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the channel
    name: text("name").notNull(), // The name of the channel
    streamKey: text("stream_key").notNull().unique(), // The stream key for the channel
    isLive: boolean("is_live").default(false).notNull(), // Whether the channel is currently live
    lastLiveAt: timestamp("last_live_at"), // The timestamp when the channel was last live
    metadata: jsonb("metadata").default({}), // Metadata associated with the channel
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the channel was created
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // The timestamp when the channel was last updated
    deletedAt: timestamp("deleted_at"), // The timestamp when the channel was deleted
  },
  (table) => [
    index("channel_orgId_idx").on(table.orgId),
    index("channel_streamKey_idx").on(table.streamKey),
  ],
);

export const streams = pgTable(
  "stream",
  {
    id: text("id").primaryKey(), // Unique identifier for the stream
    channelId: text("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }), // The channel associated with the stream
    startedAt: timestamp("started_at").defaultNow().notNull(), // The timestamp when the stream started
    endedAt: timestamp("ended_at"), // The timestamp when the stream ended
    viewerPeak: integer("viewer_peak").default(0), // The peak number of viewers
    recordingVideoId: text("recording_video_id").references(() => videos.id, {
      onDelete: "set null",
    }), // The video recording of the stream
    durationSeconds: integer("duration_seconds"), // The duration of the stream in seconds
  },
  (table) => [index("stream_channelId_idx").on(table.channelId)],
);

export const webhooks = pgTable(
  "webhook",
  {
    id: text("id").primaryKey(), // Unique identifier for the webhook
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the webhook
    url: text("url").notNull(), // The URL of the webhook
    secret: text("secret").notNull(), // The secret for the webhook
    events: jsonb("events").notNull(), // The events that trigger the webhook
    isActive: boolean("is_active").default(true).notNull(), // Whether the webhook is active
    failureCount: integer("failure_count").default(0), // The number of times the webhook has failed
    lastTriggeredAt: timestamp("last_triggered_at"), // The timestamp when the webhook was last triggered
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the webhook was created
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // The timestamp when the webhook was last updated
    deletedAt: timestamp("deleted_at"), // The timestamp when the webhook was deleted
  },
  (table) => [index("webhook_orgId_idx").on(table.orgId)],
);

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

export const webhooksRelations = relations(webhooks, ({ one }) => ({
  organization: one(organization, {
    fields: [webhooks.orgId],
    references: [organization.id],
  }),
}));
