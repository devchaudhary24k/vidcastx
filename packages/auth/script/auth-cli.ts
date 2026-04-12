/**
 * Better Auth CLI configuration — used ONLY by `@better-auth/cli` to generate
 * the Drizzle auth schema. Not for runtime use.
 *
 * Run via:
 *   pnpm --filter @vidcastx/auth generate
 *
 * For real auth usage, see `apps/api/src/auth/server.ts`.
 */

import { initAuth } from "../src/index";

export const auth = initAuth({
  baseURL: "http://localhost:4001",
  secret: "dummy-secret-for-schema-generation",
  trustedOrigins: ["http://localhost:4000"],
  githubClientId: "dummy",
  githubClientSecret: "dummy",
  discordClientId: "dummy",
  discordClientSecret: "dummy",
});
