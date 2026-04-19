import type { ReactNode } from "react";
import { useRouteContext } from "@tanstack/react-router";

import { SidebarInset, SidebarProvider } from "@vidcastx/ui/components/sidebar";

import { GlobalUploadIndicator } from "#app/features/videos/components/global-upload-indicator";

import { AppSidebar } from "./app-sidebar";
import { Header } from "./header";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { session, organizations } = useRouteContext({ from: "/_protected/dashboard" });

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image ?? "",
  };

  const activeOrganizationId = session.session.activeOrganizationId ?? organizations[0]?.id ?? "";

  return (
    <SidebarProvider>
      <AppSidebar user={user} organizations={organizations} activeOrganizationId={activeOrganizationId} />
      <SidebarInset>
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-2">{children}</main>
        <GlobalUploadIndicator />
      </SidebarInset>
    </SidebarProvider>
  );
}
