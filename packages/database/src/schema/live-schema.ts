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
    id: text("id").primaryKey(), // NanoID
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    name: text("name").notNull(), // "Gaming Channel"
    streamKey: text("stream_key").notNull().unique(), // Persistent Secret (sk_live_...)

    // Status
    isLive: boolean("is_live").default(false).notNull(),
    lastLiveAt: timestamp("last_live_at"),

    // Customization (Optional)
    metadata: jsonb("metadata").default({}), // e.g., { "allowed_regions": ["US"] }

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // ⚠️ Soft Delete: Keep history even if channel is "removed"
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("channel_orgId_idx").on(table.orgId),
    index("channel_streamKey_idx").on(table.streamKey), // Critical for fast RTMP auth
  ],
);

export const streams = pgTable(
  "stream",
  {
    id: text("id").primaryKey(),
    channelId: text("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),

    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),

    // Stats for the "Session"
    viewerPeak: integer("viewer_peak").default(0),

    // Link to the VOD (created automatically)
    // set null: If user deletes the video, we still want the stream log
    recordingVideoId: text("recording_video_id").references(() => videos.id, {
      onDelete: "set null",
    }),

    // Billing
    // Stores duration in seconds once stream ends (easier for billing queries than diffing dates)
    durationSeconds: integer("duration_seconds"),
  },
  (table) => [index("stream_channelId_idx").on(table.channelId)],
);

export const webhooks = pgTable(
  "webhook",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    url: text("url").notNull(),
    secret: text("secret").notNull(), // HMAC secret for signing
    events: jsonb("events").notNull(), // ["video.ready", "stream.started"]
    isActive: boolean("is_active").default(true).notNull(),

    // Reliability Logic
    failureCount: integer("failure_count").default(0), // Auto-disable if > 10 failures
    lastTriggeredAt: timestamp("last_triggered_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    deletedAt: timestamp("deleted_at"),
  },
  (table) => [index("webhook_orgId_idx").on(table.orgId)],
);

// Relations
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
