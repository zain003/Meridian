import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getWorkspaceMembersAction,
  updateMemberRoleAction,
} from "@/server/actions/members";
import * as rbacModule from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/rbac", () => ({
  requireWorkspaceAccess: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("Member Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWorkspaceMembersAction", () => {
    it("returns error if user is unauthorized/forbidden", async () => {
      vi.mocked(rbacModule.requireWorkspaceAccess).mockRejectedValue(new Error("FORBIDDEN"));

      const res = await getWorkspaceMembersAction("ws-1");
      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });

    it("returns formatted members on success", async () => {
      vi.mocked(rbacModule.requireWorkspaceAccess).mockResolvedValue({
        user: { id: "user-1", email: "user1@example.com" },
        role: "MEMBER",
      });

      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
        {
          id: "mem-1",
          userId: "user-1",
          role: "OWNER",
          user: { name: "Alice", email: "alice@example.com" },
        } as any,
        {
          id: "mem-2",
          userId: "user-2",
          role: "MEMBER",
          user: { name: "Bob", email: "bob@example.com" },
        } as any,
      ]);

      const res = await getWorkspaceMembersAction("ws-1");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(2);
        expect(res.data[0]).toEqual({
          id: "mem-1",
          userId: "user-1",
          name: "Alice",
          email: "alice@example.com",
          role: "OWNER",
        });
      }
    });
  });

  describe("updateMemberRoleAction", () => {
    it("forbids non-admin/member from changing roles", async () => {
      vi.mocked(rbacModule.requireWorkspaceAccess).mockRejectedValue(new Error("FORBIDDEN"));

      const res = await updateMemberRoleAction("ws-1", "user-2", "ADMIN");
      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });

    it("allows OWNER to change MEMBER to ADMIN", async () => {
      vi.mocked(rbacModule.requireWorkspaceAccess).mockResolvedValue({
        user: { id: "user-owner", email: "owner@example.com" },
        role: "OWNER",
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-2",
        workspaceId: "ws-1",
        userId: "user-2",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.workspaceMember.update).mockResolvedValue({
        id: "mem-2",
        workspaceId: "ws-1",
        userId: "user-2",
        role: "ADMIN",
      } as any);

      const res = await updateMemberRoleAction("ws-1", "user-2", "ADMIN");
      expect(res.success).toBe(true);
      expect(prisma.workspaceMember.update).toHaveBeenCalledWith({
        where: {
          workspaceId_userId: {
            workspaceId: "ws-1",
            userId: "user-2",
          },
        },
        data: { role: "ADMIN" },
      });
    });

    it("prevents demoting the sole owner of a workspace", async () => {
      vi.mocked(rbacModule.requireWorkspaceAccess).mockResolvedValue({
        user: { id: "user-owner", email: "owner@example.com" },
        role: "OWNER",
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-owner",
        workspaceId: "ws-1",
        userId: "user-owner",
        role: "OWNER",
      } as any);

      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(1);

      const res = await updateMemberRoleAction("ws-1", "user-owner", "ADMIN");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("Cannot demote the sole owner of a workspace");
      }
      expect(prisma.workspaceMember.update).not.toHaveBeenCalled();
    });
  });
});
