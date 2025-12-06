"use client";

import * as React from "react";
import { useState } from "react";
import {
  BarChart2,
  Clapperboard,
  Code,
  CreditCard,
  Folder,
  LayoutDashboard,
  Library,
  Link2,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";

import type { SidebarData } from "./types";
import { CommandMenu } from "./command-menu";
import { Logo } from "./logo";
import { NavMain } from "./nav-main";
import { NavSearch } from "./nav-search";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

const teams = [
  { id: "1", name: "VidcastX", logo: Logo, plan: "Enterprise" },
  { id: "2", name: "Pixelact Studios", logo: Logo, plan: "Startup" },
  { id: "3", name: "Evil Corp.", logo: Logo, plan: "Free" },
];

const data: SidebarData = {
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [commandMenuOpen, setCommandMenuOpen] = useState(false);

  return (
    <>
      <Sidebar variant="floating" collapsible="icon" {...props}>
        <SidebarHeader
          className={cn(
            "flex w-full md:pt-3.5",
            isCollapsed
              ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
              : "flex-row items-center justify-between",
          )}
        >
          <TeamSwitcher teams={teams} />
        </SidebarHeader>
        <SidebarContent className="gap-4 px-2 py-4">
          <NavSearch onClick={() => setCommandMenuOpen(true)} />
          <NavMain label="Platform" items={data.navMain} />
          <NavMain label="Organization" items={data.navAdmin} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      <CommandMenu
        open={commandMenuOpen}
        setOpen={setCommandMenuOpen}
        data={data}
      />
    </>
  );
}
