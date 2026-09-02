import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createProjectAction,
  getWorkspaceProjectsAction,
} from "@/server/actions/projects";
import {
  reorderColumnsAction,
  deleteColumnAction,
} from "@/server/actions/boards";
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
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    board: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    column: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("FEAT-002-VERIFY: Projects & Boards Backend Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProjectAction", () => {
    it("provisions project, default board, and default columns", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-1",
        role: "MEMBER",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

      const mockProject = { id: "proj-created-1", workspaceId: "ws-1", name: "Mobile App", key: "MOB" };
      const mockBoard = { id: "board-created-1", projectId: "proj-created-1", name: "Main Board", order: 0 };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          project: {
            create: vi.fn().mockResolvedValue(mockProject),
          },
          board: {
            create: vi.fn().mockResolvedValue(mockBoard),
          },
          column: {
            createMany: vi.fn().mockResolvedValue({ count: 5 }),
          },
        };

        const result = await callback(tx);
        return result;
      });

      const res = await createProjectAction({
        workspaceId: "ws-1",
        name: "Mobile App",
        key: "MOB",
        description: "Mobile client application",
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual({
          projectId: "proj-created-1",
          defaultBoardId: "board-created-1",
        });
      }
    });

    it("duplicate project key constraint prevents collisions within the same workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-1",
        role: "MEMBER",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: "proj-existing",
        workspaceId: "ws-1",
        key: "MOB",
        name: "Old Mobile App",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await createProjectAction({
        workspaceId: "ws-1",
        name: "Mobile App",
        key: "MOB",
      });

      expect(res).toEqual({
        success: false,
        error: "KEY_ALREADY_EXISTS",
      });
    });

    it("returns FORBIDDEN when user has VIEWER role in workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-viewer", email: "viewer@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-viewer",
        role: "VIEWER",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await createProjectAction({
        workspaceId: "ws-1",
        name: "Mobile App",
        key: "MOB",
      });

      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });
  });

  describe("getWorkspaceProjectsAction", () => {
    it("returns workspace-scoped projects for authorized viewer", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-viewer", email: "viewer@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-viewer",
        role: "VIEWER",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.project.findMany).mockResolvedValue([
        {
          id: "proj-1",
          name: "Project One",
          key: "ONE",
          description: "First project",
        },
      ] as any);

      const res = await getWorkspaceProjectsAction("ws-1");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(1);
        expect(res.data[0].key).toBe("ONE");
      }
    });
  });

  describe("reorderColumnsAction", () => {
    it("atomically reorders column indices in database", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.board.findUnique).mockResolvedValue({
        id: "board-1",
        project: { workspaceId: "ws-1" },
        columns: [{ id: "col-1" }, { id: "col-2" }, { id: "col-3" }],
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.column.update).mockResolvedValue({} as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}, {}] as any);

      const res = await reorderColumnsAction({
        boardId: "board-1",
        columnIds: ["col-3", "col-1", "col-2"],
      });

      expect(res.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("deleteColumnAction", () => {
    it("validates column deletion rules and moves tasks to Backlog column", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.column.findUnique).mockResolvedValue({
        id: "col-review",
        name: "Review",
        boardId: "board-1",
        board: {
          id: "board-1",
          project: { workspaceId: "ws-1" },
          columns: [
            { id: "col-backlog", name: "Backlog", order: 0 },
            { id: "col-todo", name: "Todo", order: 1 },
            { id: "col-review", name: "Review", order: 2 },
          ],
        },
        _count: { tasks: 3 },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          task: { updateMany: vi.fn().mockResolvedValue({ count: 3 }) },
          column: { delete: vi.fn().mockResolvedValue({}) },
        };
        await callback(tx);

        expect(tx.task.updateMany).toHaveBeenCalledWith({
          where: { columnId: "col-review" },
          data: { columnId: "col-backlog" },
        });
        expect(tx.column.delete).toHaveBeenCalledWith({
          where: { id: "col-review" },
        });
      });

      const res = await deleteColumnAction("col-review");
      expect(res.success).toBe(true);
    });

    it("prevents deleting the only remaining column on a board", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.column.findUnique).mockResolvedValue({
        id: "col-1",
        name: "Backlog",
        boardId: "board-1",
        board: {
          id: "board-1",
          project: { workspaceId: "ws-1" },
          columns: [{ id: "col-1", name: "Backlog", order: 0 }],
        },
        _count: { tasks: 0 },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      const res = await deleteColumnAction("col-1");
      expect(res).toEqual({
        success: false,
        error: "CANNOT_DELETE_LAST_COLUMN",
      });
    });
  });
});
