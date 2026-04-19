import { Globe, Lock } from "lucide-react";

import type { FolderVisibility } from "../validator/folder-schema";

export const FOLDER_VISIBILITY_META: Record<
  FolderVisibility,
  { label: string; description: string; Icon: typeof Lock }
> = {
  private: { label: "Private", description: "Only you and invited members", Icon: Lock },
  public: { label: "Public", description: "Anyone with the link", Icon: Globe },
};

export function folderVisibilityMeta(visibility: FolderVisibility) {
  return FOLDER_VISIBILITY_META[visibility];
}
