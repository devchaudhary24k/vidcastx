import { createFileRoute } from "@tanstack/react-router";
import { VideosGrid } from "#app/features/videos";

export const Route = createFileRoute("/_protected/dashboard/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Manage your video projects.</p>
      </div>
      <VideosGrid />
    </div>
  );
}
