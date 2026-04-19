import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Factory for the auth env schema. Consumer apps call this inside their own
 * `createEnv({ extends: [authEnv()] })` to compose validation.
 */
export function authEnv() {
  return createEnv({
    server: {
      BETTER_AUTH_SECRET: z.string().min(1),
      BETTER_AUTH_URL: z.url(),
      GITHUB_CLIENT_ID: z.string().min(1),
      GITHUB_CLIENT_SECRET: z.string().min(1),
      DISCORD_CLIENT_ID: z.string().min(1),
      DISCORD_CLIENT_SECRET: z.string().min(1),
    },

    clientPrefix: "PUBLIC_",
    client: {},

    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  });
}
