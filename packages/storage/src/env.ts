import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    S3_REGION: z.string().default("us-east-1"),
    S3_ENDPOINT: z.url(),
    S3_ACCESS_KEY_ID: z.string(),
    S3_SECRET_ACCESS_KEY: z.string(),
    S3_FORCE_PATH_STYLE: z
      .string()
      .default("true")
      .refine((s) => s === "true" || s === "false")
      .transform((s) => s === "true"), // Set default to false when using AWS buckets
    S3_BUCKET_NAME: z.string(),
  },

  shared: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: true,
});
