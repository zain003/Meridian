// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBoardRealtimeSync } from "@/hooks/use-board-realtime";
import { broadcastTaskMutation, type TaskMutationEvent } from "@/lib/realtime/broadcast";
import * as pusherClientModule from "@/lib/pusher-client";
import * as pusherServerModule from "@/lib/pusher";

describe("Real-Time Board Sync Integration (FEAT-004-INT)", () => {
  let mockChannel: {
    bind: ReturnType<typeof vi.fn>;
    unbind_all: ReturnType<typeof vi.fn>;
  };
  let mockPusherClient: {
    subscribe: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
  };
  let boundHandlers: Record<string, (data: unknown) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    boundHandlers = {};

    mockChannel = {
      bind: vi.fn((eventName: string, handler: (data: unknown) => void) => {
        boundHandlers[eventName] = handler;
      }),
      unbind_all: vi.fn(),
    };

    mockPusherClient = {
      subscribe: vi.fn(() => mockChannel),
      unsubscribe: vi.fn(),
    };

    vi.spyOn(pusherClientModule, "getPusherClient").mockReturnValue(
      mockPusherClient as unknown as ReturnType<typeof pusherClientModule.getPusherClient>
    );
  });

  describe("useBoardRealtimeSync Hook", () => {
    it("subscribes to private board channel on mount and unsubscribes on unmount", () => {
      const { unmount } = renderHook(() =>
        useBoardRealtimeSync({
          boardId: "board-123",
          currentUserId: "user-1",
        })
      );

      expect(mockPusherClient.subscribe).toHaveBeenCalledWith("private-board-board-123");
      expect(mockChannel.bind).toHaveBeenCalledWith(
        "pusher:subscription_succeeded",
        expect.any(Function)
      );

      unmount();

      expect(mockChannel.unbind_all).toHaveBeenCalled();
      expect(mockPusherClient.unsubscribe).toHaveBeenCalledWith("private-board-board-123");
    });

    it("triggers onTaskCreated callback for external events", () => {
      const onTaskCreated = vi.fn();

      renderHook(() =>
        useBoardRealtimeSync({
          boardId: "board-123",
          currentUserId: "user-1",
          onTaskCreated,
        })
      );

      const incomingEvent: TaskMutationEvent = {
        eventType: "TASK_CREATED",
        workspaceId: "ws-1",
        projectId: "p-1",
        boardId: "board-123",
        taskId: "t-1",
        data: { id: "t-1", title: "New Task", columnId: "col-1" },
        actorId: "user-2", // Different actor
      };

      boundHandlers["task-created"]?.(incomingEvent);

      expect(onTaskCreated).toHaveBeenCalledWith(incomingEvent.data);
    });

    it("ignores task-created events originated by current user (deduplication)", () => {
      const onTaskCreated = vi.fn();

      renderHook(() =>
        useBoardRealtimeSync({
          boardId: "board-123",
          currentUserId: "user-1",
          onTaskCreated,
        })
      );

      const selfEvent: TaskMutationEvent = {
        eventType: "TASK_CREATED",
        workspaceId: "ws-1",
        projectId: "p-1",
        boardId: "board-123",
        taskId: "t-1",
        data: { id: "t-1", title: "My Created Task" },
        actorId: "user-1", // Same actor
      };

      boundHandlers["task-created"]?.(selfEvent);

      expect(onTaskCreated).not.toHaveBeenCalled();
    });

    it("triggers onTaskMoved callback for external events", () => {
      const onTaskMoved = vi.fn();

      renderHook(() =>
        useBoardRealtimeSync({
          boardId: "board-123",
          currentUserId: "user-1",
          onTaskMoved,
        })
      );

      const moveEvent: TaskMutationEvent = {
        eventType: "TASK_MOVED",
        workspaceId: "ws-1",
        projectId: "p-1",
        boardId: "board-123",
        taskId: "t-1",
        data: { taskId: "t-1", destinationColumnId: "col-2", newOrder: 1 },
        actorId: "user-2",
      };

      boundHandlers["task-moved"]?.(moveEvent);

      expect(onTaskMoved).toHaveBeenCalledWith(moveEvent.data);
    });

    it("triggers onTaskUpdated and onTaskDeleted callbacks", () => {
      const onTaskUpdated = vi.fn();
      const onTaskDeleted = vi.fn();

      renderHook(() =>
        useBoardRealtimeSync({
          boardId: "board-123",
          currentUserId: "user-1",
          onTaskUpdated,
          onTaskDeleted,
        })
      );

      boundHandlers["task-updated"]?.({
        eventType: "TASK_UPDATED",
        actorId: "user-2",
        data: { taskId: "t-1", title: "Updated Title" },
      });
      expect(onTaskUpdated).toHaveBeenCalledWith({ taskId: "t-1", title: "Updated Title" });

      boundHandlers["task-deleted"]?.({
        eventType: "TASK_DELETED",
        actorId: "user-2",
        data: { taskId: "t-1" },
      });
      expect(onTaskDeleted).toHaveBeenCalledWith({ taskId: "t-1" });
    });
  });

  describe("broadcastTaskMutation Server Dispatcher", () => {
    it("dispatches mutation event to board private channel", async () => {
      const triggerSpy = vi.spyOn(pusherServerModule, "triggerPusherEvent").mockResolvedValue();

      await broadcastTaskMutation({
        eventType: "TASK_MOVED",
        workspaceId: "ws-1",
        projectId: "p-1",
        boardId: "b-1",
        taskId: "t-1",
        data: { destinationColumnId: "col-done", newOrder: 0 },
        actorId: "actor-1",
      });

      expect(triggerSpy).toHaveBeenCalledWith(
        "private-board-b-1",
        "task-moved",
        expect.objectContaining({
          eventType: "TASK_MOVED",
          actorId: "actor-1",
        })
      );
    });
  });
});
