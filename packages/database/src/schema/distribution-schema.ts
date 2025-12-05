import { relations } from "drizzle-orm";
import { jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { generateId } from "../utils/id";
import { organization } from "./auth-schema";
import { videos } from "./video-schema";

export const integrationProviderEnum = pgEnum("integration_provider", [
  "youtube",
  "twitch",
  "tiktok",
  "facebook",
]);

export const distributionStatusEnum = pgEnum("distribution_status", [
  "pending",
  "processing",
  "success",
  "failed",
]);

export const integrations = pgTable("integration", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("int")), // Unique identifier for the integration
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the integration
  provider: integrationProviderEnum("provider").notNull(), // The provider of the integration
  refreshToken: text("refresh_token").notNull(), // The refresh token for the integration
  accessToken: text("access_token"), // The access token for the integration
  expiresAt: timestamp("expires_at"), // The timestamp when the access token expires
  externalChannelId: text("external_channel_id"), // The external channel ID
  externalName: text("external_name"), // The external name of the channel
  metadata: jsonb("metadata").default({}), // Metadata associated with the integration
  createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the integration was created
  deletedAt: timestamp("deleted_at"), // The timestamp when the integration was deleted
});

export const distributionLogs = pgTable("distribution_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("dlog")), // Unique identifier for the distribution log
  videoId: text("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }), // The video associated with the log
  integrationId: text("integration_id")
    .notNull()
    .references(() => integrations.id, { onDelete: "cascade" }), // The integration associated with the log
  externalVideoId: text("external_video_id"), // The external video ID
  externalUrl: text("external_url"), // The external URL of the video
  status: distributionStatusEnum("status").default("pending").notNull(), // The status of the distribution
  errorLog: text("error_log"), // Log of any errors that occurred during distribution
  syncedAt: timestamp("synced_at").defaultNow(), // The timestamp when the distribution was synced
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
