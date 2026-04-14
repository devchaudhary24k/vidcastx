import { memo, useCallback } from "react";
import { Folder as FolderIcon, Pin } from "lucide-react";

import type { FolderSummary } from "../types";
import { tintColor } from "../constants/folder-color-presets";
import { FolderActionsMenu } from "./folder-actions-menu";
import { folderVisibilityMeta } from "./folder-visibility-badge";
import { MediaCardShell } from "./media-card-shell";

type FolderCardProps = {
  folder: FolderSummary;
  onOpen: (id: string) => void;
  onTogglePin: (folder: FolderSummary) => void;
  onDelete: (folder: FolderSummary) => void;
};

function FolderCardImpl({ folder, onOpen, onTogglePin, onDelete }: FolderCardProps) {
  const { videoCount, subfolderCount, coverImageUrl, pinned, visibility, color, name } = folder;
  const visibilityMeta = folderVisibilityMeta(visibility);

  const handleOpen = useCallback(() => onOpen(folder.id), [onOpen, folder.id]);
  const handleTogglePin = useCallback(() => onTogglePin(folder), [onTogglePin, folder]);
  const handleDelete = useCallback(() => onDelete(folder), [onDelete, folder]);

  const thumb = (
    <div className="relative aspect-video w-full overflow-hidden" style={{ backgroundColor: tintColor(color) }}>
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: color }} />
      {coverImageUrl ? (
        <img src={coverImageUrl} alt={name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <FolderIcon className="size-10" style={{ color }} />
        </div>
      )}
      {pinned && (
        <span
          className="bg-background/80 absolute top-1.5 right-1.5 inline-flex size-5 items-center justify-center"
          aria-label="Pinned"
        >
          <Pin className="size-3" />
        </span>
      )}
    </div>
  );

  const title = <h3 className="line-clamp-2 text-sm leading-snug font-semibold">{name}</h3>;

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
      actions={
        <FolderActionsMenu pinned={pinned} onOpen={handleOpen} onTogglePin={handleTogglePin} onDelete={handleDelete} />
      }
      onOpen={handleOpen}
    />
  );
}

export const FolderCard = memo(FolderCardImpl);
