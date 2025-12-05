import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { generateId } from "../utils/id";
import { organization, user } from "./auth-schema";
import { videos } from "./video-schema";

export const folders = pgTable(
  "folder",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("fld")), // Unique identifier for the folder
    name: text("name").notNull(), // The name of the folder
    parentId: text("parent_id"), // The Tree Logic
    orgId: text("org_id") // Ownership
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("folder_parentId_idx").on(table.parentId),
    index("folder_orgId_idx").on(table.orgId),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "folders_parent_id_fk",
    }).onDelete("cascade"),
  ],
);

export const foldersRelations = relations(folders, ({ one, many }) => ({
  organization: one(organization, {
    fields: [folders.orgId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [folders.createdById],
    references: [user.id],
  }),

  // Hierarchy
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: "folder_hierarchy",
  }),
  children: many(folders, {
    relationName: "folder_hierarchy",
  }),

  // Content inside folders
  videos: many(videos),
}));
