import { memo } from "react";
import { FolderPlus, Upload } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";

import type { FolderSummary, VideoSummary } from "../types";
import { FolderCard } from "./folder-card";
import { VideoCard } from "./video-card";

type MixedGridProps = {
  folders: FolderSummary[];
  videos: VideoSummary[];
  pinnedFolders: FolderSummary[];
  pinnedVideos: VideoSummary[];
  onOpenFolder: (id: string) => void;
  onOpenVideo?: (id: string) => void;
  onToggleFolderPin: (folder: FolderSummary) => void;
  onToggleVideoPin: (video: VideoSummary) => void;
  onDeleteFolder: (folder: FolderSummary) => void;
  onCreateFolder?: () => void;
  onUploadVideo?: () => void;
};

const GRID_CLASSES = "grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

function MixedGridImpl({
  folders,
  videos,
  pinnedFolders,
  pinnedVideos,
  onOpenFolder,
  onOpenVideo,
  onToggleFolderPin,
  onToggleVideoPin,
  onDeleteFolder,
  onCreateFolder,
  onUploadVideo,
}: MixedGridProps) {
  const totalFolders = folders.length + pinnedFolders.length;
  const totalVideos = videos.length + pinnedVideos.length;
  const isEmpty = totalFolders === 0 && totalVideos === 0;

  if (isEmpty) {
    return (
      <div className="border-border flex flex-col items-center justify-center gap-3 border border-dashed px-6 py-16 text-center">
        <div className="text-muted-foreground text-sm">This folder is empty.</div>
        <div className="flex gap-2">
          {onCreateFolder && (
            <Button variant="outline" size="sm" onClick={onCreateFolder}>
              <FolderPlus className="size-4" />
              New folder
            </Button>
          )}
          {onUploadVideo && (
            <Button size="sm" onClick={onUploadVideo}>
              <Upload className="size-4" />
              Upload video
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {pinnedFolders.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Pinned folders</h2>
          <div className={GRID_CLASSES}>
            {pinnedFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onOpen={onOpenFolder}
                onTogglePin={onToggleFolderPin}
                onDelete={onDeleteFolder}
              />
            ))}
          </div>
        </section>
      )}

      {pinnedVideos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Pinned videos</h2>
          <div className={GRID_CLASSES}>
            {pinnedVideos.map((video) => (
              <VideoCard key={video.id} video={video} onOpen={onOpenVideo} onTogglePin={onToggleVideoPin} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="text-muted-foreground text-xs">
          {totalFolders} {totalFolders === 1 ? "folder" : "folders"} · {totalVideos}{" "}
          {totalVideos === 1 ? "video" : "videos"}
        </div>
        <div className={GRID_CLASSES}>
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onOpen={onOpenFolder}
              onTogglePin={onToggleFolderPin}
              onDelete={onDeleteFolder}
            />
          ))}
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onOpen={onOpenVideo} onTogglePin={onToggleVideoPin} />
          ))}
        </div>
      </section>
    </div>
  );
}

export const MixedGrid = memo(MixedGridImpl);
