/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUpdateTaskAction = vi.fn();
const mockDeleteTaskAction = vi.fn();
const mockCreateSubtaskAction = vi.fn();
const mockToggleSubtaskAction = vi.fn();
const mockDeleteSubtaskAction = vi.fn();
const mockAddCommentAction = vi.fn();
const mockDeleteCommentAction = vi.fn();
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

vi.mock("@/lib/auth", () => ({
  getAuthSession: vi.fn(),
}));

vi.mock("@/server/actions/boards", () => ({
  createColumnAction: vi.fn().mockResolvedValue({ success: true, data: { columnId: "col-new" } }),
  deleteColumnAction: vi.fn().mockResolvedValue({ success: true }),
  reorderColumnsAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/server/actions/tasks", () => ({
  updateTaskAction: (...args: unknown[]) => mockUpdateTaskAction(...args),
  deleteTaskAction: (...args: unknown[]) => mockDeleteTaskAction(...args),
  createTaskAction: vi.fn().mockResolvedValue({ success: true, data: { taskId: "task-1" } }),
  moveTaskAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/server/actions/subtasks", () => ({
  createSubtaskAction: (...args: unknown[]) => mockCreateSubtaskAction(...args),
  toggleSubtaskAction: (...args: unknown[]) => mockToggleSubtaskAction(...args),
  deleteSubtaskAction: (...args: unknown[]) => mockDeleteSubtaskAction(...args),
}));

vi.mock("@/server/actions/comments", () => ({
  addCommentAction: (...args: unknown[]) => mockAddCommentAction(...args),
  deleteCommentAction: (...args: unknown[]) => mockDeleteCommentAction(...args),
}));

import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { TaskSubtasks } from "@/components/tasks/task-subtasks";
import { TaskComments } from "@/components/tasks/task-comments";
import { ProjectBoardViews } from "@/components/boards/project-board-views";

describe("Task Multi-View Frontend Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleTasks = [
    {
      id: "task-1",
      columnId: "col-todo",
      title: "Alpha Task Design",
      priority: "HIGH" as const,
      order: 0,
      dueDate: "2026-10-15T00:00:00.000Z",
      assignee: {
        id: "user-1",
        name: "Alice Smith",
        email: "alice@example.com",
        image: null,
      },
      subtasks: [
        { id: "sub-1", title: "Subtask 1", isDone: true, order: 0 },
        { id: "sub-2", title: "Subtask 2", isDone: false, order: 1 },
      ],
      comments: [
        {
          id: "com-1",
          content: "Initial draft submitted",
          createdAt: "2026-10-10T12:00:00.000Z",
          user: { id: "user-1", name: "Alice Smith", email: "alice@example.com", image: null },
        },
      ],
      labels: [{ label: { id: "lbl-1", name: "Design", color: "#3B82F6" } }],
    },
    {
      id: "task-2",
      columnId: "col-done",
      title: "Beta Task Backend",
      priority: "URGENT" as const,
      order: 1,
      dueDate: "2026-10-05T00:00:00.000Z",
      completedAt: "2026-10-05T12:00:00.000Z",
      assignee: {
        id: "user-2",
        name: "Bob Jones",
        email: "bob@example.com",
        image: null,
      },
      subtasks: [],
      comments: [],
      labels: [],
    },
    {
      id: "task-3",
      columnId: "col-todo",
      title: "Gamma Task Unscheduled",
      priority: "LOW" as const,
      order: 2,
      dueDate: null,
      assignee: null,
      subtasks: [],
      comments: [],
      labels: [],
    },
  ];

  const sampleColumns = [
    { id: "col-todo", name: "Todo", order: 0 },
    { id: "col-done", name: "Done", order: 1 },
  ];

  describe("TaskListView Component", () => {
    it("renders task rows with correct priority badges, status names, and metadata", () => {
      render(
        <TaskListView
          tasks={sampleTasks}
          columns={sampleColumns}
        />
      );

      expect(screen.getByText("Alpha Task Design")).toBeDefined();
      expect(screen.getByText("Beta Task Backend")).toBeDefined();
      expect(screen.getByText("Gamma Task Unscheduled")).toBeDefined();

      expect(screen.getByText("Urgent")).toBeDefined();
      expect(screen.getByText("High")).toBeDefined();
      expect(screen.getByText("Low")).toBeDefined();

      expect(screen.getAllByText("Todo")).toBeDefined();
      expect(screen.getAllByText("Done")).toBeDefined();
    });

    it("sorts tasks when sort headers are clicked", () => {
      render(
        <TaskListView
          tasks={sampleTasks}
          columns={sampleColumns}
        />
      );

      const titleHeader = screen.getByTestId("sort-header-title");
      fireEvent.click(titleHeader);

      const rows = screen.getAllByTestId(/task-row-/);
      expect(rows[0].textContent).toContain("Alpha Task Design");
      expect(rows[1].textContent).toContain("Beta Task Backend");
      expect(rows[2].textContent).toContain("Gamma Task Unscheduled");
    });

    it("filters tasks by search input query", () => {
      render(
        <TaskListView
          tasks={sampleTasks}
          columns={sampleColumns}
        />
      );

      const searchInput = screen.getByTestId("list-search-input");
      fireEvent.change(searchInput, { target: { value: "Beta" } });

      expect(screen.getByText("Beta Task Backend")).toBeDefined();
      expect(screen.queryByText("Alpha Task Design")).toBeNull();
    });

    it("calls onTaskClick when a row is clicked", () => {
      const onTaskClick = vi.fn();
      render(
        <TaskListView
          tasks={sampleTasks}
          columns={sampleColumns}
          onTaskClick={onTaskClick}
        />
      );

      fireEvent.click(screen.getByTestId("task-row-task-1"));
      expect(onTaskClick).toHaveBeenCalledWith("task-1");
    });
  });

  describe("TaskCalendarView Component", () => {
    it("renders calendar month heading and task pills on matching due dates", () => {
      render(<TaskCalendarView tasks={sampleTasks} />);

      expect(screen.getByTestId("calendar-month-heading")).toBeDefined();
      expect(screen.getByTestId("calendar-task-task-1")).toBeDefined();
      expect(screen.getByTestId("calendar-task-task-2")).toBeDefined();
    });

    it("renders unscheduled tasks in the bottom drawer", () => {
      render(<TaskCalendarView tasks={sampleTasks} />);

      expect(screen.getByTestId("calendar-unscheduled-drawer")).toBeDefined();
      expect(screen.getByTestId("unscheduled-task-task-3")).toBeDefined();
    });

    it("navigates months when chevron buttons are clicked", () => {
      render(<TaskCalendarView tasks={sampleTasks} />);

      const headingBefore = screen.getByTestId("calendar-month-heading").textContent;
      fireEvent.click(screen.getByTestId("calendar-next-month"));
      const headingAfter = screen.getByTestId("calendar-month-heading").textContent;

      expect(headingBefore).not.toEqual(headingAfter);
    });

    it("calls onTaskClick when task pill is clicked in calendar", () => {
      const onTaskClick = vi.fn();
      render(
        <TaskCalendarView
          tasks={sampleTasks}
          onTaskClick={onTaskClick}
        />
      );

      fireEvent.click(screen.getByTestId("calendar-task-task-1"));
      expect(onTaskClick).toHaveBeenCalledWith("task-1");
    });
  });

  describe("TaskDetailModal Component", () => {
    it("renders task metadata in 65/35 split view and updates title on blur", async () => {
      mockUpdateTaskAction.mockResolvedValue({ success: true });
      const onTaskUpdated = vi.fn();

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={vi.fn()}
          task={sampleTasks[0]}
          columns={sampleColumns}
          members={[{ id: "user-1", name: "Alice Smith", email: "alice@example.com" }]}
          onTaskUpdated={onTaskUpdated}
        />
      );

      expect(screen.getByTestId("task-detail-modal")).toBeDefined();
      expect(screen.getByDisplayValue("Alpha Task Design")).toBeDefined();

      const titleInput = screen.getByTestId("task-detail-title-input");
      fireEvent.change(titleInput, { target: { value: "Alpha Task Design Modified" } });
      fireEvent.blur(titleInput);

      await waitFor(() => {
        expect(mockUpdateTaskAction).toHaveBeenCalledWith({
          taskId: "task-1",
          title: "Alpha Task Design Modified",
        });
        expect(onTaskUpdated).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "task-1",
            title: "Alpha Task Design Modified",
          })
        );
      });
    });

    it("switches description between write textarea and live preview tabs", async () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={vi.fn()}
          task={sampleTasks[0]}
          columns={sampleColumns}
        />
      );

      expect(screen.getByTestId("task-description-textarea")).toBeDefined();

      const previewTab = screen.getByRole("tab", { name: /preview/i });
      fireEvent.pointerDown(previewTab);
      fireEvent.click(previewTab);

      await waitFor(() => {
        expect(screen.getByTestId("task-description-preview")).toBeDefined();
      });
    });

    it("deletes task when delete button is clicked", async () => {
      mockDeleteTaskAction.mockResolvedValue({ success: true });
      const onTaskDeleted = vi.fn();
      const onClose = vi.fn();

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={onClose}
          task={sampleTasks[0]}
          columns={sampleColumns}
          onTaskDeleted={onTaskDeleted}
        />
      );

      const deleteBtn = screen.getByTestId("delete-task-button");
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(mockDeleteTaskAction).toHaveBeenCalledWith("task-1");
        expect(onTaskDeleted).toHaveBeenCalledWith("task-1");
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("TaskSubtasks Component", () => {
    it("renders subtasks with progress bar, toggles completion, and adds new subtask", async () => {
      mockToggleSubtaskAction.mockResolvedValue({ success: true });
      mockCreateSubtaskAction.mockResolvedValue({
        success: true,
        data: { subtaskId: "sub-new" },
      });

      render(
        <TaskSubtasks
          taskId="task-1"
          initialSubtasks={[
            { id: "sub-1", title: "Subtask 1", isDone: true },
            { id: "sub-2", title: "Subtask 2", isDone: false },
          ]}
        />
      );

      expect(screen.getByText("50%")).toBeDefined();

      // Toggle checkbox
      const checkbox = screen.getByTestId("subtask-checkbox-sub-2");
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(mockToggleSubtaskAction).toHaveBeenCalledWith("sub-2", true);
      });

      // Add new subtask
      const addBtn = screen.getByTestId("add-subtask-btn");
      fireEvent.click(addBtn);

      const input = screen.getByTestId("add-subtask-input");
      fireEvent.change(input, { target: { value: "Subtask 3 New" } });

      const submitBtn = screen.getByTestId("add-subtask-submit");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateSubtaskAction).toHaveBeenCalledWith({
          taskId: "task-1",
          title: "Subtask 3 New",
        });
        expect(screen.getByText("Subtask 3 New")).toBeDefined();
      });
    });
  });

  describe("TaskComments Component", () => {
    it("renders comments stream and posts new comment on submit", async () => {
      mockAddCommentAction.mockResolvedValue({
        success: true,
        data: { commentId: "com-new-1" },
      });

      render(
        <TaskComments
          taskId="task-1"
          initialComments={[
            {
              id: "com-1",
              content: "Initial draft submitted",
              createdAt: "2026-10-10T12:00:00.000Z",
              user: { id: "user-1", name: "Alice Smith", email: "alice@example.com" },
            },
          ]}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText("Initial draft submitted")).toBeDefined();

      const textarea = screen.getByTestId("comment-textarea");
      fireEvent.change(textarea, { target: { value: "New follow-up comment" } });

      const submitBtn = screen.getByTestId("comment-submit-btn");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockAddCommentAction).toHaveBeenCalledWith(
          "task-1",
          "New follow-up comment"
        );
        expect(screen.getByText("New follow-up comment")).toBeDefined();
      });
    });
  });

  describe("ProjectBoardViews Coordinator", () => {
    it("renders List view and opens detail modal when task is clicked", () => {
      render(
        <ProjectBoardViews
          workspaceId="ws-1"
          projectId="proj-1"
          currentView="list"
          initialColumns={[
            {
              id: "col-todo",
              name: "Todo",
              order: 0,
              tasks: sampleTasks.slice(0, 1),
            },
          ]}
        />
      );

      expect(screen.getByTestId("task-list-view")).toBeDefined();

      fireEvent.click(screen.getByTestId("task-row-task-1"));
      expect(screen.getByTestId("task-detail-modal")).toBeDefined();
    });
  });
});
