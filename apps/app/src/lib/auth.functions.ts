import type { Organization } from "@vidcastx/auth";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import type { AuthSession } from "#app/lib/auth";
import { env } from "#app/env";
import { tryCatch } from "#app/utils/try-catch";

function getApiUrl() {
  return env.API_URL;
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

  const data = (await res.json()) as AuthSession | null;
  if (!data?.session) return null;

  return data;
});

export const ensureSession = createServerFn({ method: "GET" }).handler(async (): Promise<AuthSession> => {
  const [res, err] = await tryCatch(
    fetch(`${getApiUrl()}/api/auth/get-session`, {
      method: "GET",
      headers: getAuthHeaders(),
    }),
  );

  const data: AuthSession | null = err ? null : res.ok ? ((await res.json()) as AuthSession | null) : null;

  if (!data?.session) throw new Error("Unauthorized");

  return data;
});

export const getOrganizations = createServerFn({ method: "GET" }).handler(async (): Promise<Organization[]> => {
  const [res, err] = await tryCatch(
    fetch(`${getApiUrl()}/api/auth/organization/list`, {
      method: "GET",
      headers: getAuthHeaders(),
    }),
  );

  if (err || !res.ok) return [];

  const data = (await res.json()) as (Organization & { deletedAt?: string | null })[] | null;
  return (data ?? []).filter((org) => !org.deletedAt);
});
