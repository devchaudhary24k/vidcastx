import type { BetterAuthOptions } from "better-auth";
import { env } from "@server/env";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession, openAPI, organization } from "better-auth/plugins";

import { eq } from "@workspace/database";
import { db } from "@workspace/database/client";
import {
  member,
  session as sessionTable,
  user as userTable,
} from "@workspace/database/schema/auth-schema";
import { redis } from "@workspace/redis";

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

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [userData] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, session.userId))
            .limit(1);

          if (userData.deletedAt) {
            throw new APIError("FORBIDDEN", {
              message: "Account disabled or scheduled for deletion",
            });
          }

          return { data: session };
        },
      },

      update: {
        before: async () => {},
      },
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
        .select({ id: member.id })
        .from(member)
        .where(eq(member.userId, user.id))
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
