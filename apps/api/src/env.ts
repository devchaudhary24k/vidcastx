import { createEnv } from "@t3-oss/env-core";
import { env as transcoderEnv } from "@transcoder/env";
import { z } from "zod";

import { env as authEnv } from "@vidcastx/auth/env";
import { env as databaseEnv } from "@vidcastx/database/env";
import { env as redisEnv } from "@vidcastx/redis/env";
import { env as storageEnv } from "@vidcastx/storage/env";

export const env = createEnv({
  extends: [databaseEnv, redisEnv, storageEnv, authEnv, transcoderEnv],

  server: {
    PORT: z.coerce.number().default(3001),
    JWT_SECRET: z.string(),
  },

  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  clientPrefix: "PUBLIC_",
  client: {},

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
