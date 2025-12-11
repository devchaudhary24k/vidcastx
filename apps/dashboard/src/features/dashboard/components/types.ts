import type { Organization } from "@vidcastx/auth/types";
import type { LucideIcon } from "lucide-react";

export type { Organization };

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

export type SidebarData = {
  user: UserData;
  navMain: NavItem[];
  navAdmin: NavItem[];
};

export type SearchItem = {
  id: string;
  title: string;
  link: string;
  icon?: LucideIcon | React.ElementType;
  type: "main-navigation" | "admin-navigation" | "secondary-navigation";
};
