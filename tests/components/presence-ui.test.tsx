// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { PresenceAvatarStack } from "@/components/workspace/presence-avatar-stack";
import { TaskCardViewers } from "@/components/tasks/task-card-viewers";
import { TaskCard } from "@/components/tasks/task-card";
import { broadcastTaskMutation } from "@/lib/realtime/broadcast";
import * as pusherModule from "@/lib/pusher";

// Mock @dnd-kit/sortable
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

describe("Real-Time Presence UI & Components (FEAT-004-FE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PresenceAvatarStack Component", () => {
    it("returns null when no members are online", () => {
      const { container } = render(<PresenceAvatarStack members={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders avatars for active collaborators", () => {
      const members = [
        {
          userId: "u-1",
          name: "Alice Smith",
          email: "alice@example.com",
          image: "https://example.com/alice.png",
          lastSeenAt: Date.now(),
        },
        {
          userId: "u-2",
          name: "Bob Jones",
          email: "bob@example.com",
          image: null,
          lastSeenAt: Date.now(),
        },
      ];

      render(<PresenceAvatarStack members={members} />);

      expect(screen.getByTestId("presence-avatar-stack")).toBeInTheDocument();
      expect(screen.getByTestId("presence-avatar-u-1")).toBeInTheDocument();
      expect(screen.getByTestId("presence-avatar-u-2")).toBeInTheDocument();
      expect(screen.getByText("BJ")).toBeInTheDocument(); // Bob Jones initials
    });

    it("renders overflow pill when active members exceed maxVisible (4)", () => {
      const members = [
        { userId: "u-1", name: "User 1", lastSeenAt: Date.now() },
        { userId: "u-2", name: "User 2", lastSeenAt: Date.now() },
        { userId: "u-3", name: "User 3", lastSeenAt: Date.now() },
        { userId: "u-4", name: "User 4", lastSeenAt: Date.now() },
        { userId: "u-5", name: "User 5", lastSeenAt: Date.now() },
        { userId: "u-6", name: "User 6", lastSeenAt: Date.now() },
      ];

      render(<PresenceAvatarStack members={members} maxVisible={4} />);

      expect(screen.getByTestId("presence-avatar-u-1")).toBeInTheDocument();
      expect(screen.getByTestId("presence-avatar-u-4")).toBeInTheDocument();
      expect(screen.queryByTestId("presence-avatar-u-5")).not.toBeInTheDocument();

      const overflow = screen.getByTestId("presence-overflow-badge");
      expect(overflow).toBeInTheDocument();
      expect(overflow).toHaveTextContent("+2");
    });
  });

  describe("TaskCardViewers Component", () => {
    it("returns null when no viewers are on the card", () => {
      const { container } = render(<TaskCardViewers viewers={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders mini viewer avatars on task cards", () => {
      const viewers = [
        {
          userId: "u-1",
          name: "Alice Smith",
          lastSeenAt: Date.now(),
        },
      ];

      render(<TaskCardViewers viewers={viewers} />);

      expect(screen.getByTestId("task-card-viewers")).toBeInTheDocument();
      expect(screen.getByTestId("card-viewer-u-1")).toBeInTheDocument();
      expect(screen.getByText("AS")).toBeInTheDocument();
    });

    it("displays overflow indicator when viewers exceed maxVisible", () => {
      const viewers = [
        { userId: "u-1", name: "Alice", lastSeenAt: Date.now() },
        { userId: "u-2", name: "Bob", lastSeenAt: Date.now() },
        { userId: "u-3", name: "Charlie", lastSeenAt: Date.now() },
      ];

      render(<TaskCardViewers viewers={viewers} maxVisible={2} />);

      expect(screen.getByTestId("card-viewer-u-1")).toBeInTheDocument();
      expect(screen.getByTestId("card-viewer-u-2")).toBeInTheDocument();
      expect(screen.getByText("+1")).toBeInTheDocument();
    });
  });

  describe("TaskCard Presence Integration", () => {
    it("renders TaskCard with active viewers", () => {
      const mockTask = {
        id: "task-100",
        columnId: "col-1",
        title: "Realtime Collaborative Task",
        priority: "HIGH" as const,
        order: 0,
      };

      const viewers = [
        {
          userId: "viewer-1",
          name: "Collaborator Jane",
          lastSeenAt: Date.now(),
        },
      ];

      render(<TaskCard task={mockTask} viewers={viewers} />);

      expect(screen.getByTestId("task-card-task-100")).toBeInTheDocument();
      expect(screen.getByTestId("task-card-viewers")).toBeInTheDocument();
      expect(screen.getByTestId("card-viewer-viewer-1")).toBeInTheDocument();
    });
  });

  describe("broadcastTaskMutation Dispatcher", () => {
    it("triggers pusher event on the private board channel", async () => {
      const triggerSpy = vi.spyOn(pusherModule, "triggerPusherEvent").mockResolvedValue();

      await broadcastTaskMutation({
        eventType: "TASK_CREATED",
        workspaceId: "ws-1",
        projectId: "proj-1",
        boardId: "board-1",
        taskId: "task-1",
        data: { title: "New Task" },
        actorId: "actor-1",
      });

      expect(triggerSpy).toHaveBeenCalledWith(
        "private-board-board-1",
        "task-created",
        expect.objectContaining({
          eventType: "TASK_CREATED",
          boardId: "board-1",
          taskId: "task-1",
          actorId: "actor-1",
        })
      );
    });

    it("handles pusher failures gracefully without throwing", async () => {
      vi.spyOn(pusherModule, "triggerPusherEvent").mockRejectedValue(
        new Error("Pusher API network timeout")
      );

      await expect(
        broadcastTaskMutation({
          eventType: "TASK_DELETED",
          workspaceId: "ws-1",
          projectId: "proj-1",
          boardId: "board-1",
          taskId: "task-1",
          data: { taskId: "task-1" },
          actorId: "actor-1",
        })
      ).resolves.not.toThrow();
    });
  });
});
