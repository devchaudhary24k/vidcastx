/**
 * @vidcastx/auth — Framework-agnostic Better Auth factory.
 *
 * This package holds the SHAPE of our auth configuration: the adapter wiring,
 * session/org hooks, social providers, plugins, etc. It reads no environment
 * variables. Consumer apps (e.g. `apps/api`) call `initAuth({...})` with their
 * own env values — see `apps/api/src/auth/server.ts`.
 *
 * This separation lets us:
 * - Reuse the exact same auth config across multiple runtimes
 * - Generate the Drizzle auth schema via the Better Auth CLI using dummy
 *   values in `script/auth-cli.ts` without touching production env
 * - Keep server-only secrets out of the package boundary
 */

import type { BetterAuthOptions } from "better-auth";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession, openAPI, organization } from "better-auth/plugins";

import { and, eq, isNull } from "@vidcastx/database";
import { db } from "@vidcastx/database/client";
import {
  member as memberTable,
  organization as organizationTable,
  session as sessionTable,
  user as userTable,
} from "@vidcastx/database/schema/auth-schema";
import { redis } from "@vidcastx/redis";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/**
 * Grace period (in days) before a soft-deleted user or organization is
 * eligible for hard deletion. Using a shared constant keeps the user and
 * organization soft-delete hooks in lock-step — don't let them drift.
 */
const SOFT_DELETE_GRACE_DAYS = 30;

/**
 * Compute the wall-clock timestamp at which a soft-deleted record becomes
 * eligible for hard deletion. Called lazily inside hooks (not at module load)
 * so the returned date always reflects the time the deletion was requested.
 */
function computeSoftDeleteScheduledAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + SOFT_DELETE_GRACE_DAYS);
  return date;
}

// -----------------------------------------------------------------------------
// Public options
// -----------------------------------------------------------------------------

/**
 * Runtime configuration for `initAuth`. All values come from the consumer
 * app's validated environment. Nothing here is optional — if the consumer
 * wants different values per environment, they compose them at the call site.
 */
export interface InitAuthOptions {
  /** Base URL the auth handler is mounted on (the API origin). */
  baseURL: string;
  /** Secret used to sign sessions, CSRF tokens, and email-verification URLs. */
  secret: string;
  /**
   * Origins allowed to initiate OAuth flows and to be targeted by post-auth
   * redirects. Typically includes the frontend origin(s). Missing origins
   * fail CSRF checks and callback redirects silently — keep this accurate.
   */
  trustedOrigins: string[];
  /** GitHub OAuth app credentials (Developer settings → OAuth apps). */
  githubClientId: string;
  githubClientSecret: string;
  /** Discord OAuth app credentials (Developer portal → Applications → OAuth2). */
  discordClientId: string;
  discordClientSecret: string;
}

// -----------------------------------------------------------------------------
// Factory
// -----------------------------------------------------------------------------

/**
 * Build a fully-configured Better Auth instance.
 *
 * The returned object exposes:
 * - `auth.handler(request)` — mount this as your HTTP handler
 * - `auth.api.*` — server-side programmatic API (getSession, listSessions, …)
 * - `auth.$Infer` — type helpers for Session/Organization/etc.
 *
 * We build `authOptions` first (satisfying `BetterAuthOptions`), then wrap it
 * with `customSession` as an additional plugin. The two-step construction is
 * required because `customSession` takes the base options as an argument so it
 * can correctly infer the session shape.
 */
export function initAuth(options: InitAuthOptions) {
  const authOptions = {
    appName: "VidcastX",
    baseURL: options.baseURL,
    secret: options.secret,

    // -------------------------------------------------------------------------
    // Persistence
    // -------------------------------------------------------------------------
    //
    // Primary store: Postgres via Drizzle. `drizzleAdapter` handles user,
    // session, account, verification, plus anything added by plugins (org,
    // member, invitation, team…).
    database: drizzleAdapter(db, {
      provider: "pg",
    }),

    // Secondary store: Redis. Better Auth uses this for hot-path reads
    // (session lookups, verification codes, rate-limit counters) so auth
    // doesn't hit Postgres on every request.
    secondaryStorage: {
      get: async (key) => {
        return redis.get(key);
      },
      set: async (key, value, ttl) => {
        // `ttl` is in seconds. `"EX"` tells ioredis to apply it as a TTL.
        if (ttl) await redis.set(key, value, "EX", ttl);
        else await redis.set(key, value);
      },
      delete: async (key) => {
        await redis.del(key);
      },
    },

    // -------------------------------------------------------------------------
    // Auth methods
    // -------------------------------------------------------------------------

    // OAuth providers. Credentials come in via options so dev/prod/staging can
    // each supply their own.
    socialProviders: {
      github: {
        clientId: options.githubClientId,
        clientSecret: options.githubClientSecret,
      },
      discord: {
        clientId: options.discordClientId,
        clientSecret: options.discordClientSecret,
      },
    },

    // Email + password flow. Verification is REQUIRED — a user cannot sign in
    // until they've clicked the link in their verification email.
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 32,
      sendResetPassword: async ({ user, url }) => {
        // TODO: wire up a real transactional email provider (Resend/Postmark).
        // For now we log so local dev can copy the URL out of stdout.
        console.log("Send password reset email to:", user.email);
        console.log("Password reset URL:", url);
      },
    },

    // Email verification. `sendOnSignIn: true` + short `expiresIn` means any
    // unverified user hitting /sign-in gets a fresh short-lived link.
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      expiresIn: 60, // seconds
      sendVerificationEmail: async ({ user, url }) => {
        // TODO: wire up a real transactional email provider (Resend/Postmark).
        console.log("Send verification email to:", user.email);
        console.log("Verification URL:", url);
      },
    },

    // When someone signs in with GitHub using the same email they used with
    // Discord, link both accounts to the same user record. `trustedProviders`
    // bypasses the normal "prove you own both" dance for providers we treat
    // as trustworthy identity sources.
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google", "github", "discord", "email-password"],
        allowDifferentEmails: false,
      },
    },

    // -------------------------------------------------------------------------
    // User schema extensions
    // -------------------------------------------------------------------------
    //
    // Every field here is appended to Better Auth's base `user` table. These
    // are reflected in `packages/database/src/schema/auth-schema.ts` — if you
    // add/remove fields here, regenerate the schema via `pnpm --filter
    // @vidcastx/auth generate` (or mirror them by hand).
    user: {
      additionalFields: {
        firstName: { type: "string", required: false },
        lastName: { type: "string", required: false },
        // Set when the user requests account deletion. Non-null = scheduled
        // for purge; enforced in the session create hook so a soft-deleted
        // user can never establish a new session.
        deletedAt: { type: "date", required: false, input: false },
        // Tracks the org the user was last active in. Used to bootstrap a
        // session's `activeOrganizationId` without the client having to
        // explicitly pick an org on every sign-in.
        lastActiveOrganizationId: {
          type: "string",
          required: false,
          input: false,
          references: {
            model: "organization",
            field: "id",
            // If the org is hard-deleted the reference is nulled rather than
            // cascading a session wipe. Soft-deleted orgs are filtered out
            // by the session hooks before they reach this FK.
            onDelete: "set null",
          },
        },
      },

      // We don't actually hard-delete the row. Instead, schedule a purge
      // SOFT_DELETE_GRACE_DAYS ahead and abort the delete by throwing an
      // APIError with an "OK" status — Better Auth propagates the message to
      // the caller without treating it as a server error.
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          // 1. Mark the user as deleted (but keep the row).
          await db
            .update(userTable)
            .set({ deletedAt: computeSoftDeleteScheduledAt() })
            .where(eq(userTable.id, user.id));

          // 2. Invalidate every active session for this user immediately so
          //    they can't keep using the account during the grace period.
          await db.delete(sessionTable).where(eq(sessionTable.userId, user.id));

          // 3. Block the hard delete and surface a friendly message.
          throw new APIError("OK", {
            message: `Account scheduled for deletion in ${SOFT_DELETE_GRACE_DAYS} days.`,
          });
        },
      },
    },

    // -------------------------------------------------------------------------
    // Database hooks
    // -------------------------------------------------------------------------
    //
    // These run around Better Auth's own writes. We use them to:
    //   - Enforce soft-delete invariants on session creation
    //   - Keep `activeOrganizationId` coherent with `lastActiveOrganizationId`
    //     without the client having to manage it
    databaseHooks: {
      session: {
        create: {
          /**
           * Runs BEFORE a session row is inserted. Decides what
           * `activeOrganizationId` the new session should start with:
           *
           *   1. Refuse if the user is missing or soft-deleted.
           *   2. Use `user.lastActiveOrganizationId` if it points to a live org.
           *   3. Otherwise fall back to the user's oldest non-deleted org.
           *   4. If they're in zero orgs, let the session through WITHOUT an
           *      active org so the frontend can redirect to onboarding.
           */
          before: async (session) => {
            const [userData] = await db.select().from(userTable).where(eq(userTable.id, session.userId)).limit(1);

            if (!userData) {
              throw new APIError("UNAUTHORIZED", {
                message: "User not found",
              });
            }

            if (userData.deletedAt) {
              throw new APIError("FORBIDDEN", {
                message: "Account disabled or scheduled for deletion",
              });
            }

            let activeOrganizationId = userData.lastActiveOrganizationId;

            // Verify the last-active org still exists and isn't soft-deleted.
            // A user might have been removed from the org, or the org might
            // have been scheduled for deletion since they last used it.
            if (activeOrganizationId) {
              const [isValidOrg] = await db
                .select({ id: organizationTable.id })
                .from(organizationTable)
                .where(and(eq(organizationTable.id, activeOrganizationId), isNull(organizationTable.deletedAt)))
                .limit(1);

              if (!isValidOrg) {
                activeOrganizationId = null;
              }
            }

            // Fallback: pick the oldest org this user belongs to that's still
            // live. Oldest-first is deterministic and avoids surprising the
            // user by jumping them into whatever org loaded first.
            if (!activeOrganizationId) {
              const [fallbackOrganization] = await db
                .select({ id: organizationTable.id })
                .from(organizationTable)
                .innerJoin(memberTable, eq(memberTable.organizationId, organizationTable.id))
                .where(and(eq(memberTable.userId, session.userId), isNull(organizationTable.deletedAt)))
                .orderBy(organizationTable.createdAt)
                .limit(1);

              if (!fallbackOrganization) {
                // No orgs — return the session WITHOUT activeOrganizationId so
                // the router can route them to /onboarding.
                return {
                  data: {
                    ...session,
                  },
                };
              }

              activeOrganizationId = fallbackOrganization.id;
            }

            return {
              data: {
                ...session,
                activeOrganizationId,
              },
            };
          },

          /**
           * Runs AFTER the session row is inserted. Writes the chosen
           * `activeOrganizationId` back to the user as `lastActiveOrganizationId`
           * so the next sign-in on a different device starts in the same org.
           */
          after: async (session) => {
            // `activeOrganizationId` isn't in Better Auth's base Session type;
            // our `before` hook may add it. Narrow with an intersection.
            const typedSession = session as typeof session & {
              activeOrganizationId?: string | null;
            };

            if (typedSession.activeOrganizationId) {
              const [user] = await db
                .select({
                  lastActiveOrganizationId: userTable.lastActiveOrganizationId,
                })
                .from(userTable)
                .where(eq(userTable.id, session.userId))
                .limit(1);

              // Avoid an unnecessary write if nothing would change.
              if (user && user.lastActiveOrganizationId !== typedSession.activeOrganizationId) {
                await db
                  .update(userTable)
                  .set({
                    lastActiveOrganizationId: typedSession.activeOrganizationId,
                  })
                  .where(eq(userTable.id, session.userId));
              }
            }
          },
        },

        update: {
          /**
           * Runs when the session is updated (e.g. the user calls
           * `auth.organization.setActive(newOrgId)`). Two guards:
           *
           *   1. Refuse to switch INTO a soft-deleted org.
           *   2. Refuse any update if the session's user is soft-deleted — we
           *      don't want a disabled account continuing to mutate state.
           */
          before: async (updates, ctx) => {
            const typedUpdates = updates as typeof updates & {
              activeOrganizationId?: string | null;
            };

            if (typedUpdates.activeOrganizationId) {
              const [orgData] = await db
                .select({ deletedAt: organizationTable.deletedAt })
                .from(organizationTable)
                .where(eq(organizationTable.id, typedUpdates.activeOrganizationId))
                .limit(1);

              if (orgData?.deletedAt) {
                throw new APIError("FORBIDDEN", {
                  message: "Cannot switch to an organization scheduled for deletion",
                });
              }
            }

            if (ctx?.context?.session?.user.id) {
              const [userData] = await db
                .select({ deletedAt: userTable.deletedAt })
                .from(userTable)
                .where(eq(userTable.id, ctx.context.session.user.id))
                .limit(1);

              if (userData?.deletedAt) {
                throw new APIError("FORBIDDEN", {
                  message: "Account disabled",
                });
              }
            }

            return { data: updates };
          },
          /**
           * Mirror the new `activeOrganizationId` back to `lastActiveOrganizationId`
           * so the user stays in their most-recently-picked org on next sign-in.
           */
          after: async (session) => {
            const typedSession = session as typeof session & {
              activeOrganizationId?: string | null;
            };

            if (typedSession.activeOrganizationId) {
              await db
                .update(userTable)
                .set({
                  lastActiveOrganizationId: typedSession.activeOrganizationId,
                })
                .where(eq(userTable.id, session.userId));
            }
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // Session storage
    // -------------------------------------------------------------------------
    //
    // Keep sessions in Postgres alongside Redis. `preserveSessionInDatabase`
    // means sessions aren't deleted when the user signs out — they're just
    // marked. Useful for audit logs and "sign out of all devices" UIs.
    session: {
      storeSessionInDatabase: true,
      preserveSessionInDatabase: true,
    },

    // -------------------------------------------------------------------------
    // Logging
    // -------------------------------------------------------------------------
    //
    // NOTE: `disabled: true` means Better Auth's internal logs are silenced.
    // Our own `console.log` calls in email hooks above still fire. Flip to
    // `false` when debugging auth flows in dev.
    logger: {
      disabled: true,
      disableColors: false,
      level: "warn",
      log: (level, message, ...args) => {
        console.log(`[${level}] ${message}`, ...args);
      },
    },

    trustedOrigins: options.trustedOrigins,

    // -------------------------------------------------------------------------
    // Plugins
    // -------------------------------------------------------------------------
    plugins: [
      // Mounts /api/auth/reference JSON that openapi can merge into our docs.
      openAPI(),

      // Adds organizations, members, invitations, and teams. Our extensions:
      //   - `organization.deletedAt` column (for soft delete)
      //   - `beforeDeleteOrganization` hook wired into the soft-delete pattern
      organization({
        schema: {
          organization: {
            additionalFields: {
              deletedAt: { type: "date", required: false, input: false },
            },
          },
        },
        organizationHooks: {
          /**
           * Mirror of `user.deleteUser.beforeDelete`: schedule a purge and
           * throw "OK" to abort the hard delete. All sessions in/around this
           * org keep working during the grace period — the session update
           * hook above will refuse to switch *into* a deleted org, which is
           * the only behavior change users should observe.
           */
          beforeDeleteOrganization: async ({ organization: org }) => {
            await db
              .update(organizationTable)
              .set({ deletedAt: computeSoftDeleteScheduledAt() })
              .where(eq(organizationTable.id, org.id));

            throw new APIError("OK", {
              message: `Organization scheduled for deletion in ${SOFT_DELETE_GRACE_DAYS} days.`,
            });
          },
        },
      }),
    ],

    // Drizzle JOIN support is still flagged as experimental upstream; we rely
    // on it in a few queries above (innerJoin on member/organization).
    experimental: {
      joins: true,
    },
  } satisfies BetterAuthOptions;

  // ---------------------------------------------------------------------------
  // customSession — extends the session payload with derived fields
  // ---------------------------------------------------------------------------
  //
  // `customSession` wraps the normal session response. We use it to attach
  // `hasOrganization` to the user so the frontend can decide at render time
  // whether to route to /dashboard or /onboarding without a follow-up query.
  //
  // It MUST be the last step (applied on top of `authOptions`) so the types
  // for `user` and `session` reflect every preceding plugin and extension.
  return betterAuth({
    ...authOptions,

    plugins: [
      ...(authOptions.plugins ?? []),

      customSession(async ({ user, session }) => {
        // Does this user belong to any non-soft-deleted org?
        const [membership] = await db
          .select({ id: memberTable.id })
          .from(memberTable)
          .innerJoin(organizationTable, eq(memberTable.organizationId, organizationTable.id))
          .where(and(eq(memberTable.userId, user.id), isNull(organizationTable.deletedAt)))
          .limit(1);

        return {
          user: {
            ...user,
            hasOrganization: !!membership,
          },
          session,
        };
      }, authOptions),
    ],
  });
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
//
// Derived from the factory return type so they always reflect the real
// plugin set. Frontend code imports these (with `import type`) to talk to the
// auth client without pulling any runtime code into the bundle.

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
export type ActiveOrganization = Auth["$Infer"]["ActiveOrganization"];
export type Invitation = Auth["$Infer"]["Invitation"];
export type Member = Auth["$Infer"]["Member"];
export type Organization = Auth["$Infer"]["Organization"];
export type Team = Auth["$Infer"]["Team"];
export type TeamMember = Auth["$Infer"]["TeamMember"];
