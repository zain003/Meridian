import { triggerPusherEvent } from "@/lib/pusher";

export interface TaskMutationEvent {
  eventType: "TASK_CREATED" | "TASK_UPDATED" | "TASK_MOVED" | "TASK_DELETED";
  workspaceId: string;
  projectId: string;
  boardId: string;
  taskId: string;
  data: Record<string, unknown>;
  actorId: string;
}

const EVENT_TYPE_MAP: Record<TaskMutationEvent["eventType"], string> = {
  TASK_CREATED: "task-created",
  TASK_UPDATED: "task-updated",
  TASK_MOVED: "task-moved",
  TASK_DELETED: "task-deleted",
};

/**
 * Broadcasts a task mutation event to the board's private channel.
 * Errors during broadcast are caught and logged without affecting database transactions.
 */
export async function broadcastTaskMutation(event: TaskMutationEvent): Promise<void> {
  try {
    const channelName = `private-board-${event.boardId}`;
    const eventName = EVENT_TYPE_MAP[event.eventType] || "task-mutation";

    await triggerPusherEvent(channelName, eventName, {
      ...event,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("[Realtime Broadcast Error]:", err);
  }
}
