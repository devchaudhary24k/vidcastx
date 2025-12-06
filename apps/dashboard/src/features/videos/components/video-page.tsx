"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutGrid, List as ListIcon, Plus, Search } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";

export function VideoList() {
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <div className="flex flex-col gap-6">
      {/* Controls Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted flex items-center rounded-lg p-1">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setView("list")}
            >
              <ListIcon className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Upload Video
            </Link>
          </Button>
        </div>
      </div>

      {/* Empty State / Content Placeholder */}
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Your projects will appear here.
        </p>
      </div>
    </div>
  );
}
