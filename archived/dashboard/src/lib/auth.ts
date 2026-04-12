import { inferAdditionalFields, inferOrgAdditionalFields, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { type auth as authServer } from "@vidcastx/auth";

export const auth = createAuthClient({
  baseURL: "http://localhost:4000",
  plugins: [
    organizationClient({
      schema: inferOrgAdditionalFields<typeof authServer>(),
    }),
    inferAdditionalFields<typeof authServer>(),
  ],
});
