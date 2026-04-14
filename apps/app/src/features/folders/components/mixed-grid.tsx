import { memo, useMemo } from "react";
import { FolderPlus, Upload } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";

import type { Folder } from "../types/folder";
import type { VideoItem } from "../types/video-item";
import { FolderCard } from "./folder-card";
import { VideoCard } from "./video-card";

type MixedGridProps = {
  folders: Folder[];
  videos: VideoItem[];
  onOpenFolder: (id: string) => void;
  onOpenVideo?: (id: string) => void;
  onCreateFolder?: () => void;
  onUploadVideo?: () => void;
};

function MixedGridImpl({ folders, videos, onOpenFolder, onOpenVideo, onCreateFolder, onUploadVideo }: MixedGridProps) {
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [folders]);

  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [videos]);

  const isEmpty = folders.length === 0 && videos.length === 0;

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
    <div className="space-y-3">
      <div className="text-muted-foreground text-xs">
        {folders.length} {folders.length === 1 ? "folder" : "folders"} · {videos.length}{" "}
        {videos.length === 1 ? "video" : "videos"}
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {sortedFolders.map((folder) => (
          <FolderCard key={folder.id} folder={folder} onOpen={onOpenFolder} />
        ))}
        {sortedVideos.map((video) => (
          <VideoCard key={video.id} video={video} onOpen={onOpenVideo} />
        ))}
      </div>
    </div>
  );
}

export const MixedGrid = memo(MixedGridImpl);
