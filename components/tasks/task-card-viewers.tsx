"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye } from "lucide-react";
import type { RealtimePresenceUser } from "@/hooks/use-presence-channel";

export interface TaskCardViewersProps {
  viewers?: RealtimePresenceUser[];
  maxVisible?: number;
}

export function TaskCardViewers({
  viewers = [],
  maxVisible = 2,
}: TaskCardViewersProps) {
  if (viewers.length === 0) {
    return null;
  }

  const visibleViewers = viewers.slice(0, maxVisible);
  const overflow = viewers.length - maxVisible;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className="flex items-center -space-x-1.5"
        data-testid="task-card-viewers"
      >
        {visibleViewers.map((viewer) => {
          const initials = viewer.name
            ? viewer.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : "U";

          return (
            <Tooltip key={viewer.userId}>
              <TooltipTrigger asChild>
                <div
                  className="relative group cursor-pointer"
                  data-testid={`card-viewer-${viewer.userId}`}
                >
                  <Avatar className="size-4.5 border border-primary/60 bg-zinc-800 ring-1 ring-primary/40 shadow-sm transition-transform group-hover:scale-125 group-hover:z-10">
                    {viewer.image && (
                      <AvatarImage src={viewer.image} alt={viewer.name} />
                    )}
                    <AvatarFallback className="text-[8px] font-semibold bg-zinc-800 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>

              <TooltipContent
                side="top"
                className="bg-zinc-900 border-zinc-800 text-[11px] text-foreground px-2 py-1 flex items-center gap-1 shadow-lg"
              >
                <Eye className="size-3 text-primary animate-pulse" />
                <span>{viewer.name} is viewing</span>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {overflow > 0 && (
          <div className="size-4.5 rounded-full bg-zinc-800 border border-primary/40 flex items-center justify-center text-[8px] font-bold text-primary">
            +{overflow}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
