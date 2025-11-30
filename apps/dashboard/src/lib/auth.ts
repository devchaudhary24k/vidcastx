import { createAuthClient } from "better-auth/react";

export type BetterAuthClient = ReturnType<typeof createAuthClient>;

export const auth: BetterAuthClient = createAuthClient({
  baseURL: "http://localhost:3001",
});
