import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard/studio/editor")({
  component: VideoEditorPage,
});

function VideoEditorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Video Editor</h1>
        <p className="text-muted-foreground">Edit your videos. Coming soon.</p>
      </div>
    </div>
  );
}
