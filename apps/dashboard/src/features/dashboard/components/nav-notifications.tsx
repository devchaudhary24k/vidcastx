"use client";

import { BellIcon } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@vidcastx/ui/components/avatar";
import { Button } from "@vidcastx/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vidcastx/ui/components/dropdown-menu";
import { cn } from "@vidcastx/ui/lib/utils";

type Notification = {
  id: string;
  avatar: string;
  fallback: string;
  text: string;
  time: string;
};

export function NotificationsPopover({
  notifications,
  className,
}: {
  notifications: Notification[];
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full", className)}
          aria-label="Open notifications"
        >
          <BellIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" className="my-6 w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.map(({ id, avatar, fallback, text, time }) => (
          <DropdownMenuItem key={id} className="flex items-start gap-3">
            <Avatar className="size-8">
              <AvatarImage src={avatar} alt="Avatar" />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{text}</span>
              <span className="text-muted-foreground text-xs">{time}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-muted-foreground hover:text-primary justify-center text-sm">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
