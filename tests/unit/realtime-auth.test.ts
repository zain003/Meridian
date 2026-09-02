import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Prisma
const mockFindUniqueWorkspaceMember = vi.fn();
const mockFindUniqueBoard = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: {
      findUnique: (...args: unknown[]) => mockFindUniqueWorkspaceMember(...args),
    },
    board: {
      findUnique: (...args: unknown[]) => mockFindUniqueBoard(...args),
    },
  },
}));

// Mock Auth Session
const mockGetAuthSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthSession: () => mockGetAuthSession(),
}));

import {
  parseChannelName,
  pusherAuthPayloadSchema,
} from "@/lib/validations/realtime";
import {
  authorizePusherChannel,
  RealtimeAuthError,
  triggerPusherEvent,
} from "@/lib/pusher";
import { POST } from "@/app/api/realtime/auth/route";

describe("Real-Time Backend & Channel Authorization (FEAT-004-BE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Channel Name Parsing & Validation", () => {
    it("correctly parses presence workspace channels", () => {
      const res = parseChannelName("presence-workspace-ws-123");
      expect(res).toEqual({
        type: "presence-workspace",
        workspaceId: "ws-123",
      });
    });

    it("correctly parses private board channels", () => {
      const res = parseChannelName("private-board-board-999");
      expect(res).toEqual({
        type: "private-board",
        boardId: "board-999",
      });
    });

    it("identifies unknown or malformed channel names", () => {
      expect(parseChannelName("public-feed")).toEqual({
        type: "unknown",
        raw: "public-feed",
      });
      expect(parseChannelName("presence-workspace-")).toEqual({
        type: "unknown",
        raw: "presence-workspace-",
      });
      expect(parseChannelName("")).toEqual({
        type: "unknown",
        raw: "",
      });
    });

    it("validates socket_id and channel_name with Zod schema", () => {
      const valid = pusherAuthPayloadSchema.safeParse({
        socket_id: "12345.67890",
        channel_name: "presence-workspace-ws-1",
      });
      expect(valid.success).toBe(true);

      const invalidSocket = pusherAuthPayloadSchema.safeParse({
        socket_id: "invalid_socket_id",
        channel_name: "presence-workspace-ws-1",
      });
      expect(invalidSocket.success).toBe(false);
    });
  });

  describe("authorizePusherChannel Helper", () => {
    const mockUser = {
      id: "u-1",
      name: "Jane Doe",
      email: "jane@example.com",
      image: "https://example.com/avatar.png",
    };

    it("throws 401 when user is not authenticated", async () => {
      await expect(
        authorizePusherChannel(null, "123.456", "presence-workspace-ws-1")
      ).rejects.toThrowError(RealtimeAuthError);

      await expect(
        authorizePusherChannel(undefined, "123.456", "presence-workspace-ws-1")
      ).rejects.toMatchObject({ status: 401 });
    });

    it("throws 400 when channel name is unsupported", async () => {
      await expect(
        authorizePusherChannel(mockUser, "123.456", "unsupported-channel")
      ).rejects.toMatchObject({ status: 400 });
    });

    it("authorizes presence channel for valid workspace member", async () => {
      mockFindUniqueWorkspaceMember.mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "u-1",
        role: "MEMBER",
      });

      const res = await authorizePusherChannel(
        mockUser,
        "123.456",
        "presence-workspace-ws-1"
      );

      expect(res.auth).toBeDefined();
      expect(res.channel_data).toBeDefined();
      const channelData = JSON.parse(res.channel_data!);
      expect(channelData.user_id).toBe("u-1");
      expect(channelData.user_info.name).toBe("Jane Doe");
      expect(channelData.user_info.email).toBe("jane@example.com");
    });

    it("throws 403 when user is not a member of the workspace", async () => {
      mockFindUniqueWorkspaceMember.mockResolvedValue(null);

      await expect(
        authorizePusherChannel(mockUser, "123.456", "presence-workspace-ws-forbidden")
      ).rejects.toMatchObject({ status: 403 });
    });

    it("authorizes private board channel for valid workspace member", async () => {
      mockFindUniqueBoard.mockResolvedValue({
        id: "board-1",
        project: {
          workspaceId: "ws-1",
        },
      });

      mockFindUniqueWorkspaceMember.mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "u-1",
        role: "MEMBER",
      });

      const res = await authorizePusherChannel(
        mockUser,
        "123.456",
        "private-board-board-1"
      );

      expect(res.auth).toBeDefined();
    });

    it("throws 404 when private board does not exist", async () => {
      mockFindUniqueBoard.mockResolvedValue(null);

      await expect(
        authorizePusherChannel(mockUser, "123.456", "private-board-nonexistent")
      ).rejects.toMatchObject({ status: 404 });
    });

    it("throws 403 when user does not have access to board workspace", async () => {
      mockFindUniqueBoard.mockResolvedValue({
        id: "board-1",
        project: {
          workspaceId: "ws-private",
        },
      });

      mockFindUniqueWorkspaceMember.mockResolvedValue(null);

      await expect(
        authorizePusherChannel(mockUser, "123.456", "private-board-board-1")
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe("triggerPusherEvent Safe Wrapper", () => {
    it("safely handles trigger calls without throwing", async () => {
      await expect(
        triggerPusherEvent("private-board-1", "task-updated", { taskId: "t-1" })
      ).resolves.not.toThrow();
    });
  });

  describe("HTTP Route Handler POST /api/realtime/auth", () => {
    it("returns 401 when user is not logged in", async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/realtime/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socket_id: "123.456",
          channel_name: "presence-workspace-ws-1",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Unauthorized");
    });

    it("returns 400 when payload validation fails", async () => {
      mockGetAuthSession.mockResolvedValue({
        user: { id: "u-1", email: "u@example.com" },
      });

      const req = new NextRequest("http://localhost:3000/api/realtime/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socket_id: "invalid-format",
          channel_name: "",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 200 with auth payload for authorized JSON request", async () => {
      mockGetAuthSession.mockResolvedValue({
        user: { id: "u-1", name: "Jane", email: "jane@example.com" },
      });

      mockFindUniqueWorkspaceMember.mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "u-1",
      });

      const req = new NextRequest("http://localhost:3000/api/realtime/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socket_id: "12345.67890",
          channel_name: "presence-workspace-ws-1",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.auth).toBeDefined();
    });

    it("returns 200 with auth payload for URL-encoded FormData request", async () => {
      mockGetAuthSession.mockResolvedValue({
        user: { id: "u-1", name: "Jane", email: "jane@example.com" },
      });

      mockFindUniqueWorkspaceMember.mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "u-1",
      });

      const formData = new FormData();
      formData.append("socket_id", "99999.11111");
      formData.append("channel_name", "presence-workspace-ws-1");

      const req = new NextRequest("http://localhost:3000/api/realtime/auth", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.auth).toBeDefined();
    });
  });
});
