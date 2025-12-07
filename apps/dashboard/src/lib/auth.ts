import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export type BetterAuthClient = ReturnType<typeof createAuthClient>;

export const auth: BetterAuthClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [organizationClient()],
});
