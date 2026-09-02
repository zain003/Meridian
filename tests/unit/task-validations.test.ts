import { describe, it, expect } from "vitest";
import {
  createTaskSchema,
  moveTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  createSubtaskSchema,
  toggleSubtaskSchema,
  deleteSubtaskSchema,
  createCommentSchema,
  deleteCommentSchema,
  createLabelSchema,
} from "@/lib/validations/task";

describe("Task Validation Schemas", () => {
  describe("createTaskSchema", () => {
    it("validates a valid task creation payload with defaults", () => {
      const input = {
        workspaceId: "ws-123",
        projectId: "proj-123",
        columnId: "col-123",
        title: "Build landing page",
      };

      const res = createTaskSchema.safeParse(input);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.priority).toBe("MEDIUM");
        expect(res.data.labelIds).toEqual([]);
        expect(res.data.dueDate).toBeUndefined();
      }
    });

    it("validates full task payload with priority, dueDate, assigneeId, and labels", () => {
      const dateStr = "2026-10-15T00:00:00.000Z";
      const input = {
        workspaceId: "ws-123",
        projectId: "proj-123",
        columnId: "col-123",
        title: "Deploy database migration",
        description: "Run prisma migrate deploy in production",
        priority: "URGENT",
        dueDate: dateStr,
        assigneeId: "user-456",
        labelIds: ["lbl-1", "lbl-2"],
      };

      const res = createTaskSchema.safeParse(input);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.priority).toBe("URGENT");
        expect(res.data.dueDate).toBeInstanceOf(Date);
        expect(res.data.assigneeId).toBe("user-456");
        expect(res.data.labelIds).toEqual(["lbl-1", "lbl-2"]);
      }
    });

    it("rejects empty title or missing required identifiers", () => {
      expect(
        createTaskSchema.safeParse({
          workspaceId: "ws-1",
          projectId: "proj-1",
          columnId: "col-1",
          title: "",
        }).success
      ).toBe(false);

      expect(
        createTaskSchema.safeParse({
          workspaceId: "",
          projectId: "proj-1",
          columnId: "col-1",
          title: "Valid title",
        }).success
      ).toBe(false);

      expect(
        createTaskSchema.safeParse({
          workspaceId: "ws-1",
          projectId: "",
          columnId: "col-1",
          title: "Valid title",
        }).success
      ).toBe(false);

      expect(
        createTaskSchema.safeParse({
          workspaceId: "ws-1",
          projectId: "proj-1",
          columnId: "",
          title: "Valid title",
        }).success
      ).toBe(false);
    });

    it("rejects titles exceeding 200 characters", () => {
      const longTitle = "a".repeat(201);
      const res = createTaskSchema.safeParse({
        workspaceId: "ws-1",
        projectId: "proj-1",
        columnId: "col-1",
        title: longTitle,
      });
      expect(res.success).toBe(false);
    });

    it("rejects invalid priority value", () => {
      const res = createTaskSchema.safeParse({
        workspaceId: "ws-1",
        projectId: "proj-1",
        columnId: "col-1",
        title: "Test Task",
        priority: "SUPER_HIGH",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("moveTaskSchema", () => {
    it("validates valid move task input", () => {
      const input = {
        taskId: "task-1",
        sourceColumnId: "col-1",
        destinationColumnId: "col-2",
        newOrder: 0,
      };

      const res = moveTaskSchema.safeParse(input);
      expect(res.success).toBe(true);
    });

    it("rejects negative order or missing column IDs", () => {
      expect(
        moveTaskSchema.safeParse({
          taskId: "task-1",
          sourceColumnId: "col-1",
          destinationColumnId: "col-2",
          newOrder: -1,
        }).success
      ).toBe(false);

      expect(
        moveTaskSchema.safeParse({
          taskId: "",
          sourceColumnId: "col-1",
          destinationColumnId: "col-2",
          newOrder: 0,
        }).success
      ).toBe(false);

      expect(
        moveTaskSchema.safeParse({
          taskId: "task-1",
          sourceColumnId: "",
          destinationColumnId: "col-2",
          newOrder: 0,
        }).success
      ).toBe(false);
    });
  });

  describe("updateTaskSchema", () => {
    it("validates partial task update input", () => {
      const res = updateTaskSchema.safeParse({
        taskId: "task-1",
        title: "Updated Task Title",
        priority: "HIGH",
      });
      expect(res.success).toBe(true);
    });

    it("validates dueDate and completedAt date coercion", () => {
      const res = updateTaskSchema.safeParse({
        taskId: "task-1",
        dueDate: "2026-11-20T12:00:00.000Z",
        completedAt: "2026-11-21T15:30:00.000Z",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.dueDate).toBeInstanceOf(Date);
        expect(res.data.completedAt).toBeInstanceOf(Date);
      }
    });

    it("rejects empty title if title is provided", () => {
      const res = updateTaskSchema.safeParse({
        taskId: "task-1",
        title: "",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("deleteTaskSchema", () => {
    it("validates task ID for deletion", () => {
      expect(deleteTaskSchema.safeParse({ taskId: "task-1" }).success).toBe(true);
      expect(deleteTaskSchema.safeParse({ taskId: "" }).success).toBe(false);
    });
  });

  describe("subtask schemas", () => {
    it("validates createSubtaskSchema", () => {
      expect(
        createSubtaskSchema.safeParse({ taskId: "task-1", title: "Write unit test" }).success
      ).toBe(true);

      expect(
        createSubtaskSchema.safeParse({ taskId: "task-1", title: "" }).success
      ).toBe(false);
    });

    it("validates toggleSubtaskSchema", () => {
      expect(
        toggleSubtaskSchema.safeParse({ subtaskId: "sub-1", isDone: true }).success
      ).toBe(true);

      expect(
        toggleSubtaskSchema.safeParse({ subtaskId: "", isDone: false }).success
      ).toBe(false);
    });

    it("validates deleteSubtaskSchema", () => {
      expect(
        deleteSubtaskSchema.safeParse({ subtaskId: "sub-1" }).success
      ).toBe(true);

      expect(
        deleteSubtaskSchema.safeParse({ subtaskId: "" }).success
      ).toBe(false);
    });
  });

  describe("comment schemas", () => {
    it("validates createCommentSchema", () => {
      expect(
        createCommentSchema.safeParse({
          taskId: "task-1",
          content: "Looks good to merge!",
        }).success
      ).toBe(true);

      expect(
        createCommentSchema.safeParse({
          taskId: "task-1",
          content: "",
        }).success
      ).toBe(false);
    });

    it("validates deleteCommentSchema", () => {
      expect(
        deleteCommentSchema.safeParse({ commentId: "com-1" }).success
      ).toBe(true);

      expect(
        deleteCommentSchema.safeParse({ commentId: "" }).success
      ).toBe(false);
    });
  });

  describe("label schemas", () => {
    it("validates createLabelSchema", () => {
      expect(
        createLabelSchema.safeParse({
          workspaceId: "ws-1",
          name: "Bug",
          color: "#EF4444",
        }).success
      ).toBe(true);

      expect(
        createLabelSchema.safeParse({
          workspaceId: "ws-1",
          name: "",
          color: "#EF4444",
        }).success
      ).toBe(false);
    });
  });
});
