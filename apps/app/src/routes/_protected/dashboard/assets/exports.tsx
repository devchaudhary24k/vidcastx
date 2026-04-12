import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard/assets/exports")({
  component: ExportsPage,
});

function ExportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exports</h1>
        <p className="text-muted-foreground">View your exported files.</p>
      </div>
    </div>
  );
}
