"use server";

import { requireWorkspaceAccess, hasMinimumRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
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
