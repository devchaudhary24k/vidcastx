import { ReactNode } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { cookies, headers } from 'next/headers';
import { auth } from '@/auth/auth';

type DashboardLayoutProps = {
  children: ReactNode;
};

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar.state')?.value === 'true';
  // TODO: Fix sidebar state

  const [session, listOrganizations, activeOrganization] = await Promise.all([
    auth.api.getSession({
      headers: await headers(),
    }),
    auth.api.listOrganizations({
      headers: await headers(),
    }),
    auth.api.getFullOrganization({
      headers: await headers(),
    }),
  ]);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        session={JSON.parse(JSON.stringify(session))}
        listOrganizations={JSON.parse(JSON.stringify(listOrganizations))}
        activeOrganization={JSON.parse(JSON.stringify(activeOrganization))}
      />
      <SidebarInset>
        <main>
          {/*<SidebarTrigger />*/}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
