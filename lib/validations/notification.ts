import { z } from "zod";

export const notificationEntityTypeEnum = z.enum(["TASK", "COMMENT", "RULE"]);
export type NotificationEntityType = z.infer<typeof notificationEntityTypeEnum>;

export const createNotificationSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  userId: z.string().min(1, "User ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or less"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message must be 1000 characters or less"),
  entityType: notificationEntityTypeEnum,
  entityId: z.string().min(1, "Entity ID is required"),
  sendEmail: z.boolean().optional().default(false),
});

export type CreateNotificationInput = z.input<typeof createNotificationSchema>;

export const getUserNotificationsSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export type GetUserNotificationsInput = z.input<typeof getUserNotificationsSchema>;

export const markNotificationAsReadSchema = z.object({
  notificationId: z.string().min(1, "Notification ID is required"),
});

export type MarkNotificationAsReadInput = z.input<typeof markNotificationAsReadSchema>;

export const markAllNotificationsAsReadSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export type MarkAllNotificationsAsReadInput = z.input<typeof markAllNotificationsAsReadSchema>;
