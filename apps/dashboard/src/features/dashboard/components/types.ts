import type { LucideIcon } from "lucide-react";

export type UserData = {
  name: string;
  email: string;
  avatar: string;
};

export type NavItem = {
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
};

export type SecondaryNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export type SidebarData = {
  user: UserData;
  navMain: NavItem[];
  navAdmin: NavItem[];
  navSecondary: SecondaryNavItem[];
};

export type SearchItem = {
  id: string;
  title: string;
  link: string;
  icon?: LucideIcon | React.ElementType;
  type: "main-navigation" | "admin-navigation" | "secondary-navigation";
};
