import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {},

  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_API_URL: z.url(),
    NEXT_PUBLIC_CDN_URL: z.url(),
  },

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
