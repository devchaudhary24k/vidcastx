"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";

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
  const pathname = usePathname();
  const isCollapsed = state === "collapsed";
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

  useEffect(() => {
    const activeItem = items.find(
      (item) =>
        item.items?.some(
          (sub) => pathname === sub.url || pathname.startsWith(`${sub.url}/`),
        ) ||
        pathname === item.url ||
        (pathname.startsWith(`${item.url}/`) && item.url !== "/dashboard"),
    );

    if (activeItem) {
      setOpenCollapsible(activeItem.title);
    }
  }, [pathname, items]);

  return (
    <SidebarMenu>
      {label && !isCollapsed && (
        <div className="text-muted-foreground mb-2 px-2 text-xs font-medium">
          {label}
        </div>
      )}
      {items.map((item) => {
        const isOpen = !isCollapsed && openCollapsible === item.title;
        const hasSubRoutes = !!item.items?.length;
        const isActive =
          !hasSubRoutes &&
          (pathname === item.url ||
            (pathname.startsWith(`${item.url}/`) && item.url !== "/dashboard"));

        return (
          <SidebarMenuItem key={item.title}>
            {hasSubRoutes ? (
              <Collapsible
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenCollapsible(open ? item.title : null)
                }
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isOpen}
                    className={cn(
                      "flex w-full items-center rounded-lg px-2 transition-colors",
                      isCollapsed && "justify-center",
                    )}
                  >
                    <item.icon className="size-4" />
                    {!isCollapsed && (
                      <span className="ml-2 flex-1 text-sm font-medium">
                        {item.title}
                      </span>
                    )}
                    {!isCollapsed && (
                      <span className="ml-auto">
                        {isOpen ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </span>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                {!isCollapsed && (
                  <CollapsibleContent>
                    <SidebarMenuSub className="my-1 ml-3.5">
                      {item.items?.map((subItem) => {
                        const isSubActive =
                          pathname === subItem.url ||
                          pathname.startsWith(`${subItem.url}/`);
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                            >
                              <Link
                                href={subItem.url}
                                className={cn(
                                  "flex items-center rounded-md px-4 py-1.5 text-sm font-medium",
                                  subItem.disabled &&
                                    "pointer-events-none opacity-50",
                                )}
                              >
                                <span>{subItem.title}</span>
                                {subItem.badge && (
                                  <span className="text-muted-foreground ml-auto text-xs">
                                    {subItem.badge}
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </Collapsible>
            ) : (
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={isActive}
                className={cn(
                  "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center rounded-lg px-2 transition-colors",
                  isCollapsed && "justify-center",
                )}
              >
                <Link href={item.url}>
                  <item.icon className="size-4" />
                  {!isCollapsed && (
                    <span className="ml-2 text-sm font-medium">
                      {item.title}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
