import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { env as databaseEnv, env as storageEnv } from "@vidcastx/database/env";
import { env as redisEnv } from "@vidcastx/redis/env";

export const env = createEnv({
  extends: [databaseEnv, redisEnv, storageEnv],

  server: {
    AYYO: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_CLIENT_SECRET: z.string().min(1),
  },

  clientPrefix: "PUBLIC_",
  client: {},

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
