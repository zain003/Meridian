import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSubtaskAction,
  toggleSubtaskAction,
  deleteSubtaskAction,
} from "@/server/actions/subtasks";
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
    task: {
      findUnique: vi.fn(),
    },
    subtask: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Subtask Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSubtaskAction", () => {
    it("returns UNAUTHORIZED when session is missing", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        project: { workspaceId: "ws-1" },
      } as any);

      const res = await createSubtaskAction({
        taskId: "task-1",
        title: "Subtask 1",
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

      const res = await createSubtaskAction({
        taskId: "task-1",
        title: "Subtask 1",
      });

      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });

    it("calculates sequential order and creates subtask", async () => {
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

      vi.mocked(prisma.subtask.findFirst).mockResolvedValue({
        order: 2,
      } as any);

      vi.mocked(prisma.subtask.create).mockResolvedValue({
        id: "sub-new-1",
      } as any);

      const res = await createSubtaskAction({
        taskId: "task-1",
        title: "Write documentation",
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.subtaskId).toBe("sub-new-1");
      }

      expect(prisma.subtask.create).toHaveBeenCalledWith({
        data: {
          taskId: "task-1",
          title: "Write documentation",
          order: 3,
          isDone: false,
        },
        select: { id: true },
      });
    });
  });

  describe("toggleSubtaskAction", () => {
    it("updates isDone boolean on subtask", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.subtask.findUnique).mockResolvedValue({
        id: "sub-1",
        task: {
          project: { workspaceId: "ws-1" },
        },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.subtask.update).mockResolvedValue({} as any);

      const res = await toggleSubtaskAction("sub-1", true);

      expect(res.success).toBe(true);
      expect(prisma.subtask.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: { isDone: true },
      });
    });

    it("returns error when subtask is not found", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.subtask.findUnique).mockResolvedValue(null);

      const res = await toggleSubtaskAction("sub-nonexistent", true);

      expect(res).toEqual({
        success: false,
        error: "Subtask not found",
      });
    });
  });

  describe("deleteSubtaskAction", () => {
    it("deletes subtask for authorized workspace member", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.subtask.findUnique).mockResolvedValue({
        id: "sub-1",
        task: {
          project: { workspaceId: "ws-1" },
        },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.subtask.delete).mockResolvedValue({} as any);

      const res = await deleteSubtaskAction("sub-1");

      expect(res.success).toBe(true);
      expect(prisma.subtask.delete).toHaveBeenCalledWith({
        where: { id: "sub-1" },
      });
    });
  });
});
