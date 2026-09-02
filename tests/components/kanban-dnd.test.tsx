/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockMoveTaskAction = vi.fn();
const mockCreateTaskAction = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/ws-1/projects/p-1",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/server/actions/tasks", () => ({
  moveTaskAction: (...args: unknown[]) => mockMoveTaskAction(...args),
  createTaskAction: (...args: unknown[]) => mockCreateTaskAction(...args),
}));

vi.mock("@/server/actions/boards", () => ({
  createColumnAction: vi.fn().mockResolvedValue({ success: true, data: { columnId: "col-new" } }),
  deleteColumnAction: vi.fn().mockResolvedValue({ success: true }),
  reorderColumnsAction: vi.fn().mockResolvedValue({ success: true }),
}));

import { TaskCard } from "@/components/tasks/task-card";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { KanbanColumn } from "@/components/boards/kanban-column";
import { KanbanBoard, type ColumnData } from "@/components/boards/kanban-board";

describe("Kanban Drag-and-Drop Frontend Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TaskCard Component", () => {
    const baseTask = {
      id: "task-1",
      columnId: "col-1",
      title: "Implement authentication flows",
      priority: "URGENT" as const,
      order: 0,
      dueDate: "2026-10-15T00:00:00.000Z",
      assignee: {
        id: "u-1",
        name: "Jane Doe",
        email: "jane@example.com",
        image: null,
      },
      subtasks: [
        { id: "sub-1", isDone: true },
        { id: "sub-2", isDone: false },
        { id: "sub-3", isDone: true },
      ],
      labels: [
        { label: { id: "lbl-1", name: "Security", color: "#EF4444" } },
      ],
    };

    it("renders task title, priority badge, and metadata correctly", () => {
      render(<TaskCard task={baseTask} />);

      expect(screen.getByText("Implement authentication flows")).toBeDefined();
      expect(screen.getByText("Urgent")).toBeDefined();
      expect(screen.getByText("Oct 15")).toBeDefined();
      expect(screen.getByText("2/3")).toBeDefined();
      expect(screen.getByText("Security")).toBeDefined();
      expect(screen.getByText("JD")).toBeDefined();
    });

    it("renders priority styling for High, Medium, and Low priorities", () => {
      const { rerender } = render(
        <TaskCard task={{ ...baseTask, priority: "HIGH" }} />
      );
      expect(screen.getByText("High")).toBeDefined();

      rerender(<TaskCard task={{ ...baseTask, priority: "MEDIUM" }} />);
      expect(screen.getByText("Medium")).toBeDefined();

      rerender(<TaskCard task={{ ...baseTask, priority: "LOW" }} />);
      expect(screen.getByText("Low")).toBeDefined();
    });
  });

  describe("QuickAddTask Component", () => {
    it("toggles inline form and creates new task on submit", async () => {
      mockCreateTaskAction.mockResolvedValue({
        success: true,
        data: { taskId: "task-new-1" },
      });

      const onTaskCreated = vi.fn();

      render(
        <QuickAddTask
          workspaceId="ws-1"
          projectId="proj-1"
          columnId="col-todo"
          onTaskCreated={onTaskCreated}
        />
      );

      const addBtn = screen.getByText("Add task");
      fireEvent.click(addBtn);

      const input = screen.getByPlaceholderText("What needs to be done?");
      fireEvent.change(input, { target: { value: "Write E2E tests" } });

      const submitBtn = screen.getByTestId("quick-add-submit");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateTaskAction).toHaveBeenCalledWith({
          workspaceId: "ws-1",
          projectId: "proj-1",
          columnId: "col-todo",
          title: "Write E2E tests",
        });
        expect(onTaskCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "task-new-1",
            title: "Write E2E tests",
            columnId: "col-todo",
          })
        );
      });
    });

    it("displays error when submitting empty input", async () => {
      render(
        <QuickAddTask
          workspaceId="ws-1"
          projectId="proj-1"
          columnId="col-todo"
        />
      );

      fireEvent.click(screen.getByText("Add task"));
      const submitBtn = screen.getByTestId("quick-add-submit");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("Task title cannot be empty")).toBeDefined();
      });
      expect(mockCreateTaskAction).not.toHaveBeenCalled();
    });
  });

  describe("KanbanColumn Component", () => {
    it("renders column header and empty state indicator when no tasks exist", () => {
      const column = { id: "col-empty", name: "Review", order: 3 };
      render(
        <KanbanColumn
          workspaceId="ws-1"
          projectId="proj-1"
          column={column}
          tasks={[]}
          canManage={true}
        />
      );

      expect(screen.getByText("Review")).toBeDefined();
      expect(screen.getByText("No tasks in Review")).toBeDefined();
      expect(screen.getByText("Add task")).toBeDefined();
    });
  });

  describe("KanbanBoard Component", () => {
    const initialColumns: ColumnData[] = [
      {
        id: "col-todo",
        name: "Todo",
        order: 0,
        tasks: [
          {
            id: "task-1",
            columnId: "col-todo",
            title: "Design System Tokens",
            priority: "HIGH",
            order: 0,
            dueDate: null,
            completedAt: null,
            assignee: null,
            subtasks: [],
            labels: [],
          },
          {
            id: "task-2",
            columnId: "col-todo",
            title: "Database Indexing",
            priority: "MEDIUM",
            order: 1,
            dueDate: null,
            completedAt: null,
            assignee: null,
            subtasks: [],
            labels: [],
          },
        ],
      },
      {
        id: "col-done",
        name: "Done",
        order: 1,
        tasks: [],
      },
    ];

    it("renders all columns and task cards passed via initial props", () => {
      render(
        <KanbanBoard
          workspaceId="ws-1"
          projectId="proj-1"
          boardId="board-1"
          initialColumns={initialColumns}
          canManage={true}
        />
      );

      expect(screen.getByText("Todo")).toBeDefined();
      expect(screen.getByText("Done")).toBeDefined();
      expect(screen.getByText("Design System Tokens")).toBeDefined();
      expect(screen.getByText("Database Indexing")).toBeDefined();
      expect(screen.getByText("No tasks in Done")).toBeDefined();
    });

    it("appends task optimistically when created via QuickAddTask", async () => {
      mockCreateTaskAction.mockResolvedValue({
        success: true,
        data: { taskId: "task-new-optimistic" },
      });

      render(
        <KanbanBoard
          workspaceId="ws-1"
          projectId="proj-1"
          boardId="board-1"
          initialColumns={initialColumns}
          canManage={true}
        />
      );

      const quickAddBtn = screen.getByTestId("quick-add-btn-col-done");
      fireEvent.click(quickAddBtn);

      const input = screen.getByPlaceholderText("What needs to be done?");
      fireEvent.change(input, { target: { value: "Verify test reports" } });

      const submitBtn = screen.getByTestId("quick-add-submit");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("Verify test reports")).toBeDefined();
      });
    });

    it("calls onTaskClick when task card is clicked", () => {
      const onTaskClick = vi.fn();
      render(
        <KanbanBoard
          workspaceId="ws-1"
          projectId="proj-1"
          boardId="board-1"
          initialColumns={initialColumns}
          canManage={true}
          onTaskClick={onTaskClick}
        />
      );

      const taskCard = screen.getByTestId("task-card-task-1");
      fireEvent.click(taskCard);

      expect(onTaskClick).toHaveBeenCalledWith("task-1");
    });
  });
});
