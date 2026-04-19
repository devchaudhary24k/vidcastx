import { Badge } from "@vidcastx/ui/components/badge";
import { cn } from "@vidcastx/ui/lib/utils";

import type { FolderVisibility } from "../validator/folder-schema";
import { FOLDER_VISIBILITY_META } from "../constants/folder-visibility-meta";

interface FolderVisibilityBadgeProps {
  visibility: FolderVisibility;
  className?: string;
  showLabel?: boolean;
}

export function FolderVisibilityBadge({ visibility, className, showLabel = true }: FolderVisibilityBadgeProps) {
  const { label, Icon } = FOLDER_VISIBILITY_META[visibility];
  return (
    <Badge variant="outline" className={cn("text-muted-foreground gap-1 text-[10px]", className)}>
      <Icon className="size-3" />
      {showLabel && label}
    </Badge>
  );
}
