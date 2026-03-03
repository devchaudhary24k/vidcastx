"use client";

import * as React from "react";
import { Search } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@vidcastx/ui/components/sidebar";
import { cn } from "@vidcastx/ui/lib/utils";

export function NavSearch({ onClick }: { onClick: () => void }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="Search"
          onClick={onClick}
          className={cn("text-muted-foreground")}
        >
          <Search className="size-4" />
          {!isCollapsed && (
            <>
              <span className="ml-2 flex-1 text-sm">Search</span>
              <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                <span className="text-xs">⌘</span>K
              </kbd>
            </>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
