import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    ENVIRONMENT: z.enum(["development", "production"]).default("development"),
    PRODUCTION_URL: z.string().optional(),
  },

  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
