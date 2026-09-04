"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/server/actions/notifications";
import type { Notification } from "@prisma/client";

export interface NotificationBellProps {
  workspaceId: string;
  initialNotifications?: Notification[];
}

export function NotificationBell({
  workspaceId,
  initialNotifications = [],
}: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] =
    React.useState<Notification[]>(initialNotifications);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    if (initialNotifications.length === 0) {
      getUserNotificationsAction(workspaceId)
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setNotifications(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch notifications:", err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [workspaceId, initialNotifications.length]);

  // Handle open state change
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic local state update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );

    try {
      await markNotificationAsReadAction(notificationId);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;

    setIsMarkingAll(true);
    // Optimistic local state update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await markAllNotificationsAsReadAction(workspaceId);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);

    if (notification.entityType === "TASK" || notification.entityType === "COMMENT") {
      // Navigate to workspace view
      router.push(`/${workspaceId}`);
    } else if (notification.entityType === "RULE") {
      router.push(`/${workspaceId}/automation`);
    }
  };

  const formatBadgeCount = (count: number) => {
    if (count > 99) return "99+";
    return count.toString();
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="notification-bell-btn"
          className="relative size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-800"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              data-testid="notification-unread-badge"
              className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white shadow-sm border border-zinc-900 leading-none"
            >
              {formatBadgeCount(unreadCount)}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="p-0 border border-zinc-800 bg-[#111318] shadow-2xl rounded-lg overflow-hidden w-auto"
      >
        <NotificationPopover
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onNotificationClick={handleNotificationClick}
          isMarkingAll={isMarkingAll}
        />
      </PopoverContent>
    </Popover>
  );
}
