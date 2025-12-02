import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization } from "./auth-schema";
import { assets, videos } from "./video-schema";

// 1. Strict Enums for Safety
export const jobTypeEnum = pgEnum("ai_job_type", [
  "transcribe",
  "translate",
  "dub",
  "clean_mode",
  "generate_metadata", // Summaries/Chapters
]);

export const jobStatusEnum = pgEnum("ai_job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const aiJobs = pgTable("ai_job", {
  id: text("id").primaryKey(), // NanoID
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  videoId: text("video_id").references(() => videos.id, {
    onDelete: "set null",
  }),
  params: jsonb("params").default({}).notNull(),

  type: jobTypeEnum("type").notNull(),
  provider: text("provider").notNull(),
  tokensUsed: integer("tokens_used").default(0),
  costInCents: integer("cost_in_cents").default(0), // The Money Field
  executionTimeMs: integer("execution_time_ms"), // How long did it take?

  // State
  status: jobStatusEnum("status").default("pending").notNull(),
  errorLog: text("error_log"),

  outputAssetId: text("output_asset_id").references(() => assets.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const aiJobsRelations = relations(aiJobs, ({ one }) => ({
  organization: one(organization, {
    fields: [aiJobs.orgId],
    references: [organization.id],
  }),
  video: one(videos, {
    fields: [aiJobs.videoId],
    references: [videos.id],
  }),
  outputAsset: one(assets, {
    fields: [aiJobs.outputAssetId],
    references: [assets.id],
  }),
}));
