import { EyeOff, Globe, Lock } from "lucide-react";

import { Badge } from "@vidcastx/ui/components/badge";
import { cn } from "@vidcastx/ui/lib/utils";

import type { FolderVisibility } from "../types/folder";

type FolderVisibilityBadgeProps = {
  visibility: FolderVisibility;
  className?: string;
  showLabel?: boolean;
};

const META: Record<FolderVisibility, { label: string; description: string; Icon: typeof Lock }> = {
  private: { label: "Private", description: "Only you and invited members", Icon: Lock },
  unlisted: { label: "Unlisted", description: "Anyone with the link", Icon: EyeOff },
  public: { label: "Public", description: "Anyone on the internet", Icon: Globe },
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
