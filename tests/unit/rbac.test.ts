import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasMinimumRole, requireWorkspaceAccess, ROLE_HIERARCHY } from "@/lib/rbac";
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
  },
}));

describe("RBAC Helper Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ROLE_HIERARCHY and hasMinimumRole", () => {
    it("should correctly evaluate role hierarchy", () => {
      expect(ROLE_HIERARCHY.OWNER).toBeGreaterThan(ROLE_HIERARCHY.ADMIN);
      expect(ROLE_HIERARCHY.ADMIN).toBeGreaterThan(ROLE_HIERARCHY.MEMBER);
      expect(ROLE_HIERARCHY.MEMBER).toBeGreaterThan(ROLE_HIERARCHY.VIEWER);

      expect(hasMinimumRole("OWNER", "ADMIN")).toBe(true);
      expect(hasMinimumRole("ADMIN", "MEMBER")).toBe(true);
      expect(hasMinimumRole("MEMBER", "VIEWER")).toBe(true);
      expect(hasMinimumRole("MEMBER", "MEMBER")).toBe(true);

      expect(hasMinimumRole("VIEWER", "MEMBER")).toBe(false);
      expect(hasMinimumRole("MEMBER", "ADMIN")).toBe(false);
      expect(hasMinimumRole("ADMIN", "OWNER")).toBe(false);
    });
  });

  describe("requireWorkspaceAccess", () => {
    it("throws UNAUTHORIZED when no authenticated session exists", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      await expect(requireWorkspaceAccess("ws-1", "MEMBER")).rejects.toThrow("UNAUTHORIZED");
    });

    it("throws FORBIDDEN when user is not a member of the workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com" },
      });
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

      await expect(requireWorkspaceAccess("ws-1", "MEMBER")).rejects.toThrow("FORBIDDEN");
    });

    it("throws FORBIDDEN when user has insufficient role", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com" },
      });
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-1",
        role: "VIEWER",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(requireWorkspaceAccess("ws-1", "ADMIN")).rejects.toThrow("FORBIDDEN");
    });

    it("returns user and role when user meets required role", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user@example.com", name: "User 1", image: null },
      });
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-1",
        role: "ADMIN",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await requireWorkspaceAccess("ws-1", "MEMBER");
      expect(result).toEqual({
        user: { id: "user-1", email: "user@example.com", name: "User 1", image: null },
        role: "ADMIN",
      });
    });
  });
});
