import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, Globe } from "lucide-react";

import { Badge } from "@vidcastx/ui/components/badge";
import { Skeleton } from "@vidcastx/ui/components/skeleton";
import { cn } from "@vidcastx/ui/lib/utils";

import { useVideos } from "../api/use-videos";

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function formatRelative(date: string | Date) {
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ready: "default",
  processing: "secondary",
  queued: "secondary",
  dispatched: "secondary",
  uploaded: "secondary",
  draft: "outline",
  failed: "destructive",
};

function VisibilityIcon({ visibility }: { visibility: string }) {
  if (visibility === "public") return <Globe className="h-3 w-3" />;
  if (visibility === "unlisted") return <Eye className="h-3 w-3" />;
  return <EyeOff className="h-3 w-3" />;
}

export function VideosGrid() {
  const { data, isPending, isError, error } = useVideos();

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive text-sm">{error.message}</p>;
  }

  if (!data || data.videos.length === 0) {
    return <p className="text-muted-foreground text-sm">No videos yet. Upload one to get started.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.videos.map((video) => {
        const duration = formatDuration(video.duration);
        const isPlayable = video.status === "ready" && video.playbackUrl;
        return (
          <Link
            key={video.id}
            to="/dashboard/videos/$videoId"
            params={{ videoId: video.id }}
            className="group flex flex-col gap-3"
          >
            <div className="bg-muted relative aspect-video w-full overflow-hidden">
              {isPlayable ? (
                <img
                  src={video.playbackUrl!}
                  alt={video.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
              ) : (
                <div className="from-muted to-muted-foreground/10 absolute inset-0 flex items-center justify-center bg-gradient-to-br">
                  <span className="text-muted-foreground text-xs tracking-wider uppercase">{video.status}</span>
                </div>
              )}
              {duration && (
                <span className="absolute right-1.5 bottom-1.5 bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                  {duration}
                </span>
              )}
              {!isPlayable && (
                <span className="absolute top-1.5 left-1.5">
                  <Badge variant={statusVariant[video.status] ?? "secondary"} className="text-[10px] uppercase">
                    {video.status}
                  </Badge>
                </span>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="line-clamp-2 text-sm leading-snug font-semibold group-hover:underline">{video.title}</h3>
              {video.description && <p className="text-muted-foreground line-clamp-1 text-xs">{video.description}</p>}
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1">
                  <VisibilityIcon visibility={video.visibility} />
                  <span className="capitalize">{video.visibility}</span>
                </span>
                <span>•</span>
                <span>{formatRelative(video.createdAt)}</span>
                {video.resolution && (
                  <>
                    <span>•</span>
                    <span className={cn("font-mono")}>{video.resolution}</span>
                  </>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
