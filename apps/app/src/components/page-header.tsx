import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import { cn } from "@vidcastx/ui/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  backTo,
  backLabel = "Back",
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {backTo && (
        <Button variant="ghost" size="sm" className="-ml-2 self-start" render={<Link to={backTo} />}>
          <ArrowLeft className="size-4" />
          {backLabel}
        </Button>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
