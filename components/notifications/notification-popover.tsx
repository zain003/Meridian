"use client";

import * as React from "react";
import { CheckCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "@/components/notifications/notification-item";
import type { Notification } from "@prisma/client";

export interface NotificationPopoverProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  isMarkingAll?: boolean;
}

export function NotificationPopover({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  isMarkingAll = false,
}: NotificationPopoverProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col w-[360px] sm:w-[400px]">
      {/* Popover Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 bg-zinc-900/50 backdrop-blur-sm rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100">Notifications</span>
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono px-1.5 py-0 h-4"
            >
              {unreadCount} unread
            </Badge>
          )}
        </div>

        {unreadCount > 0 && onMarkAllAsRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            disabled={isMarkingAll}
            data-testid="mark-all-read-btn"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800 gap-1.5 font-medium"
          >
            <CheckCheck className="size-3.5 text-zinc-400" />
            <span>Mark all read</span>
          </Button>
        )}
      </div>

      {/* Notification Items List */}
      <div className="p-1">
        {notifications.length === 0 ? (
          <div
            data-testid="notifications-empty-state"
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800/60 border border-zinc-700/40 text-emerald-400 mb-3">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="text-xs font-medium text-zinc-200">All caught up!</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px]">
              You don&apos;t have any notifications right now.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[340px] max-h-[380px] pr-2">
            <div className="flex flex-col gap-1 p-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onClick={onNotificationClick}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
