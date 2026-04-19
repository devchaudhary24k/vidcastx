import type { Auth } from "@vidcastx/auth";
import { inferAdditionalFields, inferOrgAdditionalFields, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env } from "#app/env";

export const auth = createAuthClient({
  baseURL: env.VITE_API_URL,
  plugins: [
    organizationClient({
      schema: inferOrgAdditionalFields<Auth>(),
    }),
    inferAdditionalFields<Auth>(),
  ],
});

export type AuthSession = Auth["$Infer"]["Session"];
