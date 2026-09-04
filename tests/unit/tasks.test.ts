import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTaskAction,
  moveTaskAction,
  updateTaskAction,
  deleteTaskAction,
  getTaskDetailsAction,
  getProjectTasksAction,
} from "@/server/actions/tasks";
import * as authModule from "@/lib/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({
  getAuthSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: {
      findUnique: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    column: {
      findFirst: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: "notif-task-1" }),
    },
    $transaction: vi.fn(),
  },
}));

describe("Task Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTaskAction", () => {
    it("returns UNAUTHORIZED when session is missing", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      const res = await createTaskAction({
        workspaceId: "ws-1",
        projectId: "proj-1",
        columnId: "col-1",
        title: "Test Task",
      });

      expect(res).toEqual({
        success: false,
        error: "UNAUTHORIZED",
      });
    });

    it("returns FORBIDDEN for VIEWER role", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-viewer", email: "viewer@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-viewer",
        role: "VIEWER",
      } as any);

      const res = await createTaskAction({
        workspaceId: "ws-1",
        projectId: "proj-1",
        columnId: "col-1",
        title: "Test Task",
      });

      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });

    it("returns error when project does not belong to workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      const res = await createTaskAction({
        workspaceId: "ws-1",
        projectId: "proj-nonexistent",
        columnId: "col-1",
        title: "Test Task",
      });

      expect(res).toEqual({
        success: false,
        error: "Project not found",
      });
    });

    it("returns error when assignee is not a member of the workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique)
        .mockResolvedValueOnce({
          id: "mem-1",
          workspaceId: "ws-1",
          userId: "user-member",
          role: "MEMBER",
        } as any)
        .mockResolvedValueOnce(null);

      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "proj-1" } as any);
      vi.mocked(prisma.column.findFirst).mockResolvedValue({
        id: "col-1",
        name: "Todo",
      } as any);

      const res = await createTaskAction({
        workspaceId: "ws-1",
        projectId: "proj-1",
        columnId: "col-1",
        title: "Test Task",
        assigneeId: "user-stranger",
      });

      expect(res).toEqual({
        success: false,
        error: "Assignee is not a member of this workspace",
      });
    });

    it("calculates MAX(order) + 1 and creates task successfully", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique)
        .mockResolvedValueOnce({
          id: "mem-1",
          workspaceId: "ws-1",
          userId: "user-member",
          role: "MEMBER",
        } as any)
        .mockResolvedValueOnce({
          id: "mem-2",
          workspaceId: "ws-1",
          userId: "user-assignee",
          role: "MEMBER",
        } as any);

      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "proj-1" } as any);
      vi.mocked(prisma.column.findFirst).mockResolvedValue({
        id: "col-1",
        name: "Todo",
      } as any);

      vi.mocked(prisma.task.findFirst).mockResolvedValue({
        order: 3,
      } as any);

      vi.mocked(prisma.task.create).mockResolvedValue({
        id: "task-created-1",
      } as any);

      const res = await createTaskAction({
        workspaceId: "ws-1",
        projectId: "proj-1",
        columnId: "col-1",
        title: "New feature task",
        priority: "HIGH",
        assigneeId: "user-assignee",
        labelIds: ["lbl-1", "lbl-2"],
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.taskId).toBe("task-created-1");
      }

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          workspaceId: "ws-1",
          projectId: "proj-1",
          columnId: "col-1",
          title: "New feature task",
          description: null,
          priority: "HIGH",
          order: 4,
          dueDate: null,
          assigneeId: "user-assignee",
          completedAt: null,
          labels: {
            create: [{ labelId: "lbl-1" }, { labelId: "lbl-2" }],
          },
        },
        select: { id: true },
      });
    });

    it("sets order to 0 when column is empty and marks completedAt if Done column", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: "proj-1" } as any);
      vi.mocked(prisma.column.findFirst).mockResolvedValue({
        id: "col-done",
        name: "Done",
      } as any);

      vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

      vi.mocked(prisma.task.create).mockResolvedValue({
        id: "task-done-1",
      } as any);

      const res = await createTaskAction({
        workspaceId: "ws-1",
        projectId: "proj-1",
        columnId: "col-done",
        title: "Done Task",
      });

      expect(res.success).toBe(true);
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 0,
            completedAt: expect.any(Date),
          }),
        })
      );
    });
  });

  describe("moveTaskAction", () => {
    it("shifts order within same column in atomic transaction", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        order: 1,
        columnId: "col-todo",
        projectId: "proj-1",
        completedAt: null,
        project: { workspaceId: "ws-1" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.column.findFirst).mockResolvedValue({
        id: "col-todo",
        name: "Todo",
      } as any);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          task: {
            updateMany: vi.fn().mockResolvedValue({ count: 2 }),
            update: vi.fn().mockResolvedValue({}),
          },
        };
        await callback(tx);

        expect(tx.task.updateMany).toHaveBeenCalledWith({
          where: {
            columnId: "col-todo",
            order: { gt: 1, lte: 3 },
            id: { not: "task-1" },
          },
          data: {
            order: { decrement: 1 },
          },
        });

        expect(tx.task.update).toHaveBeenCalledWith({
          where: { id: "task-1" },
          data: { order: 3 },
        });
      });

      const res = await moveTaskAction({
        taskId: "task-1",
        sourceColumnId: "col-todo",
        destinationColumnId: "col-todo",
        newOrder: 3,
      });

      expect(res.success).toBe(true);
    });

    it("shifts orders across columns and updates completedAt when moving to Done", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        order: 2,
        columnId: "col-in-progress",
        projectId: "proj-1",
        completedAt: null,
        project: { workspaceId: "ws-1" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.column.findFirst).mockResolvedValue({
        id: "col-done",
        name: "Done",
      } as any);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          task: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            update: vi.fn().mockResolvedValue({}),
          },
        };
        await callback(tx);

        expect(tx.task.updateMany).toHaveBeenCalledWith({
          where: {
            columnId: "col-in-progress",
            order: { gt: 2 },
            id: { not: "task-1" },
          },
          data: {
            order: { decrement: 1 },
          },
        });

        expect(tx.task.updateMany).toHaveBeenCalledWith({
          where: {
            columnId: "col-done",
            order: { gte: 0 },
          },
          data: {
            order: { increment: 1 },
          },
        });

        expect(tx.task.update).toHaveBeenCalledWith({
          where: { id: "task-1" },
          data: {
            columnId: "col-done",
            order: 0,
            completedAt: expect.any(Date),
          },
        });
      });

      const res = await moveTaskAction({
        taskId: "task-1",
        sourceColumnId: "col-in-progress",
        destinationColumnId: "col-done",
        newOrder: 0,
      });

      expect(res.success).toBe(true);
    });
  });

  describe("updateTaskAction", () => {
    it("updates task priority, assignee, and description", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        columnId: "col-todo",
        projectId: "proj-1",
        completedAt: null,
        project: { workspaceId: "ws-1" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique)
        .mockResolvedValueOnce({
          id: "mem-1",
          workspaceId: "ws-1",
          userId: "user-member",
          role: "MEMBER",
        } as any)
        .mockResolvedValueOnce({
          id: "mem-2",
          workspaceId: "ws-1",
          userId: "user-2",
          role: "MEMBER",
        } as any);

      vi.mocked(prisma.task.update).mockResolvedValue({} as any);

      const res = await updateTaskAction({
        taskId: "task-1",
        title: "Updated Task Title",
        priority: "URGENT",
        assigneeId: "user-2",
        description: "New description text",
      });

      expect(res.success).toBe(true);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: {
          title: "Updated Task Title",
          priority: "URGENT",
          assigneeId: "user-2",
          description: "New description text",
        },
      });
    });

    it("rejects assignment if user is not in workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        columnId: "col-todo",
        projectId: "proj-1",
        completedAt: null,
        project: { workspaceId: "ws-1" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique)
        .mockResolvedValueOnce({
          id: "mem-1",
          workspaceId: "ws-1",
          userId: "user-member",
          role: "MEMBER",
        } as any)
        .mockResolvedValueOnce(null);

      const res = await updateTaskAction({
        taskId: "task-1",
        assigneeId: "user-external",
      });

      expect(res).toEqual({
        success: false,
        error: "Assignee is not a member of this workspace",
      });
    });
  });

  describe("deleteTaskAction", () => {
    it("deletes task for workspace MEMBER", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        project: { workspaceId: "ws-1" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.task.delete).mockResolvedValue({} as any);

      const res = await deleteTaskAction("task-1");
      expect(res.success).toBe(true);
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: "task-1" },
      });
    });

    it("rejects deletion for VIEWER role", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-viewer", email: "viewer@example.com" },
      });

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        project: { workspaceId: "ws-1" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-viewer",
        role: "VIEWER",
      } as any);

      const res = await deleteTaskAction("task-1");
      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });
  });

  describe("getTaskDetailsAction", () => {
    it("returns task with relations for VIEWER role", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-viewer", email: "viewer@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-viewer",
        role: "VIEWER",
      } as any);

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        title: "Detailed Task",
        project: { workspaceId: "ws-1" },
        column: { id: "col-1", name: "In Progress" },
        assignee: { id: "u-1", name: "Alice", email: "alice@example.com", image: null },
        subtasks: [{ id: "sub-1", title: "Sub 1", isDone: true, order: 0 }],
        comments: [
          {
            id: "c-1",
            content: "Comment 1",
            createdAt: new Date(),
            user: { id: "u-1", name: "Alice", email: "alice@example.com", image: null },
          },
        ],
        labels: [{ label: { id: "l-1", name: "Bug", color: "#EF4444" } }],
      } as any);

      const res = await getTaskDetailsAction("task-1");

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.title).toBe("Detailed Task");
        expect(res.data.subtasks).toHaveLength(1);
        expect(res.data.comments).toHaveLength(1);
        expect(res.data.labels).toHaveLength(1);
      }
    });
  });

  describe("getProjectTasksAction", () => {
    it("returns all project tasks ordered by order ascending", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-viewer", email: "viewer@example.com" },
      });

      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-viewer",
        role: "VIEWER",
      } as any);

      vi.mocked(prisma.task.findMany).mockResolvedValue([
        {
          id: "t-1",
          columnId: "col-1",
          title: "Task 1",
          order: 0,
          _count: { subtasks: 2, comments: 1 },
          labels: [],
        },
        {
          id: "t-2",
          columnId: "col-1",
          title: "Task 2",
          order: 1,
          _count: { subtasks: 0, comments: 0 },
          labels: [],
        },
      ] as any);

      const res = await getProjectTasksAction("proj-1");

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(2);
        expect(res.data[0].id).toBe("t-1");
      }
    });
  });
});
