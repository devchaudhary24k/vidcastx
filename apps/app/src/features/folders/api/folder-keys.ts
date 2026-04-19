export const folderKeys = {
  all: () => ["folders"] as const,
  browse: (parentId: string | null) => ["folders", "browse", parentId] as const,
  detail: (id: string) => ["folders", "detail", id] as const,
};
