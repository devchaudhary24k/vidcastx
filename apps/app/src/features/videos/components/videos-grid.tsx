import { Skeleton } from "@vidcastx/ui/components/skeleton";

import { useVideos } from "../api/use-videos";
import { VideoCard } from "./video-card";

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
      {data.videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
