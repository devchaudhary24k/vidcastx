import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { session } = Route.useRouteContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name}.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Total Videos" value="--" description="Videos uploaded" />
        <DashboardCard title="Total Views" value="--" description="All-time views" />
        <DashboardCard title="Storage Used" value="--" description="Of your plan" />
        <DashboardCard title="Team Members" value="--" description="Active members" />
      </div>
    </div>
  );
}

function DashboardCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
      <div className="text-muted-foreground text-sm font-medium">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  );
}
