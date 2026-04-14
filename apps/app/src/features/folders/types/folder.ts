export type FolderVisibility = "private" | "unlisted" | "public";

export type FolderColor = "slate" | "blue" | "green" | "purple" | "pink" | "amber" | "rose";

export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  visibility: FolderVisibility;
  color: FolderColor;
  coverImageUrl: string | null;
  description: string | null;
  pinned: boolean;
  defaultVideoPrivate: boolean;
  passwordProtected: boolean;
  videoCount: number;
  subfolderCount: number;
  createdAt: string;
  updatedAt: string;
};
