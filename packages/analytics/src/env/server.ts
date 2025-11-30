import { createEnv } from "@t3-oss/env-core";

export const serverKeys = () =>
  createEnv({
    server: {},
    runtimeEnv: process.env,
  });
