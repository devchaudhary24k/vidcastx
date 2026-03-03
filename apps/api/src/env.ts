import { createEnv } from "@t3-oss/env-core";

import { env as authEnv } from "@vidcastx/auth/env";
import { env as databaseEnv } from "@vidcastx/database/env";
import { env as redisEnv } from "@vidcastx/redis/env";
import { env as storageEnv } from "@vidcastx/storage/env";

export const env = createEnv({
  extends: [databaseEnv, redisEnv, storageEnv, authEnv],

  server: {},

  clientPrefix: "PUBLIC_",
  client: {},

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
