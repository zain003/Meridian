"use client";

import * as React from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { TaskMutationEvent } from "@/lib/realtime/broadcast";

export interface UseBoardRealtimeSyncParams {
  boardId?: string;
  currentUserId?: string;
  onTaskCreated?: (data: TaskMutationEvent["data"]) => void;
  onTaskUpdated?: (data: TaskMutationEvent["data"]) => void;
  onTaskMoved?: (data: { taskId: string; sourceColumnId?: string; destinationColumnId?: string; columnId?: string; newOrder?: number; order?: number }) => void;
  onTaskDeleted?: (data: { taskId: string }) => void;
}

export function useBoardRealtimeSync({
  boardId,
  currentUserId,
  onTaskCreated,
  onTaskUpdated,
  onTaskMoved,
  onTaskDeleted,
}: UseBoardRealtimeSyncParams): { isConnected: boolean } {
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    if (!boardId) return;

    const pusher = getPusherClient();
    if (!pusher) {
      return;
    }

    const channelName = `private-board-${boardId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    channel.bind("pusher:subscription_error", () => {
      setIsConnected(false);
    });

    channel.bind("task-created", (event: TaskMutationEvent) => {
      if (currentUserId && event.actorId === currentUserId) return;
      onTaskCreated?.(event.data);
    });

    channel.bind("task-updated", (event: TaskMutationEvent) => {
      if (currentUserId && event.actorId === currentUserId) return;
      onTaskUpdated?.(event.data);
    });

    channel.bind("task-moved", (event: TaskMutationEvent) => {
      if (currentUserId && event.actorId === currentUserId) return;
      onTaskMoved?.(event.data as unknown as { taskId: string; columnId?: string; destinationColumnId?: string; order?: number; newOrder?: number });
    });

    channel.bind("task-deleted", (event: TaskMutationEvent) => {
      if (currentUserId && event.actorId === currentUserId) return;
      onTaskDeleted?.(event.data as unknown as { taskId: string });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      setIsConnected(false);
    };
  }, [
    boardId,
    currentUserId,
    onTaskCreated,
    onTaskUpdated,
    onTaskMoved,
    onTaskDeleted,
  ]);

  return { isConnected };
}
