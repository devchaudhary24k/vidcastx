import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  AppSidebar,
  getOrganizationsAction,
  getSessionAction,
  Header,
} from "@dashboard/features/dashboard";
import { GlobalUploadIndicator } from "@dashboard/features/videos/components/global-upload-indicator";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { SidebarInset, SidebarProvider } from "@vidcastx/ui/components/sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const queryClient = new QueryClient();

  const sessionData = await queryClient.fetchQuery({
    queryKey: ["session"],
    queryFn: getSessionAction,
  });

  if (!sessionData) {
    redirect("/auth/login");
  }

  if (!sessionData.user.hasOrganization) {
    redirect("/onboarding");
  }

  await queryClient.prefetchQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizationsAction,
  });

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
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <AppSidebar user={user} activeOrganizationId={activeOrgId} />
        <SidebarInset>
          <Header />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
          <GlobalUploadIndicator />
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
