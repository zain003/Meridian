import { describe, it, expect } from "vitest";
import {
  createNotificationSchema,
  getUserNotificationsSchema,
  markNotificationAsReadSchema,
  markAllNotificationsAsReadSchema,
} from "@/lib/validations/notification";

describe("Notification Validation Schemas (FEAT-006-BE)", () => {
  describe("createNotificationSchema", () => {
    it("validates valid notification input", () => {
      const valid = {
        workspaceId: "ws-123",
        userId: "user-456",
        title: "Task Assigned",
        message: "You were assigned to 'Implement Auth'",
        entityType: "TASK",
        entityId: "task-789",
        sendEmail: true,
      };

      const result = createNotificationSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sendEmail).toBe(true);
      }
    });

    it("defaults sendEmail to false when omitted", () => {
      const input = {
        workspaceId: "ws-123",
        userId: "user-456",
        title: "New Comment",
        message: "Alice commented on your task",
        entityType: "COMMENT",
        entityId: "task-789",
      };

      const result = createNotificationSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sendEmail).toBe(false);
      }
    });

    it("rejects empty workspaceId or userId", () => {
      const invalid = {
        workspaceId: "",
        userId: "",
        title: "Title",
        message: "Message",
        entityType: "TASK",
        entityId: "task-1",
      };

      const result = createNotificationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects empty title or message", () => {
      const invalid = {
        workspaceId: "ws-1",
        userId: "user-1",
        title: "",
        message: "",
        entityType: "TASK",
        entityId: "task-1",
      };

      const result = createNotificationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid entityType", () => {
      const invalid = {
        workspaceId: "ws-1",
        userId: "user-1",
        title: "Title",
        message: "Message",
        entityType: "UNKNOWN",
        entityId: "task-1",
      };

      const result = createNotificationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("accepts all allowed entity types (TASK, COMMENT, RULE)", () => {
      const types = ["TASK", "COMMENT", "RULE"] as const;
      for (const entityType of types) {
        const result = createNotificationSchema.safeParse({
          workspaceId: "ws-1",
          userId: "user-1",
          title: "Title",
          message: "Message",
          entityType,
          entityId: "entity-1",
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("getUserNotificationsSchema", () => {
    it("accepts valid workspaceId", () => {
      const result = getUserNotificationsSchema.safeParse({ workspaceId: "ws-123" });
      expect(result.success).toBe(true);
    });

    it("rejects empty workspaceId", () => {
      const result = getUserNotificationsSchema.safeParse({ workspaceId: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("markNotificationAsReadSchema", () => {
    it("accepts valid notificationId", () => {
      const result = markNotificationAsReadSchema.safeParse({ notificationId: "notif-123" });
      expect(result.success).toBe(true);
    });

    it("rejects empty notificationId", () => {
      const result = markNotificationAsReadSchema.safeParse({ notificationId: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("markAllNotificationsAsReadSchema", () => {
    it("accepts valid workspaceId", () => {
      const result = markAllNotificationsAsReadSchema.safeParse({ workspaceId: "ws-123" });
      expect(result.success).toBe(true);
    });

    it("rejects empty workspaceId", () => {
      const result = markAllNotificationsAsReadSchema.safeParse({ workspaceId: "" });
      expect(result.success).toBe(false);
    });
  });
});
