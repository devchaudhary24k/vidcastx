import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "#app/features/dashboard/components/app-sidebar";
import { Header } from "#app/features/dashboard/components/header";
import { GlobalUploadIndicator } from "#app/features/videos/components/global-upload-indicator";
import { getOrganizations } from "#app/lib/auth.functions";

import { SidebarInset, SidebarProvider } from "@vidcastx/ui/components/sidebar";

export const Route = createFileRoute("/_protected/dashboard")({
  beforeLoad: async ({ context }) => {
    const organizations = await getOrganizations();
    return { organizations, session: context.session };
  },

  component: DashboardLayout,
});

function DashboardLayout() {
  const { session, organizations } = Route.useRouteContext();

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
        <main className="flex flex-1 flex-col gap-4 p-2">
          <Outlet />
        </main>
        <GlobalUploadIndicator />
      </SidebarInset>
    </SidebarProvider>
  );
}
