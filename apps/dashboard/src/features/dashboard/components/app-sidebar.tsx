"use client";

import * as React from "react";
import {
  BarChart2,
  Clapperboard,
  Code,
  CreditCard,
  Folder,
  LayoutDashboard,
  Library,
  LifeBuoy,
  Link2,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Projects",
      url: "#",
      icon: Folder,
    },
    {
      title: "Studio",
      url: "#",
      icon: Clapperboard,
      items: [
        {
          title: "Create New",
          url: "#",
        },
        {
          title: "Video Editor",
          url: "#",
          disabled: true,
          badge: "Soon",
        },
      ],
    },
    {
      title: "Assets",
      url: "#",
      icon: Library,
      items: [
        {
          title: "Media Library",
          url: "#",
        },
        {
          title: "Exports",
          url: "#",
        },
        {
          title: "Trash",
          url: "#",
        },
      ],
    },
    {
      title: "Analytics",
      url: "#",
      icon: BarChart2,
      items: [
        {
          title: "Overview",
          url: "#",
        },
        {
          title: "Content Reports",
          url: "#",
        },
      ],
    },
  ],
  navAdmin: [
    {
      title: "Team",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Members",
          url: "#",
        },
        {
          title: "Roles & Permissions",
          url: "#",
        },
      ],
    },
    {
      title: "Integrations",
      url: "#",
      icon: Link2,
      items: [
        {
          title: "Connected Apps",
          url: "#",
        },
        {
          title: "Webhooks",
          url: "#",
        },
      ],
    },
    {
      title: "Billing",
      url: "#",
      icon: CreditCard,
      items: [
        {
          title: "Subscription",
          url: "#",
        },
        {
          title: "Invoices",
          url: "#",
        },
      ],
    },
    {
      title: "Developers",
      url: "#",
      icon: Code,
      items: [
        {
          title: "API Keys",
          url: "#",
        },
        {
          title: "Documentation",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Clapperboard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">VidCastX</span>
                  <span className="truncate text-xs">Studio</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Platform" items={data.navMain} />
        <NavMain label="Organization" items={data.navAdmin} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
