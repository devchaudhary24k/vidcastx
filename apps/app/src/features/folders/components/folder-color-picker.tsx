import { useState } from "react";
import { Check, Pencil } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@vidcastx/ui/components/popover";
import { cn } from "@vidcastx/ui/lib/utils";

import { FOLDER_COLOR_PRESETS } from "../constants/folder-color-presets";

interface FolderColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function FolderColorPicker({ value, onChange }: FolderColorPickerProps) {
  const [open, setOpen] = useState(false);
  const isPreset = FOLDER_COLOR_PRESETS.includes(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="border-input hover:bg-muted/20 flex items-center gap-3 border p-2 text-left transition-colors"
          />
        }
      >
        <span
          className="inline-block size-6"
          style={{ backgroundColor: value }}
          aria-label={`Current color ${value}`}
        />
        <span className="font-mono text-xs">{value.toUpperCase()}</span>
        <span className="text-muted-foreground ml-auto text-[11px]">Change</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-3 p-3">
        <div className="text-muted-foreground text-[11px] font-medium">Current</div>
        <div className="flex items-center gap-2">
          <Swatch
            color={value}
            selected
            onSelect={() => {
              /* noop: already selected */
            }}
          />
          <label className="border-input hover:bg-muted/20 relative flex size-8 cursor-pointer items-center justify-center border">
            <input
              type="color"
              className="absolute inset-0 size-full cursor-pointer opacity-0"
              value={isPreset ? "#000000" : value}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              aria-label="Custom color"
            />
            <Pencil className="text-muted-foreground size-3.5" />
          </label>
        </div>

        <div className="border-border mt-1 border-t pt-2" />
        <div className="text-muted-foreground text-[11px] font-medium">Presets</div>
        <div className="grid grid-cols-10 gap-1.5" role="radiogroup" aria-label="Folder color presets">
          {FOLDER_COLOR_PRESETS.map((color) => (
            <Swatch
              key={color}
              color={color}
              selected={color.toLowerCase() === value.toLowerCase()}
              onSelect={() => {
                onChange(color);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SwatchProps {
  color: string;
  selected: boolean;
  onSelect: () => void;
}

function Swatch({ color, selected, onSelect }: SwatchProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={color}
      onClick={onSelect}
      style={{ backgroundColor: color }}
      className={cn(
        "flex size-8 items-center justify-center transition-transform outline-none",
        selected ? "ring-foreground ring-offset-background ring-2 ring-offset-2" : "hover:scale-110",
      )}
    >
      {selected && <Check className="size-4 text-white drop-shadow" />}
    </button>
  );
}
