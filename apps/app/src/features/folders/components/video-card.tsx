import { memo, useCallback } from "react";
import { Eye, EyeOff, FileVideo, Globe, Play } from "lucide-react";

import type { VideoItem, VideoVisibility } from "../types/video-item";
import { MediaCardShell } from "./media-card-shell";
import { VideoActionsMenu } from "./video-actions-menu";

type VideoCardProps = {
  video: VideoItem;
  onOpen?: (id: string) => void;
};

function formatDuration(seconds: number): string | null {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function formatRelative(iso: string): string {
  const diffSec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604_800) return `${Math.floor(diffSec / 86_400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function VisibilityIcon({ visibility }: { visibility: VideoVisibility }) {
  if (visibility === "public") return <Globe className="size-3" />;
  if (visibility === "unlisted") return <Eye className="size-3" />;
  return <EyeOff className="size-3" />;
}

function VideoCardImpl({ video, onOpen }: VideoCardProps) {
  const { title, durationSec, visibility, thumbnailHue, createdAt } = video;
  const duration = formatDuration(durationSec);

  const gradient = {
    backgroundImage: `linear-gradient(135deg, hsl(${thumbnailHue} 65% 55%), hsl(${(thumbnailHue + 40) % 360} 55% 35%))`,
  };

  const handleOpen = useCallback(() => onOpen?.(video.id), [onOpen, video.id]);

  const thumb = (
    <div className="bg-muted relative aspect-video w-full overflow-hidden" style={gradient}>
      <div className="absolute inset-0 flex items-center justify-center">
        <FileVideo className="size-10 text-white/30" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/20">
        <Play
          className="size-10 text-white opacity-0 drop-shadow-lg transition-opacity duration-200 group-hover:opacity-100"
          fill="white"
        />
      </div>
      {duration && (
        <span className="absolute right-1.5 bottom-1.5 bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
          {duration}
        </span>
      )}
    </div>
  );

  const titleNode = <h3 className="line-clamp-2 text-sm leading-snug font-semibold group-hover:underline">{title}</h3>;

  const meta = (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1">
        <VisibilityIcon visibility={visibility} />
        <span className="capitalize">{visibility}</span>
      </span>
      <span>•</span>
      <span>{formatRelative(createdAt)}</span>
    </div>
  );

  return (
    <MediaCardShell thumb={thumb} title={titleNode} meta={meta} actions={<VideoActionsMenu />} onOpen={handleOpen} />
  );
}

export const VideoCard = memo(VideoCardImpl);
