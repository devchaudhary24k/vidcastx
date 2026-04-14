import { Check } from "lucide-react";

import { cn } from "@vidcastx/ui/lib/utils";

import type { FolderColor } from "../types/folder";
import { FOLDER_COLOR_CLASSES, FOLDER_COLORS } from "../constants/folder-colors";

type FolderColorPickerProps = {
  value: FolderColor;
  onChange: (color: FolderColor) => void;
};

export function FolderColorPicker({ value, onChange }: FolderColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Folder color">
      {FOLDER_COLORS.map((color) => {
        const { swatch, label } = FOLDER_COLOR_CLASSES[color];
        const selected = value === color;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => onChange(color)}
            className={cn(
              "flex size-7 items-center justify-center transition-all outline-none",
              swatch,
              selected ? "ring-foreground ring-offset-background ring-2 ring-offset-2" : "hover:opacity-80",
            )}
          >
            {selected && <Check className="size-4 text-white" />}
          </button>
        );
      })}
    </div>
  );
}
