import { Elysia } from "elysia";

/**
 * Creates a mock auth plugin that simulates betterAuth for testing.
 * Injects user and session into context via the `auth` macro.
 */
export function mockAuth(overrides?: { userId?: string; orgId?: string }) {
  const user = {
    id: overrides?.userId ?? "usr_testuser123",
    name: "Test User",
    email: "test@vidcastx.com",
  };

  const session = {
    id: "session_test123",
    activeOrganizationId: overrides?.orgId ?? "org_testorg123",
  };

  return new Elysia({ name: "mock-auth" }).macro({
    auth: {
      resolve() {
        return { user, session };
      },
    },
  });
}

/**
 * Mock auth that simulates a user with no active organization.
 */
export function mockAuthNoOrg() {
  const user = {
    id: "usr_testuser123",
    name: "Test User",
    email: "test@vidcastx.com",
  };

  const session = {
    id: "session_test123",
    activeOrganizationId: null,
  };

  return new Elysia({ name: "mock-auth-no-org" }).macro({
    auth: {
      resolve() {
        return { user, session };
      },
    },
  });
}
