import { relations } from "drizzle-orm";
import { jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "./auth-schema";
import { videos } from "./video-schema";

// 1. Strict Enums
export const integrationProviderEnum = pgEnum("integration_provider", [
  "youtube",
  "twitch",
  "tiktok", // Good to keep for future expansion
  "facebook",
]);

export const distributionStatusEnum = pgEnum("distribution_status", [
  "pending",
  "processing", // Uploading to external provider
  "success",
  "failed",
]);

export const integrations = pgTable("integration", {
  id: text("id").primaryKey(), // NanoID
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  provider: integrationProviderEnum("provider").notNull(),

  // Security: Encrypt 'refreshToken' in your app logic before saving!
  refreshToken: text("refresh_token").notNull(),
  accessToken: text("access_token"), // Ephemeral
  expiresAt: timestamp("expires_at"),

  // Channel Metadata
  externalChannelId: text("external_channel_id"), // e.g., UC1234...
  externalName: text("external_name"), // "My Gaming Channel"
  metadata: jsonb("metadata").default({}), // Store avatar URL, subscriber count, etc.

  createdAt: timestamp("created_at").defaultNow().notNull(),

  // ⚠️ Soft Delete: If user disconnects, we keep history but mark as inactive
  deletedAt: timestamp("deleted_at"),
});

export const distributionLogs = pgTable("distribution_log", {
  id: text("id").primaryKey(),
  videoId: text("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  integrationId: text("integration_id")
    .notNull()
    .references(() => integrations.id, { onDelete: "cascade" }),

  // The Result
  externalVideoId: text("external_video_id"), // e.g. YouTube "dQw4w9WgXcQ"
  externalUrl: text("external_url"), // Full clickable link

  // State
  status: distributionStatusEnum("status").default("pending").notNull(),
  errorLog: text("error_log"), // "YouTube API Error: Title too long"

  syncedAt: timestamp("synced_at").defaultNow(),
});

// Relations
export const integrationsRelations = relations(
  integrations,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [integrations.orgId],
      references: [organization.id],
    }),
    logs: many(distributionLogs),
  }),
);

export const distributionLogsRelations = relations(
  distributionLogs,
  ({ one }) => ({
    video: one(videos, {
      fields: [distributionLogs.videoId],
      references: [videos.id],
    }),
    integration: one(integrations, {
      fields: [distributionLogs.integrationId],
      references: [integrations.id],
    }),
  }),
);
