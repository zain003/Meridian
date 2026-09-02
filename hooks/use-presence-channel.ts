"use client";

import * as React from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { PresenceChannel } from "pusher-js";

export interface RealtimePresenceUser {
  userId: string;
  name: string;
  email?: string;
  image?: string | null;
  activeBoardId?: string;
  activeTaskId?: string;
  lastSeenAt: number;
}

export interface UsePresenceChannelReturn {
  activeMembers: RealtimePresenceUser[];
  activeCardViewers: Record<string, RealtimePresenceUser[]>;
  broadcastTaskView: (taskId: string) => void;
  broadcastTaskLeave: (taskId: string) => void;
}

interface PusherMember {
  id: string;
  info: {
    name?: string;
    email?: string;
    image?: string | null;
  };
}

export function usePresenceChannel(
  workspaceId: string,
  currentBoardId?: string,
  currentUserId?: string
): UsePresenceChannelReturn {
  const [activeMembers, setActiveMembers] = React.useState<RealtimePresenceUser[]>([]);
  const [activeCardViewers, setActiveCardViewers] = React.useState<
    Record<string, RealtimePresenceUser[]>
  >({});

  const channelRef = React.useRef<PresenceChannel | null>(null);

  React.useEffect(() => {
    if (!workspaceId) return;

    const pusher = getPusherClient();
    if (!pusher) {
      return;
    }

    const channelName = `presence-workspace-${workspaceId}`;
    const channel = pusher.subscribe(channelName) as PresenceChannel;
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", (members: {
      each: (callback: (member: PusherMember) => void) => void;
      count: number;
    }) => {
      const initialUsers: RealtimePresenceUser[] = [];
      members.each((member: PusherMember) => {
        initialUsers.push({
          userId: member.id,
          name: member.info?.name || member.info?.email || "Collaborator",
          email: member.info?.email,
          image: member.info?.image,
          activeBoardId: currentBoardId,
          lastSeenAt: Date.now(),
        });
      });
      setActiveMembers(initialUsers);
    });

    channel.bind("pusher:member_added", (member: PusherMember) => {
      const newUser: RealtimePresenceUser = {
        userId: member.id,
        name: member.info?.name || member.info?.email || "Collaborator",
        email: member.info?.email,
        image: member.info?.image,
        activeBoardId: currentBoardId,
        lastSeenAt: Date.now(),
      };

      setActiveMembers((prev) => {
        if (prev.some((u) => u.userId === member.id)) return prev;
        return [...prev, newUser];
      });
    });

    channel.bind("pusher:member_removed", (member: PusherMember) => {
      setActiveMembers((prev) => prev.filter((u) => u.userId !== member.id));

      // Remove from any task cards
      setActiveCardViewers((prev) => {
        const next: Record<string, RealtimePresenceUser[]> = {};
        for (const [taskId, viewers] of Object.entries(prev)) {
          next[taskId] = viewers.filter((v) => v.userId !== member.id);
        }
        return next;
      });
    });

    channel.bind(
      "client-view-task",
      (data: { taskId: string; user: RealtimePresenceUser }) => {
        if (data.user?.userId === currentUserId) return;
        setActiveCardViewers((prev) => {
          const currentViewers = prev[data.taskId] || [];
          if (currentViewers.some((v) => v.userId === data.user.userId)) {
            return prev;
          }
          return {
            ...prev,
            [data.taskId]: [...currentViewers, data.user],
          };
        });
      }
    );

    channel.bind(
      "client-leave-task",
      (data: { taskId: string; userId: string }) => {
        setActiveCardViewers((prev) => {
          const currentViewers = prev[data.taskId] || [];
          return {
            ...prev,
            [data.taskId]: currentViewers.filter((v) => v.userId !== data.userId),
          };
        });
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      channelRef.current = null;
      setActiveMembers([]);
      setActiveCardViewers({});
    };
  }, [workspaceId, currentBoardId, currentUserId]);

  const broadcastTaskView = React.useCallback(
    (taskId: string) => {
      if (!channelRef.current || !currentUserId) return;
      const currentUser = activeMembers.find((m) => m.userId === currentUserId);
      if (currentUser) {
        try {
          channelRef.current.trigger("client-view-task", {
            taskId,
            user: currentUser,
          });
        } catch {
          // Client event emission error
        }
      }
    },
    [activeMembers, currentUserId]
  );

  const broadcastTaskLeave = React.useCallback(
    (taskId: string) => {
      if (!channelRef.current || !currentUserId) return;
      try {
        channelRef.current.trigger("client-leave-task", {
          taskId,
          userId: currentUserId,
        });
      } catch {
        // Client event emission error
      }
    },
    [currentUserId]
  );

  return {
    activeMembers,
    activeCardViewers,
    broadcastTaskView,
    broadcastTaskLeave,
  };
}
