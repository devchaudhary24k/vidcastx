import { createFileRoute } from "@tanstack/react-router";

import { VideoUploadForm } from "#app/features/videos";

export const Route = createFileRoute("/_protected/dashboard/studio/new")({
  component: CreateNewPage,
});

function CreateNewPage() {
  return <VideoUploadForm />;
}
