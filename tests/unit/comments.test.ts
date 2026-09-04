import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addCommentAction,
  deleteCommentAction,
} from "@/server/actions/comments";
import * as authModule from "@/lib/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({
  getAuthSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    task: {
      findUnique: vi.fn(),
    },
    comment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: "notif-comment-1" }),
    },
  },
}));

describe("Comment Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addCommentAction", () => {
    it("returns UNAUTHORIZED when session is missing", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        project: { workspaceId: "ws-1" },
      } as any);

      const res = await addCommentAction("task-1", "Great work on this!");

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

      const res = await addCommentAction("task-1", "Great work on this!");

      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });

    it("creates comment linked to user and task", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-author", email: "author@example.com" },
      });

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        project: { workspaceId: "ws-1" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-author",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.comment.create).mockResolvedValue({
        id: "comment-1",
      } as any);

      const res = await addCommentAction("task-1", "Ready for code review");

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.commentId).toBe("comment-1");
      }

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          taskId: "task-1",
          userId: "user-author",
          content: "Ready for code review",
        },
        select: { id: true },
      });
    });
  });

  describe("deleteCommentAction", () => {
    it("allows comment author to delete their own comment", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-author", email: "author@example.com" },
      });

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: "comment-1",
        userId: "user-author",
        task: {
          project: { workspaceId: "ws-1" },
        },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-author",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.comment.delete).mockResolvedValue({} as any);

      const res = await deleteCommentAction("comment-1");

      expect(res.success).toBe(true);
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: "comment-1" },
      });
    });

    it("allows ADMIN to delete another user's comment", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-admin", email: "admin@example.com" },
      });

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: "comment-1",
        userId: "user-author",
        task: {
          project: { workspaceId: "ws-1" },
        },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-admin",
        workspaceId: "ws-1",
        userId: "user-admin",
        role: "ADMIN",
      } as any);

      vi.mocked(prisma.comment.delete).mockResolvedValue({} as any);

      const res = await deleteCommentAction("comment-1");

      expect(res.success).toBe(true);
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: "comment-1" },
      });
    });

    it("rejects non-author MEMBER trying to delete another user's comment", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-other-member", email: "other@example.com" },
      });

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: "comment-1",
        userId: "user-author",
        task: {
          project: { workspaceId: "ws-1" },
        },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-other",
        workspaceId: "ws-1",
        userId: "user-other-member",
        role: "MEMBER",
      } as any);

      const res = await deleteCommentAction("comment-1");

      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });
  });
});
