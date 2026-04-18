import { Globe, Lock } from "lucide-react";

import { Badge } from "@vidcastx/ui/components/badge";
import { cn } from "@vidcastx/ui/lib/utils";

import type { FolderVisibility } from "../validator/folder-schema";

interface FolderVisibilityBadgeProps {
  visibility: FolderVisibility;
  className?: string;
  showLabel?: boolean;
}

const META: Record<FolderVisibility, { label: string; description: string; Icon: typeof Lock }> = {
  private: { label: "Private", description: "Only you and invited members", Icon: Lock },
  public: { label: "Public", description: "Anyone with the link", Icon: Globe },
};

export function folderVisibilityMeta(visibility: FolderVisibility) {
  return META[visibility];
}

export function FolderVisibilityBadge({ visibility, className, showLabel = true }: FolderVisibilityBadgeProps) {
  const { label, Icon } = META[visibility];
  return (
    <Badge variant="outline" className={cn("text-muted-foreground gap-1 text-[10px]", className)}>
      <Icon className="size-3" />
      {showLabel && label}
    </Badge>
  );
}
