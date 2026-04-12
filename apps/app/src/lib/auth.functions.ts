import type { AuthSession } from "#app/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { tryCatch } from "#app/utils/try-catch";

function getApiUrl() {
  return process.env.API_URL || "http://localhost:4001";
}

function getAuthHeaders(): Record<string, string> {
  const cleanHeaders: Record<string, string> = {};

  const cookie = getRequestHeader("cookie");
  const authorization = getRequestHeader("authorization");

  if (cookie) cleanHeaders.cookie = cookie;
  if (authorization) cleanHeaders.authorization = authorization;

  return cleanHeaders;
}

export const getSession = createServerFn({ method: "GET" }).handler(async (): Promise<AuthSession | null> => {
  const [res, err] = await tryCatch(
    fetch(`${getApiUrl()}/api/auth/get-session`, {
      method: "GET",
      headers: getAuthHeaders(),
    }),
  );

  if (err || !res.ok) return null;

  const data = await res.json();
  if (!data?.session) return null;

  return data as AuthSession;
});

export const ensureSession = createServerFn({ method: "GET" }).handler(async (): Promise<AuthSession> => {
  const [res, err] = await tryCatch(
    fetch(`${getApiUrl()}/api/auth/get-session`, {
      method: "GET",
      headers: getAuthHeaders(),
    }),
  );

  const data = err ? null : res.ok ? await res.json() : null;

  if (!data?.session) throw new Error("Unauthorized");

  return data as AuthSession;
});

export const getOrganizations = createServerFn({ method: "GET" }).handler(async () => {
  const [res, err] = await tryCatch(
    fetch(`${getApiUrl()}/api/auth/organization/list`, {
      method: "GET",
      headers: getAuthHeaders(),
    }),
  );

  if (err || !res.ok) return [];

  const data = await res.json();
  // Filter out deleted organizations
  return (data ?? []).filter((org: { deletedAt: string | null }) => org.deletedAt === null);
});
