import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard/developers/")({
  component: DevelopersPage,
});

function DevelopersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Developers</h1>
        <p className="text-muted-foreground">Developer tools and resources.</p>
      </div>
    </div>
  );
}
