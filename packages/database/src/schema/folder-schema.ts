import { relations, sql } from "drizzle-orm";
import { boolean, foreignKey, index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { generateId } from "../utils/id";
import { organization, user } from "./auth-schema";
import { videos } from "./video-schema";

export const folderVisibilityEnum = pgEnum("folder_visibility", ["private", "public"]);

export const folders = pgTable(
  "folder",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("fld")),
    name: text("name").notNull(),
    parentId: text("parent_id"),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    visibility: folderVisibilityEnum("visibility").notNull().default("private"),
    color: varchar("color", { length: 7 }).notNull().default("#64748b"),
    coverImageUrl: text("cover_image_url"),
    description: text("description"),
    pinned: boolean("pinned").notNull().default(false),
    defaultVideoPrivate: boolean("default_video_private").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("folder_parentId_idx").on(table.parentId),
    index("folder_orgId_idx").on(table.orgId),
    index("folder_orgId_parentId_idx").on(table.orgId, table.parentId),
    index("folder_pinned_idx")
      .on(table.orgId, table.pinned)
      .where(sql`${table.pinned} = true`),
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
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: "folder_hierarchy",
  }),
  children: many(folders, {
    relationName: "folder_hierarchy",
  }),
  videos: many(videos),
}));
