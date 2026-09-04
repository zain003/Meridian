import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createNotification } from "@/lib/notifications/service";
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/server/actions/notifications";
import {
  sendTransactionalEmail,
  renderNotificationEmailHtml,
} from "@/lib/email/resend";
import * as authModule from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Mock Resend SDK
const mockSend = vi.fn();
vi.mock("resend", () => {
  return {
    Resend: class {
      emails = {
        send: mockSend,
      };
    },
  };
});

vi.mock("@/lib/auth", () => ({
  getAuthSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe("Notifications Backend & Server Actions (FEAT-006-BE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Notification Service (createNotification)", () => {
    it("inserts a Notification record in the database with isRead: false", async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({
        id: "notif-101",
        workspaceId: "ws-1",
        userId: "user-recipient",
        title: "Task Assigned",
        message: "You were assigned to 'Auth System'",
      } as any);

      const result = await createNotification({
        workspaceId: "ws-1",
        userId: "user-recipient",
        title: "Task Assigned",
        message: "You were assigned to 'Auth System'",
        entityType: "TASK",
        entityId: "task-100",
        sendEmail: false,
      });

      expect(result.notificationId).toBe("notif-101");
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          workspaceId: "ws-1",
          userId: "user-recipient",
          title: "Task Assigned",
          message: "You were assigned to 'Auth System'",
          entityType: "TASK",
          entityId: "task-100",
          isRead: false,
        },
        select: {
          id: true,
          workspaceId: true,
          userId: true,
          title: true,
          message: true,
        },
      });
    });

    it("suppresses notification creation when actor notifies themselves", async () => {
      const result = await createNotification(
        {
          workspaceId: "ws-1",
          userId: "user-author",
          title: "Self Assignment",
          message: "Self assigned task",
          entityType: "TASK",
          entityId: "task-100",
        },
        "user-author" // actorId equals recipient userId
      );

      expect(result.notificationId).toBe("");
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it("dispatches transactional email when sendEmail is true and user has email", async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({
        id: "notif-102",
        workspaceId: "ws-1",
        userId: "user-recipient",
        title: "New Comment",
        message: "Alice commented on your task",
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        email: "recipient@example.com",
        name: "Recipient User",
      } as any);

      mockSend.mockResolvedValue({
        data: { id: "resend-msg-123" },
        error: null,
      });

      const origEnv = process.env.RESEND_API_KEY;
      process.env.RESEND_API_KEY = "re_test_123";

      try {
        const result = await createNotification({
          workspaceId: "ws-1",
          userId: "user-recipient",
          title: "New Comment",
          message: "Alice commented on your task",
          entityType: "COMMENT",
          entityId: "task-100",
          sendEmail: true,
        });

        expect(result.notificationId).toBe("notif-102");
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: "user-recipient" },
          select: { email: true, name: true },
        });
      } finally {
        process.env.RESEND_API_KEY = origEnv;
      }
    });

    it("handles missing user email gracefully without failing notification creation", async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({
        id: "notif-103",
        workspaceId: "ws-1",
        userId: "user-no-email",
        title: "Rule Executed",
        message: "Automation rule ran",
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        email: null,
        name: "No Email User",
      } as any);

      const result = await createNotification({
        workspaceId: "ws-1",
        userId: "user-no-email",
        title: "Rule Executed",
        message: "Automation rule ran",
        entityType: "RULE",
        entityId: "task-100",
        sendEmail: true,
      });

      expect(result.notificationId).toBe("notif-103");
      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });

  describe("2. getUserNotificationsAction", () => {
    it("returns notifications filtered strictly by current session user and workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user1@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-1",
        role: "MEMBER",
      } as any);

      const mockNotifications = [
        {
          id: "notif-1",
          workspaceId: "ws-1",
          userId: "user-1",
          title: "Task Assigned",
          message: "Assigned to Task A",
          entityType: "TASK",
          entityId: "task-a",
          isRead: false,
          createdAt: new Date("2026-09-01T10:00:00Z"),
        },
        {
          id: "notif-2",
          workspaceId: "ws-1",
          userId: "user-1",
          title: "New Comment",
          message: "Comment on Task B",
          entityType: "COMMENT",
          entityId: "task-b",
          isRead: true,
          createdAt: new Date("2026-09-01T09:00:00Z"),
        },
      ];

      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        mockNotifications as any
      );

      const res = await getUserNotificationsAction("ws-1");

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(2);
        expect(res.data[0].id).toBe("notif-1");
      }

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId: "ws-1",
          userId: "user-1",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      });
    });

    it("returns UNAUTHORIZED when session is missing", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      const res = await getUserNotificationsAction("ws-1");
      expect(res).toEqual({
        success: false,
        error: "UNAUTHORIZED",
      });
    });

    it("returns FORBIDDEN when user is not a member of the workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-intruder", email: "intruder@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

      const res = await getUserNotificationsAction("ws-1");
      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });
  });

  describe("3. markNotificationAsReadAction", () => {
    it("updates isRead: true for target notification belonging to current user", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-owner", email: "owner@example.com" },
      });

      vi.mocked(prisma.notification.findUnique).mockResolvedValue({
        id: "notif-1",
        userId: "user-owner",
        isRead: false,
      } as any);

      vi.mocked(prisma.notification.update).mockResolvedValue({
        id: "notif-1",
        isRead: true,
      } as any);

      const res = await markNotificationAsReadAction("notif-1");

      expect(res.success).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: { isRead: true },
      });
    });

    it("rejects unauthorized user attempting to mark another user's notification as read", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-other", email: "other@example.com" },
      });

      vi.mocked(prisma.notification.findUnique).mockResolvedValue({
        id: "notif-1",
        userId: "user-owner",
        isRead: false,
      } as any);

      const res = await markNotificationAsReadAction("notif-1");

      expect(res).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it("returns error when notification does not exist", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-owner", email: "owner@example.com" },
      });

      vi.mocked(prisma.notification.findUnique).mockResolvedValue(null);

      const res = await markNotificationAsReadAction("notif-nonexistent");

      expect(res).toEqual({
        success: false,
        error: "Notification not found",
      });
    });
  });

  describe("4. markAllNotificationsAsReadAction", () => {
    it("updates all unread notifications for the user in the workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({
        user: { id: "user-1", email: "user1@example.com" },
      });

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        id: "mem-1",
        workspaceId: "ws-1",
        userId: "user-1",
        role: "MEMBER",
      } as any);

      vi.mocked(prisma.notification.updateMany).mockResolvedValue({
        count: 5,
      } as any);

      const res = await markAllNotificationsAsReadAction("ws-1");

      expect(res.success).toBe(true);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          workspaceId: "ws-1",
          userId: "user-1",
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    });
  });

  describe("5. sendTransactionalEmail", () => {
    it("invokes Resend API with subject and HTML body", async () => {
      const origEnv = process.env.RESEND_API_KEY;
      process.env.RESEND_API_KEY = "re_test_key_123";

      mockSend.mockResolvedValue({
        data: { id: "msg_resend_999" },
        error: null,
      });

      try {
        const emailHtml = renderNotificationEmailHtml({
          title: "New Task Assigned",
          message: "You have been assigned to 'Fix Bug #42'",
          userName: "Zain",
          actionUrl: "http://localhost:3000/ws-1",
        });

        const result = await sendTransactionalEmail(
          "developer@example.com",
          "New Task Assigned",
          emailHtml
        );

        expect(result.success).toBe(true);
        expect(result.messageId).toBe("msg_resend_999");
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "developer@example.com",
            subject: "New Task Assigned",
            html: expect.stringContaining("MERIDIAN"),
          })
        );
      } finally {
        process.env.RESEND_API_KEY = origEnv;
      }
    });

    it("handles missing API key gracefully in simulation mode without throwing", async () => {
      const origEnv = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      try {
        const result = await sendTransactionalEmail(
          "test@example.com",
          "Subject",
          "<p>Body</p>"
        );

        expect(result.success).toBe(true);
        expect(result.messageId).toBe("simulated-msg-id");
      } finally {
        process.env.RESEND_API_KEY = origEnv;
      }
    });

    it("handles Resend API error response without throwing", async () => {
      const origEnv = process.env.RESEND_API_KEY;
      process.env.RESEND_API_KEY = "re_test_key_123";

      mockSend.mockResolvedValue({
        data: null,
        error: { message: "Invalid API key" },
      });

      try {
        const result = await sendTransactionalEmail(
          "test@example.com",
          "Subject",
          "<p>Body</p>"
        );

        expect(result.success).toBe(false);
      } finally {
        process.env.RESEND_API_KEY = origEnv;
      }
    });

    it("handles empty recipient address safely without throwing", async () => {
      const result = await sendTransactionalEmail("", "Subject", "<p>Body</p>");
      expect(result.success).toBe(false);
    });
  });
});
