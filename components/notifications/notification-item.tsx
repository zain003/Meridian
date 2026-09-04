"use client";

import * as React from "react";
import { CheckSquare, MessageSquare, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@prisma/client";

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export function formatRelativeTime(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClick,
}: NotificationItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  const renderEntityIcon = () => {
    switch (notification.entityType) {
      case "TASK":
        return (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-sky-500/20 bg-sky-500/10 text-sky-400">
            <CheckSquare className="size-3.5" data-testid="icon-task" />
          </div>
        );
      case "COMMENT":
        return (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <MessageSquare className="size-3.5" data-testid="icon-comment" />
          </div>
        );
      case "RULE":
        return (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <Zap className="size-3.5" data-testid="icon-rule" />
          </div>
        );
      default:
        return (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-zinc-700/30 bg-zinc-800 text-zinc-400">
            <CheckSquare className="size-3.5" />
          </div>
        );
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid={`notification-item-${notification.id}`}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-lg p-3 text-left transition-all duration-150",
        notification.isRead
          ? "bg-transparent hover:bg-zinc-800/40 text-muted-foreground"
          : "bg-zinc-800/30 hover:bg-zinc-800/60 text-foreground border border-zinc-800/60"
      )}
    >
      {renderEntityIcon()}

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-xs",
              notification.isRead ? "font-normal text-zinc-400" : "font-semibold text-zinc-200"
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-[10px] text-zinc-500 font-mono">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400 leading-relaxed">
          {notification.message}
        </p>
      </div>

      {!notification.isRead && (
        <span
          data-testid="unread-dot"
          className="absolute right-3 top-3.5 size-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)] animate-pulse"
        />
      )}
    </button>
  );
}
