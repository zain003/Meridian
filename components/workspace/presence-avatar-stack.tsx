"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users } from "lucide-react";
import type { RealtimePresenceUser } from "@/hooks/use-presence-channel";

export interface PresenceAvatarStackProps {
  members: RealtimePresenceUser[];
  maxVisible?: number;
}

export function PresenceAvatarStack({
  members,
  maxVisible = 4,
}: PresenceAvatarStackProps) {
  if (members.length === 0) {
    return null;
  }

  const visibleMembers = members.slice(0, maxVisible);
  const overflowCount = members.length - maxVisible;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="flex items-center -space-x-2"
        data-testid="presence-avatar-stack"
      >
        {visibleMembers.map((member) => {
          const initials = member.name
            ? member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : member.email
            ? member.email.slice(0, 2).toUpperCase()
            : "U";

          return (
            <Tooltip key={member.userId}>
              <TooltipTrigger asChild>
                <div
                  className="relative group cursor-pointer"
                  data-testid={`presence-avatar-${member.userId}`}
                >
                  <Avatar className="size-7 border-2 border-[#121215] bg-zinc-800 transition-transform duration-200 group-hover:scale-110 group-hover:z-10 shadow-sm">
                    {member.image && (
                      <AvatarImage src={member.image} alt={member.name} />
                    )}
                    <AvatarFallback className="text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Online Green Pulsing Indicator */}
                  <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-[#121215]" />
                </div>
              </TooltipTrigger>

              <TooltipContent
                side="bottom"
                className="bg-zinc-900 border-zinc-800 text-xs text-foreground px-2.5 py-1.5 shadow-xl"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">
                    {member.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                    Online in workspace
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Overflow Pill */}
        {overflowCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="size-7 rounded-full bg-zinc-800 border-2 border-[#121215] flex items-center justify-center text-[10px] font-semibold text-zinc-300 shadow-sm cursor-pointer hover:scale-110 transition-transform z-10"
                data-testid="presence-overflow-badge"
              >
                +{overflowCount}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-zinc-900 border-zinc-800 text-xs text-zinc-300"
            >
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" />
                <span>{overflowCount} more collaborators online</span>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
