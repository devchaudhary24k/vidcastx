import { useRouter } from "@tanstack/react-router";
import { BadgeCheck, Bell, ChevronsUpDown, CreditCard, LogOut, Monitor, Moon, Sparkles, Sun } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@vidcastx/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vidcastx/ui/components/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@vidcastx/ui/components/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@vidcastx/ui/components/toggle-group";

import { auth } from "#app/lib/auth";
import { useTheme } from "#app/lib/use-theme";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { mode, setTheme } = useTheme();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="h-8 w-8 rounded-none after:rounded-none [&>*]:rounded-none">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-none after:rounded-none [&>*]:rounded-none">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-muted-foreground mb-1.5 text-xs">Theme</p>
              <ToggleGroup
                variant="outline"
                size="sm"
                value={[mode]}
                onValueChange={(value) => {
                  const next = value[0];
                  if (next === "light" || next === "dark" || next === "auto") {
                    setTheme(next);
                  }
                }}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <ToggleGroupItem value="light" aria-label="Light theme" className="flex-1 gap-1.5">
                  <Sun className="size-3.5" />
                  Light
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Dark theme" className="flex-1 gap-1.5">
                  <Moon className="size-3.5" />
                  Dark
                </ToggleGroupItem>
                <ToggleGroupItem value="auto" aria-label="System theme" className="flex-1 gap-1.5">
                  <Monitor className="size-3.5" />
                  Auto
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void auth.signOut({
                  fetchOptions: {
                    onSuccess() {
                      void router.navigate({ to: "/auth/login" });
                    },
                  },
                });
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
