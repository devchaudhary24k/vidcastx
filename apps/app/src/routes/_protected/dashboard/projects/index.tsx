import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "#app/components/page-header";
import { VideosGrid } from "#app/features/videos";
import { Plus, Upload } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";

export const Route = createFileRoute("/_protected/dashboard/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your video projects."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Upload className="size-4" />
              Import
            </Button>
            <Button size="sm" render={<Link to="/dashboard/studio/new" />}>
              <Plus className="size-4" />
              New project
            </Button>
          </>
        }
      />
      <VideosGrid />
    </div>
  );
}
