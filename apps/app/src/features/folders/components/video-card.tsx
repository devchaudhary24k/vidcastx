import { memo, useCallback } from "react";
import { FileVideo, Globe, Lock, Pin, Play } from "lucide-react";

import type { VideoSummary, VideoVisibility } from "../types";
import { MediaCardShell } from "./media-card-shell";
import { VideoActionsMenu } from "./video-actions-menu";

type VideoCardProps = {
  video: VideoSummary;
  onOpen?: (id: string) => void;
  onTogglePin: (video: VideoSummary) => void;
};

function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function formatRelative(iso: string | Date): string {
  const time = typeof iso === "string" ? new Date(iso).getTime() : iso.getTime();
  const diffSec = (Date.now() - time) / 1000;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604_800) return `${Math.floor(diffSec / 86_400)}d ago`;
  return new Date(time).toLocaleDateString();
}

function VisibilityIcon({ visibility }: { visibility: VideoVisibility }) {
  if (visibility === "public") return <Globe className="size-3" />;
  return <Lock className="size-3" />;
}

function hashHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

function VideoCardImpl({ video, onOpen, onTogglePin }: VideoCardProps) {
  const { id, title, duration, visibility, createdAt, pinned } = video;
  const formattedDuration = formatDuration(duration);
  const hue = hashHue(id);

  const gradient = {
    backgroundImage: `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${(hue + 40) % 360} 55% 35%))`,
  };

  const handleOpen = useCallback(() => onOpen?.(id), [onOpen, id]);
  const handleTogglePin = useCallback(() => onTogglePin(video), [onTogglePin, video]);

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
      {pinned && (
        <span
          className="bg-background/80 absolute top-1.5 right-1.5 inline-flex size-5 items-center justify-center"
          aria-label="Pinned"
        >
          <Pin className="size-3" />
        </span>
      )}
      {formattedDuration && (
        <span className="absolute right-1.5 bottom-1.5 bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
          {formattedDuration}
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
    <MediaCardShell
      thumb={thumb}
      title={titleNode}
      meta={meta}
      actions={<VideoActionsMenu pinned={pinned} onTogglePin={handleTogglePin} />}
      onOpen={handleOpen}
    />
  );
}

export const VideoCard = memo(VideoCardImpl);
