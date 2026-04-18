import type { Organization } from "@vidcastx/auth";
import type { LucideIcon } from "lucide-react";

export type { Organization };

export interface UserData {
  name: string;
  email: string;
  avatar: string;
}

export interface NavItem {
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
}

export interface SidebarData {
  user: UserData;
  navMain: NavItem[];
  navAdmin: NavItem[];
}

export interface SearchItem {
  id: string;
  title: string;
  link: string;
  icon?: LucideIcon | React.ElementType;
  type: "main-navigation" | "admin-navigation" | "secondary-navigation";
}
