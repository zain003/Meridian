import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createProjectAction,
  getWorkspaceProjectsAction,
} from "@/server/actions/projects";
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
      create: vi.fn(),
    },
    column: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("Project Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProjectAction", () => {
    it("returns UNAUTHORIZED when user is not authenticated", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      const res = await createProjectAction({
        workspaceId: "ws-1",
        name: "Mobile App",
        key: "MOB",
      });

      expect(res).toEqual({
        success: false,
        error: "UNAUTHORIZED",
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

    it("returns validation error when project name or key is invalid", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com" },
      });

      const res = await createProjectAction({
        workspaceId: "ws-1",
        name: "M",
        key: "A",
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("Invalid input");
        expect(res.fieldErrors).toBeDefined();
      }
    });

    it("fails with KEY_ALREADY_EXISTS on duplicate project key in the same workspace", async () => {
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

    it("creates project, default board, and 5 default columns in atomic transaction", async () => {
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

        expect(tx.project.create).toHaveBeenCalledWith({
          data: {
            workspaceId: "ws-1",
            name: "Mobile App",
            key: "MOB",
            description: "Mobile client application",
          },
        });

        expect(tx.board.create).toHaveBeenCalledWith({
          data: {
            projectId: "proj-created-1",
            name: "Main Board",
            order: 0,
          },
        });

        expect(tx.column.createMany).toHaveBeenCalledWith({
          data: [
            { boardId: "board-created-1", name: "Backlog", order: 0 },
            { boardId: "board-created-1", name: "Todo", order: 1 },
            { boardId: "board-created-1", name: "In Progress", order: 2 },
            { boardId: "board-created-1", name: "Review", order: 3 },
            { boardId: "board-created-1", name: "Done", order: 4 },
          ],
        });

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
  });

  describe("getWorkspaceProjectsAction", () => {
    it("returns UNAUTHORIZED when user is not authenticated", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      const res = await getWorkspaceProjectsAction("ws-1");
      expect(res).toEqual({
        success: false,
        error: "UNAUTHORIZED",
      });
    });

    it("returns FORBIDDEN when user is not a member of the workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-outside", email: "outside@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

      const res = await getWorkspaceProjectsAction("ws-1");
      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });

    it("allows VIEWER role to fetch projects scoped to workspace", async () => {
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
        {
          id: "proj-2",
          name: "Project Two",
          key: "TWO",
          description: null,
        },
      ] as any);

      const res = await getWorkspaceProjectsAction("ws-1");

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(2);
        expect(res.data[0]).toEqual({
          id: "proj-1",
          name: "Project One",
          key: "ONE",
          description: "First project",
        });
      }

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1" },
        select: {
          id: true,
          name: true,
          key: true,
          description: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    });
  });
});
