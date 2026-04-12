import { useRouter } from "@tanstack/react-router";
import { auth } from "#app/lib/auth";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@vidcastx/ui/components/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@vidcastx/ui/components/sidebar";

import type { Organization } from "./types";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { Logo } from "./logo";

export function TeamSwitcher({
  organizations,
  activeOrganizationId,
}: {
  organizations: Organization[];
  activeOrganizationId: string;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const activeOrganization = organizations.find((org) => org.id === activeOrganizationId) || organizations[0];

  const handleSwitchOrganization = async (org: Organization) => {
    if (org.id === activeOrganizationId) return;

    await auth.organization.setActive({
      organizationId: org.id,
      fetchOptions: {
        onSuccess() {
          toast.success(`Switching to ${org.name}...`);
          router.invalidate();
        },
        onError() {
          toast.error("Failed to switch organization");
        },
      },
    });
  };

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
              <div className="bg-background text-foreground flex aspect-square size-8 items-center justify-center">
                {activeOrganization.logo ? (
                  <img src={activeOrganization.logo} alt={activeOrganization.name} className="size-4" />
                ) : (
                  <Logo className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeOrganization.name}</span>
                <span className="truncate text-xs">Organization</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="mb-4 w-(--anchor-width) min-w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">Organizations</DropdownMenuLabel>
            </DropdownMenuGroup>
            {organizations.map((org, index) => (
              <DropdownMenuItem key={org.id} onClick={() => handleSwitchOrganization(org)} className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center border">
                  {org.logo ? (
                    <img src={org.logo} alt={org.name} className="size-4 shrink-0" />
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
              <DropdownMenuItem className="gap-2 p-2" onSelect={(e) => e.preventDefault()}>
                <div className="bg-background flex size-6 items-center justify-center border">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Add organization</div>
              </DropdownMenuItem>
            </CreateOrganizationDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
