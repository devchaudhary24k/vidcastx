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
} from "@vidcastx/ui/components/sidebar";
import { cn } from "@vidcastx/ui/lib/utils";

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
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Projects",
      url: "/dashboard/projects",
      icon: Folder,
    },
    {
      title: "Studio",
      url: "/dashboard/studio",
      icon: Clapperboard,
      items: [
        {
          title: "Create New",
          url: "/dashboard/studio/new",
        },
        {
          title: "Video Editor",
          url: "/dashboard/studio/editor",
          disabled: true,
          badge: "Soon",
        },
      ],
    },
    {
      title: "Assets",
      url: "/dashboard/assets",
      icon: Library,
      items: [
        {
          title: "Media Library",
          url: "/dashboard/assets",
        },
        {
          title: "Exports",
          url: "/dashboard/assets/exports",
        },
        {
          title: "Trash",
          url: "/dashboard/assets/trash",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChart2,
      items: [
        {
          title: "Overview",
          url: "/dashboard/analytics",
        },
        {
          title: "Content Reports",
          url: "/dashboard/analytics/reports",
        },
      ],
    },
  ],
  navAdmin: [
    {
      title: "Team",
      url: "/dashboard/team",
      icon: Users,
      items: [
        {
          title: "Members",
          url: "/dashboard/team/members",
        },
        {
          title: "Roles & Permissions",
          url: "/dashboard/team/roles",
        },
      ],
    },
    {
      title: "Integrations",
      url: "/dashboard/integrations",
      icon: Link2,
      items: [
        {
          title: "Connected Apps",
          url: "/dashboard/integrations/apps",
        },
        {
          title: "Webhooks",
          url: "/dashboard/integrations/webhooks",
        },
      ],
    },
    {
      title: "Billing",
      url: "/dashboard/billing",
      icon: CreditCard,
      items: [
        {
          title: "Subscription",
          url: "/dashboard/billing/subscription",
        },
        {
          title: "Invoices",
          url: "/dashboard/billing/invoices",
        },
      ],
    },
    {
      title: "Developers",
      url: "/dashboard/developers",
      icon: Code,
      items: [
        {
          title: "API Keys",
          url: "/dashboard/developers/api-keys",
        },
        {
          title: "Documentation",
          url: "/dashboard/developers/docs",
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
