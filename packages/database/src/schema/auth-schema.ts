import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { aiJobs } from "./ai-schema";
import { integrations } from "./distribution-schema";
import { channels, webhooks } from "./live-schema";
import { videos } from "./video-schema";

export const user = pgTable("user", {
  id: text("id").primaryKey(), // Unique identifier for the user
  name: text("name").notNull(), // The name of the user
  email: text("email").notNull().unique(), // The email of the user
  emailVerified: boolean("email_verified").default(false).notNull(), // Whether the email is verified
  image: text("image"), // The image URL of the user
  createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the user was created
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(), // The timestamp when the user was last updated
  firstName: text("first_name"), // The first name of the user
  lastName: text("last_name"), // The last name of the user
  deletedAt: timestamp("deleted_at"), // The timestamp when the user was deleted
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(), // Unique identifier for the session
    expiresAt: timestamp("expires_at").notNull(), // The timestamp when the session expires
    token: text("token").notNull().unique(), // The session token
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the session was created
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(), // The timestamp when the session was last updated
    ipAddress: text("ip_address"), // The IP address of the session
    userAgent: text("user_agent"), // The user agent of the session
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }), // The user associated with the session
    activeOrganizationId: text("active_organization_id"), // The active organization ID for the session
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(), // Unique identifier for the account
    accountId: text("account_id").notNull(), // The account ID
    providerId: text("provider_id").notNull(), // The provider ID
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }), // The user associated with the account
    accessToken: text("access_token"), // The access token
    refreshToken: text("refresh_token"), // The refresh token
    idToken: text("id_token"), // The ID token
    accessTokenExpiresAt: timestamp("access_token_expires_at"), // The timestamp when the access token expires
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"), // The timestamp when the refresh token expires
    scope: text("scope"), // The scope of the account
    password: text("password"), // The password of the account
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the account was created
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(), // The timestamp when the account was last updated
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(), // Unique identifier for the verification
    identifier: text("identifier").notNull(), // The identifier for the verification
    value: text("value").notNull(), // The value of the verification
    expiresAt: timestamp("expires_at").notNull(), // The timestamp when the verification expires
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the verification was created
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(), // The timestamp when the verification was last updated
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = pgTable("organization", {
  id: text("id").primaryKey(), // Unique identifier for the organization
  name: text("name").notNull(), // The name of the organization
  slug: text("slug").notNull().unique(), // The slug of the organization
  logo: text("logo"), // The logo URL of the organization
  createdAt: timestamp("created_at").notNull(), // The timestamp when the organization was created
  metadata: text("metadata"), // Metadata associated with the organization
  deletedAt: timestamp("deleted_at"), // The timestamp when the organization was deleted
});

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(), // Unique identifier for the member
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the member
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }), // The user associated with the member
    role: text("role").default("member").notNull(), // The role of the member
    createdAt: timestamp("created_at").notNull(), // The timestamp when the member was created
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(), // Unique identifier for the invitation
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the invitation
    email: text("email").notNull(), // The email of the invitee
    role: text("role"), // The role of the invitee
    status: text("status").default("pending").notNull(), // The status of the invitation
    expiresAt: timestamp("expires_at").notNull(), // The timestamp when the invitation expires
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the invitation was created
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }), // The user who sent the invitation
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),

  videos: many(videos),
  channels: many(channels),
  webhooks: many(webhooks),
  integrations: many(integrations),
  aiJobs: many(aiJobs),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));
