"use server";

import { requireWorkspaceAccess, hasMinimumRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/service";
import {
  createCommentSchema,
  deleteCommentSchema,
  type CreateCommentInput,
  type DeleteCommentInput,
} from "@/lib/validations/task";
import type { ActionResponse } from "@/types";

export type { CreateCommentInput, DeleteCommentInput };

export async function addCommentAction(
  taskId: string,
  content: string
): Promise<ActionResponse<{ commentId: string }>> {
  const parsed = createCommentSchema.safeParse({ taskId, content });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: "Invalid input",
      fieldErrors,
    };
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        assigneeId: true,
        project: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!task) {
      return {
        success: false,
        error: "Task not found",
      };
    }

    const { user } = await requireWorkspaceAccess(
      task.project.workspaceId,
      "MEMBER"
    );

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: user.id,
        content: parsed.data.content.trim(),
      },
      select: { id: true },
    });

    const workspaceId = task.project.workspaceId;
    const authorName = user.name || user.email.split("@")[0];
    const previewContent = parsed.data.content.trim().slice(0, 100);
    const notifiedUserIds = new Set<string>();

    // 1. Notify task assignee if someone else comments on their task
    if (task.assigneeId && task.assigneeId !== user.id) {
      notifiedUserIds.add(task.assigneeId);
      void createNotification(
        {
          workspaceId,
          userId: task.assigneeId,
          title: `New Comment on "${task.title}"`,
          message: `${authorName} commented: "${previewContent}${
            parsed.data.content.length > 100 ? "..." : ""
          }"`,
          entityType: "COMMENT",
          entityId: task.id,
          sendEmail: true,
        },
        user.id
      ).catch((err) => {
        console.error("Failed to dispatch comment notification to assignee:", err);
      });
    }

    // 2. Parse @mentions in comment body and notify mentioned workspace members
    const mentionMatches = parsed.data.content.match(/@([a-zA-Z0-9._-]+)/g);
    if (mentionMatches && mentionMatches.length > 0) {
      const handles = Array.from(
        new Set(mentionMatches.map((m) => m.slice(1).toLowerCase()))
      );

      // Look up workspace members matching username or email prefix
      const matchingMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          user: {
            OR: handles.map((handle) => ({
              OR: [
                { email: { startsWith: handle, mode: "insensitive" } },
                { name: { contains: handle, mode: "insensitive" } },
              ],
            })),
          },
        },
        select: { userId: true },
      });

      for (const member of matchingMembers) {
        if (member.userId !== user.id && !notifiedUserIds.has(member.userId)) {
          notifiedUserIds.add(member.userId);
          void createNotification(
            {
              workspaceId,
              userId: member.userId,
              title: `Mentioned in "${task.title}"`,
              message: `${authorName} mentioned you: "${previewContent}${
                parsed.data.content.length > 100 ? "..." : ""
              }"`,
              entityType: "COMMENT",
              entityId: task.id,
              sendEmail: true,
            },
            user.id
          ).catch((err) => {
            console.error("Failed to dispatch mention notification:", err);
          });
        }
      }
    }

    return {
      success: true,
      data: { commentId: comment.id },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to add comment:", error);
    return {
      success: false,
      error: "Failed to add comment",
    };
  }
}

export async function deleteCommentAction(
  commentId: string
): Promise<ActionResponse<void>> {
  const parsed = deleteCommentSchema.safeParse({ commentId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid comment ID",
    };
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        userId: true,
        task: {
          select: {
            project: {
              select: {
                workspaceId: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return {
        success: false,
        error: "Comment not found",
      };
    }

    const { user, role } = await requireWorkspaceAccess(
      comment.task.project.workspaceId,
      "MEMBER"
    );

    const isAuthor = comment.userId === user.id;
    const isElevated = hasMinimumRole(role, "ADMIN");

    if (!isAuthor && !isElevated) {
      return {
        success: false,
        error: "FORBIDDEN",
      };
    }

    await prisma.comment.delete({
      where: { id: commentId },
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
    console.error("Failed to delete comment:", error);
    return {
      success: false,
      error: "Failed to delete comment",
    };
  }
}
