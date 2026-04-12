import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    API_URL: z.string().url().default("http://localhost:4001"),
  },

  clientPrefix: "VITE_",

  client: {
    VITE_APP_URL: z.string().url().default("http://localhost:4000"),
    VITE_API_URL: z.string().url().default("http://localhost:4001"),
  },

  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
