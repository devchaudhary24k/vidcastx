import type { ReactNode } from "react";
import { memo } from "react";

import { cn } from "@vidcastx/ui/lib/utils";

interface MediaCardShellProps {
  thumb: ReactNode;
  title: ReactNode;
  meta: ReactNode;
  actions?: ReactNode;
  onOpen?: () => void;
  className?: string;
}

function MediaCardShellImpl({ thumb, title, meta, actions, onOpen, className }: MediaCardShellProps) {
  return (
    <div className={cn("group flex flex-col", className)}>
      <button type="button" onClick={onOpen} className="block w-full cursor-pointer overflow-hidden text-left">
        {thumb}
      </button>
      <div className="mt-3 flex items-start gap-2">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 text-left">
          {title}
          {meta}
        </button>
        {actions}
      </div>
    </div>
  );
}

export const MediaCardShell = memo(MediaCardShellImpl);
