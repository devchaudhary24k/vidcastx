import { memo, useCallback } from "react";
import { Folder as FolderIcon, Lock, Pin } from "lucide-react";

import { cn } from "@vidcastx/ui/lib/utils";

import type { Folder } from "../types/folder";
import { FOLDER_COLOR_CLASSES } from "../constants/folder-colors";
import { FolderActionsMenu } from "./folder-actions-menu";
import { folderVisibilityMeta } from "./folder-visibility-badge";
import { MediaCardShell } from "./media-card-shell";

type FolderCardProps = {
  folder: Folder;
  onOpen: (id: string) => void;
};

function FolderCardImpl({ folder, onOpen }: FolderCardProps) {
  const { videoCount, subfolderCount, coverImageUrl, pinned, passwordProtected, visibility } = folder;
  const colorClasses = FOLDER_COLOR_CLASSES[folder.color];
  const visibilityMeta = folderVisibilityMeta(visibility);

  const handleOpen = useCallback(() => onOpen(folder.id), [onOpen, folder.id]);

  const thumb = (
    <div className={cn("relative aspect-video w-full overflow-hidden", colorClasses.tint)}>
      <div className={cn("absolute inset-x-0 top-0 h-0.5", colorClasses.accent)} />
      {coverImageUrl ? (
        <img src={coverImageUrl} alt={folder.name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <FolderIcon className="text-foreground/40 size-10" />
        </div>
      )}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
        {pinned && (
          <span className="bg-background/80 inline-flex size-5 items-center justify-center" aria-label="Pinned">
            <Pin className="size-3" />
          </span>
        )}
        {passwordProtected && (
          <span
            className="bg-background/80 inline-flex size-5 items-center justify-center"
            aria-label="Password protected"
          >
            <Lock className="size-3" />
          </span>
        )}
      </div>
    </div>
  );

  const title = <h3 className="line-clamp-2 text-sm leading-snug font-semibold">{folder.name}</h3>;

  const meta = (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1">
        <visibilityMeta.Icon className="size-3" />
        <span className="capitalize">{visibility}</span>
      </span>
      <span>•</span>
      <span>
        {videoCount} {videoCount === 1 ? "video" : "videos"}
      </span>
      {subfolderCount > 0 && (
        <>
          <span>•</span>
          <span>
            {subfolderCount} {subfolderCount === 1 ? "folder" : "folders"}
          </span>
        </>
      )}
    </div>
  );

  return (
    <MediaCardShell
      thumb={thumb}
      title={title}
      meta={meta}
      actions={<FolderActionsMenu pinned={pinned} onOpen={handleOpen} />}
      onOpen={handleOpen}
    />
  );
}

export const FolderCard = memo(FolderCardImpl);
