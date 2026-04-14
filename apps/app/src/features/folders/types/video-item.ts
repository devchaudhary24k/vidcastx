export type VideoVisibility = "private" | "unlisted" | "public";

export type VideoItem = {
  id: string;
  folderId: string | null;
  title: string;
  durationSec: number;
  visibility: VideoVisibility;
  thumbnailHue: number;
  createdAt: string;
};
