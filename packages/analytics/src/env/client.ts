import { createEnv } from "@t3-oss/env-core";
import z from "zod";

export const clientKeys = () =>
  createEnv({
    clientPrefix: "NEXT_PUBLIC_",
    client: {
      NEXT_PUBLIC_POSTHOG_KEY: z.string().startsWith("phc_"),
      NEXT_PUBLIC_POSTHOG_HOST: z.url(),
      NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().startsWith("G-").optional(),
    },
    runtimeEnv: process.env,
  });
