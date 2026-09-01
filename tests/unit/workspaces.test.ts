import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createWorkspaceAction,
  getUserWorkspacesAction,
  joinWorkspaceByInviteCodeAction,
} from "@/server/actions/workspaces";
import * as authModule from "@/lib/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({
  getAuthSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    workspaceMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((callback: any) =>
      callback({
        workspace: {
          create: vi.fn().mockResolvedValue({
            id: "ws-created-1",
            name: "Acme Corp",
            slug: "acme-corp",
          }),
        },
      })
    ),
  },
}));

describe("Workspace Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createWorkspaceAction", () => {
    it("returns UNAUTHORIZED when user is not authenticated", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      const res = await createWorkspaceAction({ name: "Acme Corp" });
      expect(res).toEqual({
        success: false,
        error: "UNAUTHORIZED",
      });
    });

    it("returns validation error when workspace name is too short", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com" },
      });

      const res = await createWorkspaceAction({ name: "A" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("Invalid input");
      }
    });

    it("creates a workspace, assigns current user as OWNER, and returns success", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com" },
      });
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);

      const res = await createWorkspaceAction({ name: "Acme Corp" });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.workspaceId).toBe("ws-created-1");
        expect(res.data.slug).toBe("acme-corp");
      }
    });
  });

  describe("getUserWorkspacesAction", () => {
    it("returns UNAUTHORIZED when user is not authenticated", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      const res = await getUserWorkspacesAction();
      expect(res).toEqual({
        success: false,
        error: "UNAUTHORIZED",
      });
    });

    it("returns only workspaces where authenticated user has a membership", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
        {
          id: "mem-1",
          workspaceId: "ws-1",
          userId: "user-1",
          role: "OWNER",
          createdAt: new Date(),
          updatedAt: new Date(),
          workspace: {
            id: "ws-1",
            name: "Primary Workspace",
            slug: "primary-workspace",
          },
        } as any,
        {
          id: "mem-2",
          workspaceId: "ws-2",
          userId: "user-1",
          role: "MEMBER",
          createdAt: new Date(),
          updatedAt: new Date(),
          workspace: {
            id: "ws-2",
            name: "Secondary Workspace",
            slug: "secondary-workspace",
          },
        } as any,
      ]);

      const res = await getUserWorkspacesAction();
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(2);
        expect(res.data[0]).toEqual({
          id: "ws-1",
          name: "Primary Workspace",
          slug: "primary-workspace",
          role: "OWNER",
        });
        expect(res.data[1]).toEqual({
          id: "ws-2",
          name: "Secondary Workspace",
          slug: "secondary-workspace",
          role: "MEMBER",
        });
      }
    });
  });

  describe("joinWorkspaceByInviteCodeAction", () => {
    it("fails with invalid/nonexistent invite code", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com" },
      });
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);

      const res = await joinWorkspaceByInviteCodeAction("invalid-code");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("Workspace not found or invalid invite code");
      }
    });

    it("successfully adds user to workspace with MEMBER role", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com" },
      });
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: "ws-target",
        slug: "target-ws",
      } as any);
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.workspaceMember.create).mockResolvedValue({
        id: "mem-new",
        workspaceId: "ws-target",
        userId: "user-1",
        role: "MEMBER",
      } as any);

      const res = await joinWorkspaceByInviteCodeAction("valid-code");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual({
          workspaceId: "ws-target",
          slug: "target-ws",
        });
      }
      expect(prisma.workspaceMember.create).toHaveBeenCalledWith({
        data: {
          workspaceId: "ws-target",
          userId: "user-1",
          role: "MEMBER",
        },
      });
    });

    it("returns existing workspace if user is already a member", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com" },
      });
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: "ws-target",
        slug: "target-ws",
      } as any);
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-existing",
        workspaceId: "ws-target",
        userId: "user-1",
        role: "MEMBER",
      } as any);

      const res = await joinWorkspaceByInviteCodeAction("valid-code");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual({
          workspaceId: "ws-target",
          slug: "target-ws",
        });
      }
      expect(prisma.workspaceMember.create).not.toHaveBeenCalled();
    });
  });
});
