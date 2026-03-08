import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    TRANSCODER_SECRET: z.string(),
    API_URL: z.string(),
    TRANSCODER_ID: z.string(),
  },

  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: true,
});
