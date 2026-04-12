import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard/assets/")({
  component: MediaLibraryPage,
});

function MediaLibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground">Browse and manage your media assets.</p>
      </div>
    </div>
  );
}
