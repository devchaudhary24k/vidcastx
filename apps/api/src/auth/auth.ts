import { env } from "@/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, organization } from "better-auth/plugins";

import { db } from "@workspace/database/client";

export const auth = betterAuth({
  appName: "VidcastX",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

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

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github", "discord", "email-password"],
      allowDifferentEmails: false,
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

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
        input: false,
      },

      firstName: {
        type: "string",
        required: true,
      },

      lastName: {
        type: "string",
        required: true,
      },
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

  logger: {
    disabled: true,
    disableColors: false,
    level: "warn",
    log: (level, message, ...args) => {
      console.log(`[${level}] ${message}`, ...args);
    },
  },

  plugins: [openAPI(), organization()],
});
