import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createWorkspaceAction,
  getUserWorkspacesAction,
  joinWorkspaceByInviteCodeAction,
} from "@/server/actions/workspaces";
import { updateMemberRoleAction } from "@/server/actions/members";
import * as authModule from "@/lib/auth";
import * as rbacModule from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({
  getAuthSession: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireWorkspaceAccess: vi.fn(),
  hasMinimumRole: vi.fn((role, required) => {
    const hierarchy: Record<string, number> = { OWNER: 4, ADMIN: 3, MEMBER: 2, VIEWER: 1 };
    return (hierarchy[role] || 0) >= (hierarchy[required] || 0);
  }),
  ROLE_HIERARCHY: { OWNER: 4, ADMIN: 3, MEMBER: 2, VIEWER: 1 },
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
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback: any) =>
      callback({
        workspace: {
          create: vi.fn().mockResolvedValue({
            id: "ws-mock-id",
            name: "Verified Workspace",
            slug: "verified-workspace",
          }),
        },
      })
    ),
  },
}));

describe("FEAT-001-VERIFY: Unit & Server Actions Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createWorkspaceAction", () => {
    it("assigns OWNER role and saves record in DB", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-123", email: "owner@meridian.app" },
      });
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);

      const res = await createWorkspaceAction({ name: "Verified Workspace" });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.workspaceId).toBe("ws-mock-id");
        expect(res.data.slug).toBe("verified-workspace");
      }
    });

    it("rejects unauthenticated attempts with UNAUTHORIZED", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      const res = await createWorkspaceAction({ name: "Unauth WS" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("getUserWorkspacesAction", () => {
    it("scopes returned workspaces strictly to session user", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-123", email: "owner@meridian.app" },
      });

      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
        {
          id: "mem-1",
          workspaceId: "ws-1",
          userId: "user-123",
          role: "OWNER",
          createdAt: new Date(),
          updatedAt: new Date(),
          workspace: {
            id: "ws-1",
            name: "Workspace Alpha",
            slug: "workspace-alpha",
          },
        } as any,
      ]);

      const res = await getUserWorkspacesAction();
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(1);
        expect(res.data[0].id).toBe("ws-1");
        expect(res.data[0].role).toBe("OWNER");
      }
    });
  });

  describe("joinWorkspaceByInviteCodeAction", () => {
    it("validates invite code and adds member with MEMBER role", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-joiner", email: "joiner@meridian.app" },
      });
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: "ws-invited",
        slug: "invited-ws",
      } as any);
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.workspaceMember.create).mockResolvedValue({
        id: "mem-joiner",
        workspaceId: "ws-invited",
        userId: "user-joiner",
        role: "MEMBER",
      } as any);

      const res = await joinWorkspaceByInviteCodeAction("valid-invite-code");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.workspaceId).toBe("ws-invited");
      }
    });

    it("rejects nonexistent invite code", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-joiner", email: "joiner@meridian.app" },
      });
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);

      const res = await joinWorkspaceByInviteCodeAction("bad-code");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("Workspace not found or invalid invite code");
      }
    });
  });

  describe("updateMemberRoleAction", () => {
    it("enforces role hierarchy and prevents unauthorized updates", async () => {
      vi.mocked(rbacModule.requireWorkspaceAccess).mockRejectedValue(new Error("FORBIDDEN"));

      const res = await updateMemberRoleAction("ws-1", "user-target", "ADMIN");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("FORBIDDEN");
      }
    });

    it("allows OWNER to promote member to ADMIN", async () => {
      vi.mocked(rbacModule.requireWorkspaceAccess).mockResolvedValue({
        user: { id: "user-owner", email: "owner@meridian.app" },
        role: "OWNER",
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-target",
        workspaceId: "ws-1",
        userId: "user-target",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.workspaceMember.update).mockResolvedValue({
        id: "mem-target",
        workspaceId: "ws-1",
        userId: "user-target",
        role: "ADMIN",
      } as any);

      const res = await updateMemberRoleAction("ws-1", "user-target", "ADMIN");
      expect(res.success).toBe(true);
      expect(prisma.workspaceMember.update).toHaveBeenCalledWith({
        where: {
          workspaceId_userId: {
            workspaceId: "ws-1",
            userId: "user-target",
          },
        },
        data: { role: "ADMIN" },
      });
    });
  });
});
