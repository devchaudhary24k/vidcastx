import * as React from "react";
import { type LucideIcon } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@vidcastx/ui/components/sidebar";
import { cn } from "@vidcastx/ui/lib/utils";

export function NavSecondary({
  items,
  className,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
  className?: string;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu className={className}>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            size="sm"
            className={cn(isCollapsed && "justify-center")}
          >
            <a href={item.url}>
              <item.icon className="size-4" />
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
