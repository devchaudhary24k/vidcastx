"use client";

import * as React from "react";
import { useEffect, useMemo } from "react";
import Link from "next/link";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@vidcastx/ui/components/command";

import type { SearchItem, SidebarData } from "./types";

interface CommandMenuProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data: SidebarData;
}

const flattenSidebarData = (sidebarData: SidebarData): SearchItem[] => {
  const mainItems: SearchItem[] = [];
  const subItems: SearchItem[] = [];

  // Flatten navMain
  sidebarData.navMain.forEach((mainItem) => {
    mainItems.push({
      id: mainItem.title.toLowerCase().replace(/\s/g, "-"),
      title: mainItem.title,
      link: mainItem.url,
      icon: mainItem.icon,
      type: "main-navigation",
    });
    mainItem.items?.forEach((subItem) => {
      subItems.push({
        id: `${mainItem.title.toLowerCase().replace(/\s/g, "-")}-${subItem.title.toLowerCase().replace(/\s/g, "-")}`,
        title: `${mainItem.title} > ${subItem.title}`,
        link: subItem.url,
        type: "main-navigation",
      });
    });
  });

  // Flatten navAdmin
  sidebarData.navAdmin.forEach((adminItem) => {
    mainItems.push({
      id: adminItem.title.toLowerCase().replace(/\s/g, "-"),
      title: adminItem.title,
      link: adminItem.url,
      icon: adminItem.icon,
      type: "admin-navigation",
    });
    adminItem.items?.forEach((subItem) => {
      subItems.push({
        id: `${adminItem.title.toLowerCase().replace(/\s/g, "-")}-${subItem.title.toLowerCase().replace(/\s/g, "-")}`,
        title: `${adminItem.title} > ${subItem.title}`,
        link: subItem.url,
        type: "admin-navigation",
      });
    });
  });

  return [...mainItems, ...subItems];
};

export function CommandMenu({ open, setOpen, data }: CommandMenuProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  const searchItems = useMemo(() => flattenSidebarData(data), [data]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search menu items..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {searchItems.map((item) => (
            <Link href={item.link} key={item.id}>
              <CommandItem
                className="py-2!"
                value={item.title}
                onSelect={() => {
                  setOpen(false);
                }}
              >
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                <span>{item.title}</span>
              </CommandItem>
            </Link>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
