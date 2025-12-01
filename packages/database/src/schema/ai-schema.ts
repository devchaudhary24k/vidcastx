import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "./auth-schema";
import { videos } from "./video-schema";

export const jobTypeEnum = pgEnum("ai_job_type", [
  "transcribe",
  "translate",
  "dub",
  "clean_mode",
]);

export const aiJobs = pgTable("ai_job", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  videoId: text("video_id").references(() => videos.id, {
    onDelete: "set null",
  }),

  type: jobTypeEnum("type").notNull(),
  provider: text("provider").notNull(), // 'openai', 'elevenlabs'

  // Cost Tracking (Crucial for Startup Model)
  tokensUsed: integer("tokens_used"),
  costInCents: integer("cost_in_cents"),

  status: text("status").default("pending").notNull(),
  errorLog: text("error_log"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
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
}));
