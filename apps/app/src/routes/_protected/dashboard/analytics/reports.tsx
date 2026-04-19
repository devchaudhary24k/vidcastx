import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard/analytics/reports")({
  component: ContentReportsPage,
});

function ContentReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Reports</h1>
        <p className="text-muted-foreground">Detailed reports on your content.</p>
      </div>
    </div>
  );
}
