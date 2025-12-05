"use client";

import * as React from "react";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
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
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";

import { Logo } from "./logo";
import { NavMain } from "./nav-main";
import { NotificationsPopover } from "./nav-notifications";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";

const sampleNotifications = [
  {
    id: "1",
    avatar: "/avatars/01.png",
    fallback: "OM",
    text: "New order received.",
    time: "10m ago",
  },
  {
    id: "2",
    avatar: "/avatars/02.png",
    fallback: "JL",
    text: "Server upgrade completed.",
    time: "1h ago",
  },
  {
    id: "3",
    avatar: "/avatars/03.png",
    fallback: "HH",
    text: "New user signed up.",
    time: "2h ago",
  },
];

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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const headerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      headerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.8 },
    );
  }, [isCollapsed]);

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader
        className={cn(
          "flex md:pt-3.5",
          isCollapsed
            ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
            : "flex-row items-center justify-between",
        )}
      >
        <a href="#" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          {!isCollapsed && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-black dark:text-white">
                VidCastX
              </span>
              <span className="text-muted-foreground truncate text-xs">
                Studio
              </span>
            </div>
          )}
        </a>

        <div
          ref={headerRef}
          className={cn(
            "flex items-center gap-2",
            isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row",
          )}
        >
          <NotificationsPopover notifications={sampleNotifications} />
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
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
