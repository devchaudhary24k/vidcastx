import { headers } from "next/headers";
import { AppSidebar, Header } from "@dashboard/features/dashboard";

import { auth } from "@vidcastx/auth";
import { SidebarInset, SidebarProvider } from "@vidcastx/ui/components/sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const sessionData = await auth.api.getSession({
    headers: h,
  });

  const organizationsList = await auth.api.listOrganizations({
    headers: h,
  });

  const filteredOrganizations = organizationsList.filter(
    (org) => org.deletedAt === null,
  );

  if (!sessionData) {
    return null;
  }

  const activeOrgId = sessionData.session.activeOrganizationId;

  if (!activeOrgId) {
    return null;
  }

  const user = {
    name: sessionData.user.name,
    email: sessionData.user.email,
    avatar: sessionData.user.image || "",
  };

  return (
    <SidebarProvider>
      <AppSidebar
        organizations={filteredOrganizations}
        user={user}
        activeOrganizationId={activeOrgId}
      />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
