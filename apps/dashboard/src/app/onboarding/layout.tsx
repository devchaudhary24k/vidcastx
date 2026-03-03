import { type ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@vidcastx/auth";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const h = await headers();
  const session = await auth.api.getSession({
    headers: h,
  });

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.hasOrganization) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
