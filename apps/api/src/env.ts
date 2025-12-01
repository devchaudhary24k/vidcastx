import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { env as databaseEnv } from "@workspace/database/env";
import { env as redisEnv } from "@workspace/redis/env";

export const env = createEnv({
  extends: [databaseEnv, redisEnv],

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
