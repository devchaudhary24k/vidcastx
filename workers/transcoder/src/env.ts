import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    TRANSCODER_SECRET: z.string(),
    API_URL: z.string(),
    TRANSCODER_ID: z.string(),
    HW_ENCODER: z.string(),
    CONCURRENT_JOBS: z.coerce.number().default(2),
  },

  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: true,
});
