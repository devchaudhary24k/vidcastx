import * as React from "react";
import { useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CornerDownLeft, LogOut, Moon, Plus, Sun, Upload, UserPlus } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@vidcastx/ui/components/command";

import type { NavItem, SidebarData } from "./types";

interface CommandMenuProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data: SidebarData;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  link: string;
  shortcut?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "upload-video",
    title: "Upload video",
    subtitle: "Start new upload",
    icon: Upload,
    link: "/dashboard/studio/new",
    shortcut: "⌘U",
  },
  {
    id: "new-project",
    title: "New project",
    subtitle: "Create a project",
    icon: Plus,
    link: "/dashboard/projects",
  },
  {
    id: "invite-member",
    title: "Invite team member",
    subtitle: "Send an invite",
    icon: UserPlus,
    link: "/dashboard/team/members",
  },
];

interface FlatNav {
  parent: NavItem;
  sub?: NonNullable<NavItem["items"]>[number];
}

function flattenGroup(items: NavItem[]): FlatNav[] {
  const out: FlatNav[] = [];
  for (const parent of items) {
    out.push({ parent });
    for (const sub of parent.items ?? []) {
      out.push({ parent, sub });
    }
  }
  return out;
}

export function CommandMenu({ open, setOpen, data }: CommandMenuProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => {
      document.removeEventListener("keydown", down);
    };
  }, [setOpen]);

  const platform = useMemo(() => flattenGroup(data.navMain), [data.navMain]);
  const organization = useMemo(() => flattenGroup(data.navAdmin), [data.navAdmin]);

  const go = (link: string) => {
    setOpen(false);
    void navigate({ to: link });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="sm:max-w-2xl">
      <Command>
        <CommandInput placeholder="Search pages, actions, settings..." />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Quick actions">
            {QUICK_ACTIONS.map((action) => (
              <CommandItem
                key={action.id}
                value={`quick ${action.title} ${action.subtitle ?? ""}`}
                onSelect={() => {
                  go(action.link);
                }}
              >
                <action.icon className="text-muted-foreground size-4" />
                <div className="flex flex-col">
                  <span>{action.title}</span>
                  {action.subtitle && <span className="text-muted-foreground text-[10px]">{action.subtitle}</span>}
                </div>
                {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Platform">
            {platform.map(({ parent, sub }) => (
              <NavCommandItem
                key={sub ? `${parent.title}-${sub.title}` : parent.title}
                parent={parent}
                sub={sub}
                onSelect={go}
              />
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Organization">
            {organization.map(({ parent, sub }) => (
              <NavCommandItem
                key={sub ? `${parent.title}-${sub.title}` : parent.title}
                parent={parent}
                sub={sub}
                onSelect={go}
              />
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Preferences">
            <CommandItem
              value="theme light"
              onSelect={() => {
                setOpen(false);
              }}
            >
              <Sun className="text-muted-foreground size-4" />
              <span>Switch to light theme</span>
            </CommandItem>
            <CommandItem
              value="theme dark"
              onSelect={() => {
                setOpen(false);
              }}
            >
              <Moon className="text-muted-foreground size-4" />
              <span>Switch to dark theme</span>
            </CommandItem>
            <CommandItem
              value="log out sign out"
              onSelect={() => {
                setOpen(false);
              }}
            >
              <LogOut className="text-muted-foreground size-4" />
              <span>Log out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        <div className="text-muted-foreground flex items-center justify-between border-t px-3 py-2 text-[10px]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Kbd>
                <CornerDownLeft className="size-3" />
              </Kbd>
              Select
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              Navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>esc</Kbd>
              Close
            </span>
          </div>
          <span className="inline-flex items-center gap-1">
            Jump to page
            <ArrowRight className="size-3" />
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}

function NavCommandItem({
  parent,
  sub,
  onSelect,
}: {
  parent: NavItem;
  sub?: NonNullable<NavItem["items"]>[number];
  onSelect: (link: string) => void;
}) {
  const link = sub?.url ?? parent.url;
  const disabled = sub?.disabled ?? false;
  const Icon = parent.icon;
  const label = sub ? sub.title : parent.title;
  const trail = sub ? parent.title : undefined;

  return (
    <CommandItem
      value={[parent.title, sub?.title, link].filter(Boolean).join(" ")}
      disabled={disabled}
      onSelect={() => {
        if (disabled) return;
        onSelect(link);
      }}
    >
      <Icon className="text-muted-foreground size-4" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate">{label}</span>
        {trail && <span className="text-muted-foreground truncate text-[10px]">in {trail}</span>}
      </div>
      {sub?.badge && (
        <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]">{sub.badge}</span>
      )}
    </CommandItem>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="bg-muted text-muted-foreground inline-flex h-4 min-w-4 items-center justify-center rounded border px-1 font-mono text-[10px]">
      {children}
    </kbd>
  );
}
