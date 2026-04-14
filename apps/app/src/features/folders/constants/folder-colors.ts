import type { FolderColor } from "../types/folder";

type ColorClasses = {
  accent: string;
  tint: string;
  swatch: string;
  label: string;
};

export const FOLDER_COLOR_CLASSES: Record<FolderColor, ColorClasses> = {
  slate: {
    accent: "bg-slate-500",
    tint: "bg-slate-500/5",
    swatch: "bg-slate-500",
    label: "Slate",
  },
  blue: {
    accent: "bg-blue-500",
    tint: "bg-blue-500/5",
    swatch: "bg-blue-500",
    label: "Blue",
  },
  green: {
    accent: "bg-emerald-500",
    tint: "bg-emerald-500/5",
    swatch: "bg-emerald-500",
    label: "Green",
  },
  purple: {
    accent: "bg-violet-500",
    tint: "bg-violet-500/5",
    swatch: "bg-violet-500",
    label: "Purple",
  },
  pink: {
    accent: "bg-pink-500",
    tint: "bg-pink-500/5",
    swatch: "bg-pink-500",
    label: "Pink",
  },
  amber: {
    accent: "bg-amber-500",
    tint: "bg-amber-500/5",
    swatch: "bg-amber-500",
    label: "Amber",
  },
  rose: {
    accent: "bg-rose-500",
    tint: "bg-rose-500/5",
    swatch: "bg-rose-500",
    label: "Rose",
  },
};

export const FOLDER_COLORS: FolderColor[] = ["slate", "blue", "green", "purple", "pink", "amber", "rose"];
