"use server";

import { requireWorkspaceAccess } from "@/lib/rbac";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserNotificationsSchema,
  markNotificationAsReadSchema,
  markAllNotificationsAsReadSchema,
} from "@/lib/validations/notification";
import type { ActionResponse } from "@/types";
import type { Notification } from "@prisma/client";

/**
 * Fetches recent in-app notifications for the authenticated user in the specified workspace.
 * Returns up to 50 most recent notifications ordered descending by creation date.
 */
export async function getUserNotificationsAction(
  workspaceId: string
): Promise<ActionResponse<Array<Notification>>> {
  const parsed = getUserNotificationsSchema.safeParse({ workspaceId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid workspace ID",
    };
  }

  try {
    const { user } = await requireWorkspaceAccess(workspaceId, "VIEWER");

    const notifications = await prisma.notification.findMany({
      where: {
        workspaceId,
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return {
      success: true,
      data: notifications,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to fetch user notifications:", error);
    return {
      success: false,
      error: "Failed to fetch notifications",
    };
  }
}

/**
 * Marks a specific notification as read.
 * Enforces ownership check so users can only update their own notifications.
 */
export async function markNotificationAsReadAction(
  notificationId: string
): Promise<ActionResponse<void>> {
  const parsed = markNotificationAsReadSchema.safeParse({ notificationId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid notification ID",
    };
  }

  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "UNAUTHORIZED",
      };
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true, isRead: true },
    });

    if (!notification) {
      return {
        success: false,
        error: "Notification not found",
      };
    }

    if (notification.userId !== session.user.id) {
      return {
        success: false,
        error: "FORBIDDEN",
      };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to mark notification as read:", error);
    return {
      success: false,
      error: "Failed to mark notification as read",
    };
  }
}

/**
 * Marks all unread notifications as read for the authenticated user within a workspace.
 */
export async function markAllNotificationsAsReadAction(
  workspaceId: string
): Promise<ActionResponse<void>> {
  const parsed = markAllNotificationsAsReadSchema.safeParse({ workspaceId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid workspace ID",
    };
  }

  try {
    const { user } = await requireWorkspaceAccess(workspaceId, "VIEWER");

    await prisma.notification.updateMany({
      where: {
        workspaceId,
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to mark all notifications as read:", error);
    return {
      success: false,
      error: "Failed to mark all notifications as read",
    };
  }
}
