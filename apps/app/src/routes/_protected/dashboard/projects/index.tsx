import { createFileRoute } from "@tanstack/react-router";
import { FolderBrowser } from "#app/features/folders";

export const Route = createFileRoute("/_protected/dashboard/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return <FolderBrowser parentId={null} />;
}
