import { env } from "@server/env";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, organization } from "better-auth/plugins";

import { db } from "@workspace/database/client";
import { redis } from "@workspace/redis";

export const auth = betterAuth({
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
      firstName: {
        type: "string",
        required: false,
      },

      lastName: {
        type: "string",
        required: false,
      },

      deletedAt: {
        type: "date",
        required: false,
        input: false,
      },
    },

    deleteUser: {
      enabled: true,
      beforeDelete: async () => {
        //   TODO: Set user delete time in database to +30 days
        // await db.update(user).set({});

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

  trustedOrigins: ["http://localhost:3000"],
  plugins: [
    openAPI(),
    organization({
      schema: {
        organization: {
          additionalFields: {
            deletedAt: {
              type: "date",
              required: false,
              input: false,
            },
          },
        },
      },

      organizationHooks: {
        beforeDeleteOrganization: async (ctx) => {
          //   TODO: Set user delete time in database to +30 days

          throw new APIError("OK", {
            message: "Organization scheduled for deletion in 30 days.",
          });
        },
      },
    }),
  ],
});
