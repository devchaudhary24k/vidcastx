import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "./auth-schema";
import { videos } from "./video-schema";

export const integrationProviderEnum = pgEnum("integration_provider", [
  "youtube",
  "tiktok",
  "twitch",
]);

export const integrations = pgTable("integration", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  provider: integrationProviderEnum("provider").notNull(),

  // Security: Encrypt 'refreshToken' in your app logic before saving!
  refreshToken: text("refresh_token").notNull(),
  accessToken: text("access_token"),
  expiresAt: timestamp("expires_at"),

  externalChannelId: text("external_channel_id"),
  externalName: text("external_name"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const distributionLogs = pgTable("distribution_log", {
  id: text("id").primaryKey(),
  videoId: text("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  integrationId: text("integration_id")
    .notNull()
    .references(() => integrations.id, { onDelete: "cascade" }),

  externalVideoId: text("external_video_id"), // e.g. YouTube ID
  status: text("status").default("pending"),

  syncedAt: timestamp("synced_at").defaultNow(),
});

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
