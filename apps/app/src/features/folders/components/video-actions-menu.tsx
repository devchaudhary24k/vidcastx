import {
  BarChart3,
  Copy,
  Download,
  Eye,
  FolderInput,
  Link as LinkIcon,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vidcastx/ui/components/dropdown-menu";

export function VideoActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label="Video actions"
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Pencil className="h-4 w-4" />
            Edit metadata
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FolderInput className="h-4 w-4" />
            Move to folder
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy className="h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Share2 className="h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LinkIcon className="h-4 w-4" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="h-4 w-4" />
            Download source
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BarChart3 className="h-4 w-4" />
            Analytics
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Eye className="h-4 w-4" />
            View public page
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
