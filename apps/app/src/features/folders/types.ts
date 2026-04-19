import type client from "#app/lib/api";

type BrowseResult = Awaited<ReturnType<typeof client.api.v1.folders.browse.get>>;

type NonNullData<T> = T extends { data: infer D } ? Exclude<D, null> : never;

export type BrowseResponse = NonNullData<BrowseResult>;
export type FolderSummary = BrowseResponse["folders"][number];
export type VideoSummary = BrowseResponse["videos"][number];
export type FolderAncestor = BrowseResponse["ancestors"][number];
export type FolderDetail = NonNullable<BrowseResponse["folder"]>;

export type FolderVisibility = FolderSummary["visibility"];
export type VideoVisibility = VideoSummary["visibility"];
