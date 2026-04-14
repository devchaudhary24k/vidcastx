import { createFileRoute } from "@tanstack/react-router";
import { FolderBrowser } from "#app/features/folders";

export const Route = createFileRoute("/_protected/dashboard/projects/f/$folderId")({
  component: FolderPage,
});

function FolderPage() {
  const { folderId } = Route.useParams();
  return <FolderBrowser parentId={folderId} />;
}
