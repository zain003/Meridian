import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getWorkspaceLabelsAction,
  createLabelAction,
} from "@/server/actions/labels";
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
    label: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("Label Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWorkspaceLabelsAction", () => {
    it("returns UNAUTHORIZED when session is missing", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      const res = await getWorkspaceLabelsAction("ws-1");

      expect(res).toEqual({
        success: false,
        error: "UNAUTHORIZED",
      });
    });

    it("returns workspace labels sorted by name ascending", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-viewer", email: "viewer@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-viewer",
        role: "VIEWER",
      } as any);

      vi.mocked(prisma.label.findMany).mockResolvedValue([
        { id: "lbl-1", name: "Bug", color: "#EF4444" },
        { id: "lbl-2", name: "Feature", color: "#3B82F6" },
      ] as any);

      const res = await getWorkspaceLabelsAction("ws-1");

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(2);
        expect(res.data[0].name).toBe("Bug");
      }
    });
  });

  describe("createLabelAction", () => {
    it("rejects creation if label already exists in workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.label.findUnique).mockResolvedValue({
        id: "lbl-existing",
        name: "Bug",
      } as any);

      const res = await createLabelAction({
        workspaceId: "ws-1",
        name: "Bug",
        color: "#EF4444",
      });

      expect(res).toEqual({
        success: false,
        error: "LABEL_ALREADY_EXISTS",
      });
    });

    it("creates label successfully for workspace MEMBER", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-member", email: "member@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-member",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.label.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.label.create).mockResolvedValue({
        id: "lbl-new-1",
      } as any);

      const res = await createLabelAction({
        workspaceId: "ws-1",
        name: "Enhancement",
        color: "#10B981",
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.labelId).toBe("lbl-new-1");
      }

      expect(prisma.label.create).toHaveBeenCalledWith({
        data: {
          workspaceId: "ws-1",
          name: "Enhancement",
          color: "#10B981",
        },
        select: { id: true },
      });
    });
  });
});
