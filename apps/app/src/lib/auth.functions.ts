import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { tryCatch } from "#app/utils/try-catch";

const getAuthHeaders = () => {
  const cleanHeaders: Record<string, string> = {};

  // getRequestHeader expects the exact header name and returns a string | undefined
  const cookie = getRequestHeader("cookie");
  const authorization = getRequestHeader("authorization");

  if (cookie) cleanHeaders.cookie = cookie;
  if (authorization) cleanHeaders.authorization = authorization;

  return cleanHeaders;
};

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const [res, err] = await tryCatch(
    fetch(`${process.env.API_URL}/api/auth/get-session`, {
      method: "GET",
      headers: getAuthHeaders(),
    }),
  );

  if (err || !res.ok) return null;

  return await res.json();
});

export const ensureSession = createServerFn({ method: "GET" }).handler(async () => {
  const [res, err] = await tryCatch(
    fetch(`${process.env.API_URL}/api/auth/get-session`, {
      method: "GET",
      headers: getAuthHeaders(),
    }),
  );

  const data = err ? null : res.ok ? await res.json() : null;

  if (!data?.session) throw new Error("Unauthorized");

  return data;
});
