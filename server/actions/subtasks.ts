"use server";

import { requireWorkspaceAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  createSubtaskSchema,
  toggleSubtaskSchema,
  deleteSubtaskSchema,
  type CreateSubtaskInput,
  type ToggleSubtaskInput,
  type DeleteSubtaskInput,
} from "@/lib/validations/task";
import type { ActionResponse } from "@/types";

export type { CreateSubtaskInput, ToggleSubtaskInput, DeleteSubtaskInput };

export async function createSubtaskAction(
  input: CreateSubtaskInput
): Promise<ActionResponse<{ subtaskId: string }>> {
  const parsed = createSubtaskSchema.safeParse(input);
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

  const { taskId, title } = parsed.data;

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

    await requireWorkspaceAccess(task.project.workspaceId, "MEMBER");

    const maxSubtask = await prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const targetOrder = maxSubtask !== null ? maxSubtask.order + 1 : 0;

    const subtask = await prisma.subtask.create({
      data: {
        taskId,
        title: title.trim(),
        order: targetOrder,
        isDone: false,
      },
      select: { id: true },
    });

    return {
      success: true,
      data: { subtaskId: subtask.id },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to create subtask:", error);
    return {
      success: false,
      error: "Failed to create subtask",
    };
  }
}

export async function toggleSubtaskAction(
  subtaskId: string,
  isDone: boolean
): Promise<ActionResponse<void>> {
  const parsed = toggleSubtaskSchema.safeParse({ subtaskId, isDone });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
    };
  }

  try {
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
      select: {
        id: true,
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

    if (!subtask) {
      return {
        success: false,
        error: "Subtask not found",
      };
    }

    await requireWorkspaceAccess(subtask.task.project.workspaceId, "MEMBER");

    await prisma.subtask.update({
      where: { id: subtaskId },
      data: { isDone },
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
    console.error("Failed to toggle subtask:", error);
    return {
      success: false,
      error: "Failed to toggle subtask",
    };
  }
}

export async function deleteSubtaskAction(
  subtaskId: string
): Promise<ActionResponse<void>> {
  const parsed = deleteSubtaskSchema.safeParse({ subtaskId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid subtask ID",
    };
  }

  try {
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
      select: {
        id: true,
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

    if (!subtask) {
      return {
        success: false,
        error: "Subtask not found",
      };
    }

    await requireWorkspaceAccess(subtask.task.project.workspaceId, "MEMBER");

    await prisma.subtask.delete({
      where: { id: subtaskId },
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
    console.error("Failed to delete subtask:", error);
    return {
      success: false,
      error: "Failed to delete subtask",
    };
  }
}
