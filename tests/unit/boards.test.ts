import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProjectBoardsAction,
  createColumnAction,
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
    },
    board: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    column: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("Board and Column Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProjectBoardsAction", () => {
    it("returns UNAUTHORIZED when session is missing", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
      } as any);

      const res = await getProjectBoardsAction("proj-1");
      expect(res).toEqual({
        success: false,
        error: "UNAUTHORIZED",
      });
    });

    it("returns error when project does not exist", async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

      const res = await getProjectBoardsAction("proj-nonexistent");
      expect(res).toEqual({
        success: false,
        error: "Project not found",
      });
    });

    it("returns FORBIDDEN when user is not member of project workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-outside", email: "outside@example.com" },
      });

      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

      const res = await getProjectBoardsAction("proj-1");
      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });

    it("returns boards with columns sorted by order ASC", async () => {
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

      vi.mocked(prisma.board.findMany).mockResolvedValue([
        {
          id: "board-1",
          name: "Main Board",
          columns: [
            { id: "col-1", name: "Backlog", order: 0 },
            { id: "col-2", name: "Todo", order: 1 },
            { id: "col-3", name: "In Progress", order: 2 },
            { id: "col-4", name: "Review", order: 3 },
            { id: "col-5", name: "Done", order: 4 },
          ],
        },
      ] as any);

      const res = await getProjectBoardsAction("proj-1");

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(1);
        expect(res.data[0].columns).toHaveLength(5);
        expect(res.data[0].columns[0].name).toBe("Backlog");
      }
    });
  });

  describe("createColumnAction", () => {
    it("returns FORBIDDEN for VIEWER role", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-viewer", email: "viewer@example.com" },
      });

      vi.mocked(prisma.board.findUnique).mockResolvedValue({
        id: "board-1",
        project: { workspaceId: "ws-1" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-viewer",
        role: "VIEWER",
      } as any);

      const res = await createColumnAction({
        boardId: "board-1",
        name: "Testing",
      });

      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });

    it("calculates sequential order and creates column", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.board.findUnique).mockResolvedValue({
        id: "board-1",
        project: { workspaceId: "ws-1" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.column.findFirst).mockResolvedValue({
        order: 4,
      } as any);

      vi.mocked(prisma.column.create).mockResolvedValue({
        id: "col-new-1",
        boardId: "board-1",
        name: "QA",
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await createColumnAction({
        boardId: "board-1",
        name: "QA",
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.columnId).toBe("col-new-1");
      }

      expect(prisma.column.create).toHaveBeenCalledWith({
        data: {
          boardId: "board-1",
          name: "QA",
          order: 5,
        },
      });
    });
  });

  describe("reorderColumnsAction", () => {
    it("rejects reordering when column IDs do not match board", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.board.findUnique).mockResolvedValue({
        id: "board-1",
        project: { workspaceId: "ws-1" },
        columns: [{ id: "col-1" }, { id: "col-2" }],
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      const res = await reorderColumnsAction({
        boardId: "board-1",
        columnIds: ["col-1", "col-unknown"],
      });

      expect(res).toEqual({
        success: false,
        error: "Invalid column IDs for board",
      });
    });

    it("updates order index for all columns in atomic transaction", async () => {
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

    it("moves tasks to Backlog column when deleting a column with tasks", async () => {
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

    it("deletes empty column directly without moving tasks", async () => {
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
            { id: "col-review", name: "Review", order: 1 },
          ],
        },
        _count: { tasks: 0 },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.column.delete).mockResolvedValue({} as any);

      const res = await deleteColumnAction("col-review");
      expect(res.success).toBe(true);
      expect(prisma.column.delete).toHaveBeenCalledWith({
        where: { id: "col-review" },
      });
    });
  });
});
