import { createFileRoute, Outlet } from "@tanstack/react-router";

import { DashboardShell } from "#app/features/dashboard/components/dashboard-shell";
import { getOrganizations } from "#app/lib/auth.functions";

export const Route = createFileRoute("/_protected/dashboard")({
  beforeLoad: async ({ context }) => {
    const organizations = await getOrganizations();
    return { organizations, session: context.session };
  },

  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}
