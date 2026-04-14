import type { CreateFolderInput, Folder, VideoItem } from "#app/features/folders";
import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "#app/components/page-header";
import { CreateFolderDialog, FolderBreadcrumb, MixedGrid, MOCK_FOLDERS, MOCK_VIDEOS } from "#app/features/folders";
import { FolderPlus, Plus, Upload } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";

// import { VideosGrid } from "#app/features/videos"; // replaced by MixedGrid for the folder-browser UI iteration

export const Route = createFileRoute("/_protected/dashboard/projects/")({
  component: ProjectsPage,
});

function generateFolderId(): string {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `fld_${rand}`;
}

function ProjectsPage() {
  const [folders, setFolders] = useState<Folder[]>(MOCK_FOLDERS);
  const [videos] = useState<VideoItem[]>(MOCK_VIDEOS);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const visibleFolders = useMemo(
    () => folders.filter((f) => f.parentId === currentFolderId),
    [folders, currentFolderId],
  );

  const visibleVideos = useMemo(() => videos.filter((v) => v.folderId === currentFolderId), [videos, currentFolderId]);

  const currentFolder = useMemo(
    () => folders.find((f) => f.id === currentFolderId) ?? null,
    [folders, currentFolderId],
  );

  const handleCreateFolder = useCallback(
    (input: CreateFolderInput) => {
      const now = new Date().toISOString();
      setFolders((prev) => [
        {
          id: generateFolderId(),
          name: input.name,
          parentId: currentFolderId,
          visibility: input.visibility,
          color: input.color,
          coverImageUrl: input.coverImageUrl,
          description: input.description,
          pinned: input.pinned,
          defaultVideoPrivate: input.defaultVideoPrivate,
          passwordProtected: input.passwordProtected,
          videoCount: 0,
          subfolderCount: 0,
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ]);
    },
    [currentFolderId],
  );

  const handleOpenFolder = useCallback((id: string) => {
    setCurrentFolderId(id);
  }, []);

  const parentFolderName = currentFolder?.name ?? "All folders";
  const headerTitle = currentFolder?.name ?? "Projects";
  const headerDescription = currentFolder
    ? (currentFolder.description ?? `Videos and folders inside ${currentFolder.name}.`)
    : "Manage your video projects.";

  return (
    <div className="space-y-6">
      <PageHeader
        title={headerTitle}
        description={headerDescription}
        actions={
          <>
            <CreateFolderDialog parentFolderName={parentFolderName} onCreate={handleCreateFolder}>
              <Button variant="outline" size="sm">
                <FolderPlus className="size-4" />
                New folder
              </Button>
            </CreateFolderDialog>
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

      <FolderBreadcrumb folders={folders} currentFolderId={currentFolderId} onNavigate={setCurrentFolderId} />

      <MixedGrid folders={visibleFolders} videos={visibleVideos} onOpenFolder={handleOpenFolder} />
    </div>
  );
}
