"use server";

import { headers } from "next/headers";

import { auth } from "@vidcastx/auth";

export async function getSessionAction() {
  const h = await headers();

  return await auth.api.getSession({
    headers: h,
  });
}

export async function getOrganizationsAction() {
  const h = await headers();

  const list = await auth.api.listOrganizations({
    headers: h,
  });

  return list.filter((org) => org.deletedAt === null);
}
