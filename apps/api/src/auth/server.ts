import { initAuth } from "@vidcastx/auth";

import { env } from "../env";

/**
 * The concrete Better Auth server instance for the API. All env-dependent
 * config is read here and passed into the framework-agnostic factory so the
 * `@vidcastx/auth` package itself stays env-free.
 */
export const auth = initAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: ["http://localhost:4000", "http://localhost:3000"],
  githubClientId: env.GITHUB_CLIENT_ID,
  githubClientSecret: env.GITHUB_CLIENT_SECRET,
  discordClientId: env.DISCORD_CLIENT_ID,
  discordClientSecret: env.DISCORD_CLIENT_SECRET,
});
