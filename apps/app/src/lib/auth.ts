import type { auth as authServer } from "@vidcastx/auth";
import { env } from "#app/env";
import { inferAdditionalFields, inferOrgAdditionalFields, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const auth = createAuthClient({
  baseURL: env.VITE_API_URL,
  plugins: [
    organizationClient({
      schema: inferOrgAdditionalFields<typeof authServer>(),
    }),
    inferAdditionalFields<typeof authServer>(),
  ],
});

export type AuthSession = typeof authServer.$Infer.Session;
