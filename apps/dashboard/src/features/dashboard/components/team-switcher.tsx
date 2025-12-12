"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getOrganizationsAction } from "@dashboard/features/dashboard";
import { auth } from "@dashboard/lib/auth";
import { useQuery } from "@tanstack/react-query"; // No need for useQueryClient
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@vidcastx/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@vidcastx/ui/components/sidebar";

import type { Organization } from "./types";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { Logo } from "./logo";

export function TeamSwitcher({
  activeOrganizationId,
}: {
  activeOrganizationId: string;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  // 1. Fetch data (Hydrated from server, so it's instant)
  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizationsAction,
  });

  // 2. DERIVED STATE (No useState needed)
  // We calculate the active org based on the ID passed from the Server Layout.
  // When router.refresh() happens, 'activeOrganizationId' updates, and this recalculates automatically.
  const activeOrganization =
    organizations.find((org) => org.id === activeOrganizationId) ||
    organizations[0];

  const handleSwitchOrganization = async (org: Organization) => {
    // Prevent switching if already active
    if (org.id === activeOrganizationId) return;

    try {
      await auth.organization.setActive({
        organizationId: org.id,
      });

      toast.success(`Switching to ${org.name}...`);

      // 2. Refresh Server Components
      // This re-runs DashboardLayout -> fetches new Session -> passes new activeOrganizationId prop
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to switch organization");
    }
  };

  // Guard clause for safety
  if (!activeOrganization) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-background text-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {activeOrganization.logo ? (
                  <img
                    src={activeOrganization.logo}
                    alt={activeOrganization.name}
                    className="size-4"
                  />
                ) : (
                  <Logo className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeOrganization.name}
                </span>
                <span className="truncate text-xs">Organization</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="mb-4 w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org, index) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitchOrganization(org)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="size-4 shrink-0"
                    />
                  ) : (
                    <Logo className="size-4 shrink-0" />
                  )}
                </div>
                {org.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <CreateOrganizationDialog>
              <DropdownMenuItem
                className="gap-2 p-2"
                onSelect={(e) => e.preventDefault()}
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add organization
                </div>
              </DropdownMenuItem>
            </CreateOrganizationDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
