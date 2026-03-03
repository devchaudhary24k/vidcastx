import type { BetterAuthOptions } from "better-auth";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession, openAPI, organization } from "better-auth/plugins";

import { and, eq, isNull } from "@vidcastx/database";
import { db } from "@vidcastx/database/client";
import {
  member as memberTable,
  organization as organizationTable,
  session as sessionTable,
  user as userTable,
} from "@vidcastx/database/schema/auth-schema";
import { redis } from "@vidcastx/redis";

import { env } from "./env";

const authOptions = {
  appName: "VidcastX",

  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  secondaryStorage: {
    get: async (key) => {
      return redis.get(key);
    },
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(key, value, "EX", ttl);
      else await redis.set(key, value);
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },

  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 32,
    sendResetPassword: async ({ user, url }) => {
      console.log("Send password reset email to:", user.email);
      console.log("Password reset URL:", url);
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    expiresIn: 60,
    sendVerificationEmail: async ({ user, url }) => {
      console.log("Send verification email to:", user.email);
      console.log("Verification URL:", url);
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github", "discord", "email-password"],
      allowDifferentEmails: false,
    },
  },

  user: {
    additionalFields: {
      firstName: { type: "string", required: false },
      lastName: { type: "string", required: false },
      deletedAt: { type: "date", required: false, input: false },
      lastActiveOrganizationId: {
        type: "string",
        required: false,
        input: false,
        references: {
          model: "organization",
          field: "id",
          onDelete: "set null",
        },
      },
    },

    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 30);

        // Schedule Delete Date
        await db
          .update(userTable)
          .set({
            deletedAt: scheduledDate,
          })
          .where(eq(userTable.id, user.id));

        // Delete All User Sessions
        await db.delete(sessionTable).where(eq(sessionTable.userId, user.id));

        // Stop the actual hard delete
        throw new APIError("OK", {
          message: "Account scheduled for deletion in 30 days.",
        });
      },
    },
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [userData] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, session.userId))
            .limit(1);

          if (!userData) {
            throw new APIError("UNAUTHORIZED", {
              message: "User not found",
            });
          }

          if (userData.deletedAt) {
            throw new APIError("FORBIDDEN", {
              message: "Account disabled or scheduled for deletion",
            });
          }

          let activeOrganizationId = userData.lastActiveOrganizationId;

          // Check if the last active organization is valid and not deleted
          if (activeOrganizationId) {
            const [isValidOrg] = await db
              .select({ id: organizationTable.id })
              .from(organizationTable)
              .where(
                and(
                  eq(organizationTable.id, activeOrganizationId),
                  isNull(organizationTable.deletedAt),
                ),
              )
              .limit(1);

            if (!isValidOrg) {
              activeOrganizationId = null;
            }
          }

          // If no active organization found (or it was deleted), find a fallback
          if (!activeOrganizationId) {
            const [fallbackOrganization] = await db
              .select({ id: organizationTable.id })
              .from(organizationTable)
              .innerJoin(
                memberTable,
                eq(memberTable.organizationId, organizationTable.id),
              )
              .where(
                and(
                  eq(memberTable.userId, session.userId),
                  isNull(organizationTable.deletedAt),
                ),
              )
              .orderBy(organizationTable.createdAt)
              .limit(1);

            if (!fallbackOrganization) {
              // Only return the session without active org id, so the user is redirected to onboarding page.
              return {
                data: {
                  ...session,
                },
              };
            }

            activeOrganizationId = fallbackOrganization.id;
          }

          return {
            data: {
              ...session,
              activeOrganizationId,
            },
          };
        },

        after: async (session) => {
          const typedSession = session as typeof session & {
            activeOrganizationId?: string | null;
          };

          if (typedSession.activeOrganizationId) {
            const [user] = await db
              .select({
                lastActiveOrganizationId: userTable.lastActiveOrganizationId,
              })
              .from(userTable)
              .where(eq(userTable.id, session.userId))
              .limit(1);

            if (
              user &&
              user.lastActiveOrganizationId !==
                typedSession.activeOrganizationId
            ) {
              await db
                .update(userTable)
                .set({
                  lastActiveOrganizationId: typedSession.activeOrganizationId,
                })
                .where(eq(userTable.id, session.userId));
            }
          }
        },
      },

      update: {
        before: async (updates, ctx) => {
          const typedUpdates = updates as typeof updates & {
            activeOrganizationId?: string | null;
          };

          if (typedUpdates.activeOrganizationId) {
            const [orgData] = await db
              .select({ deletedAt: organizationTable.deletedAt })
              .from(organizationTable)
              .where(
                eq(organizationTable.id, typedUpdates.activeOrganizationId),
              )
              .limit(1);

            if (orgData?.deletedAt) {
              throw new APIError("FORBIDDEN", {
                message:
                  "Cannot switch to an organization scheduled for deletion",
              });
            }
          }

          if (ctx?.context?.session?.user.id) {
            const [userData] = await db
              .select({ deletedAt: userTable.deletedAt })
              .from(userTable)
              .where(eq(userTable.id, ctx.context.session.user.id))
              .limit(1);

            if (userData?.deletedAt) {
              throw new APIError("FORBIDDEN", {
                message: "Account disabled",
              });
            }
          }

          return { data: updates };
        },
        after: async (session) => {
          const typedSession = session as typeof session & {
            activeOrganizationId?: string | null;
          };

          if (typedSession.activeOrganizationId) {
            await db
              .update(userTable)
              .set({
                lastActiveOrganizationId: typedSession.activeOrganizationId,
              })
              .where(eq(userTable.id, session.userId));
          }
        },
      },
    },
  },

  session: {
    storeSessionInDatabase: true,
    preserveSessionInDatabase: true,
  },

  logger: {
    disabled: true,
    disableColors: false,
    level: "warn",
    log: (level, message, ...args) => {
      console.log(`[${level}] ${message}`, ...args);
    },
  },

  trustedOrigins: ["http://localhost:3000"],

  plugins: [
    openAPI(),
    organization({
      schema: {
        organization: {
          additionalFields: {
            deletedAt: { type: "date", required: false, input: false },
          },
        },
      },
      organizationHooks: {
        beforeDeleteOrganization: async () => {
          // TODO: Soft Delete Organization Here
          throw new APIError("OK", {
            message: "Organization scheduled for deletion in 30 days.",
          });
        },
      },
    }),
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...authOptions,

  plugins: [
    ...(authOptions.plugins ?? []),

    customSession(async ({ user, session }) => {
      const [membership] = await db
        .select({ id: memberTable.id })
        .from(memberTable)
        .innerJoin(
          organizationTable,
          eq(memberTable.organizationId, organizationTable.id),
        )
        .where(
          and(
            eq(memberTable.userId, user.id),
            isNull(organizationTable.deletedAt),
          ),
        )
        .limit(1);

      return {
        user: {
          ...user,
          hasOrganization: !!membership,
        },
        session,
      };
    }, authOptions),
  ],
});
