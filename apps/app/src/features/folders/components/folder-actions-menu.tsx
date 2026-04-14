import { Archive, Download, Eye, FolderOpen, MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vidcastx/ui/components/dropdown-menu";

type FolderActionsMenuProps = {
  pinned: boolean;
  onOpen: () => void;
};

export function FolderActionsMenu({ pinned, onOpen }: FolderActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label="Folder actions"
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onOpen}>
            <FolderOpen className="h-4 w-4" />
            Open
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Pencil className="h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FolderOpen className="h-4 w-4" />
            Move to…
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Eye className="h-4 w-4" />
            Change visibility
          </DropdownMenuItem>
          <DropdownMenuItem>
            {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            {pinned ? "Unpin" : "Pin to top"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Download className="h-4 w-4" />
            Download all
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Archive className="h-4 w-4" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 className="h-4 w-4" />
          Move to trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
