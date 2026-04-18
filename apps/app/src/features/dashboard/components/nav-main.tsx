import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@vidcastx/ui/components/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@vidcastx/ui/components/sidebar";
import { cn } from "@vidcastx/ui/lib/utils";

export function NavMain({
  items,
  label,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      disabled?: boolean;
      badge?: string;
    }[];
  }[];
  label?: string;
}) {
  const { state } = useSidebar();
  const location = useLocation();
  const pathname = location.pathname;
  const isCollapsed = state === "collapsed";
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

  useEffect(() => {
    const activeItem = items.find(
      (item) =>
        item.items?.some((sub) => pathname === sub.url || pathname.startsWith(`${sub.url}/`)) ||
        pathname === item.url ||
        (pathname.startsWith(`${item.url}/`) && item.url !== "/dashboard"),
    );

    if (activeItem) {
      setOpenCollapsible(activeItem.title);
    }
  }, [pathname, items]);

  return (
    <SidebarMenu>
      {label && !isCollapsed && <div className="text-muted-foreground mb-1 px-2 text-xs font-medium">{label}</div>}
      {items.map((item) => {
        const isOpen = !isCollapsed && openCollapsible === item.title;
        const hasSubRoutes = !!item.items?.length;
        const isActive =
          !hasSubRoutes &&
          (pathname === item.url || (pathname.startsWith(`${item.url}/`) && item.url !== "/dashboard"));

        return (
          <SidebarMenuItem key={item.title}>
            {hasSubRoutes ? (
              <Collapsible
                open={isOpen}
                onOpenChange={(open) => {
                  setOpenCollapsible(open ? item.title : null);
                }}
                className="w-full"
              >
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton tooltip={item.title} isActive={isOpen}>
                      <item.icon />
                      {!isCollapsed && <span className="flex-1 truncate">{item.title}</span>}
                      {!isCollapsed && <span className="ml-auto">{isOpen ? <ChevronUp /> : <ChevronDown />}</span>}
                    </SidebarMenuButton>
                  }
                />

                {!isCollapsed && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const isSubActive = pathname === subItem.url || pathname.startsWith(`${subItem.url}/`);
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              isActive={isSubActive}
                              className={cn(subItem.disabled && "pointer-events-none opacity-50")}
                              render={<Link to={subItem.url} />}
                            >
                              <span className="truncate">{subItem.title}</span>
                              {subItem.badge && (
                                <span className="text-muted-foreground ml-auto text-xs">{subItem.badge}</span>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </Collapsible>
            ) : (
              <SidebarMenuButton tooltip={item.title} isActive={isActive} render={<Link to={item.url} />}>
                <item.icon />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
