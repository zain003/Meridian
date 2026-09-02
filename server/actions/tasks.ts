"use server";

import { requireWorkspaceAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  createTaskSchema,
  moveTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  type CreateTaskInput,
  type MoveTaskInput,
  type UpdateTaskInput,
} from "@/lib/validations/task";
import type { ActionResponse } from "@/types";

export type { CreateTaskInput, MoveTaskInput, UpdateTaskInput };

export async function createTaskAction(
  input: CreateTaskInput
): Promise<ActionResponse<{ taskId: string }>> {
  const parsed = createTaskSchema.safeParse(input);
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

  const {
    workspaceId,
    projectId,
    columnId,
    title,
    description,
    priority,
    dueDate,
    assigneeId,
    labelIds,
  } = parsed.data;

  try {
    await requireWorkspaceAccess(workspaceId, "MEMBER");

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        board: { projectId },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!column) {
      return {
        success: false,
        error: "Column not found",
      };
    }

    if (assigneeId) {
      const assignee = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: assigneeId,
          },
        },
      });

      if (!assignee) {
        return {
          success: false,
          error: "Assignee is not a member of this workspace",
        };
      }
    }

    const maxTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const targetOrder = maxTask !== null ? maxTask.order + 1 : 0;
    const isDone = column.name.trim().toLowerCase() === "done";
    const completedAt = isDone ? new Date() : null;

    const task = await prisma.task.create({
      data: {
        workspaceId,
        projectId,
        columnId,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority ?? "MEDIUM",
        order: targetOrder,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
        completedAt,
        ...(labelIds && labelIds.length > 0
          ? {
              labels: {
                create: labelIds.map((labelId) => ({ labelId })),
              },
            }
          : {}),
      },
      select: { id: true },
    });

    return {
      success: true,
      data: { taskId: task.id },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to create task:", error);
    return {
      success: false,
      error: "Failed to create task",
    };
  }
}

export async function moveTaskAction(
  input: MoveTaskInput
): Promise<ActionResponse<void>> {
  const parsed = moveTaskSchema.safeParse(input);
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

  const { taskId, sourceColumnId, destinationColumnId, newOrder } = parsed.data;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        order: true,
        columnId: true,
        projectId: true,
        completedAt: true,
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

    const destColumn = await prisma.column.findFirst({
      where: {
        id: destinationColumnId,
        board: { projectId: task.projectId },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!destColumn) {
      return {
        success: false,
        error: "Destination column not found",
      };
    }

    const oldOrder = task.order;
    const isDone = destColumn.name.trim().toLowerCase() === "done";

    await prisma.$transaction(async (tx) => {
      if (sourceColumnId === destinationColumnId) {
        if (oldOrder < newOrder) {
          await tx.task.updateMany({
            where: {
              columnId: sourceColumnId,
              order: { gt: oldOrder, lte: newOrder },
              id: { not: taskId },
            },
            data: {
              order: { decrement: 1 },
            },
          });
        } else if (oldOrder > newOrder) {
          await tx.task.updateMany({
            where: {
              columnId: sourceColumnId,
              order: { gte: newOrder, lt: oldOrder },
              id: { not: taskId },
            },
            data: {
              order: { increment: 1 },
            },
          });
        }

        await tx.task.update({
          where: { id: taskId },
          data: { order: newOrder },
        });
      } else {
        await tx.task.updateMany({
          where: {
            columnId: sourceColumnId,
            order: { gt: oldOrder },
            id: { not: taskId },
          },
          data: {
            order: { decrement: 1 },
          },
        });

        await tx.task.updateMany({
          where: {
            columnId: destinationColumnId,
            order: { gte: newOrder },
          },
          data: {
            order: { increment: 1 },
          },
        });

        const completedAt = isDone ? task.completedAt ?? new Date() : null;

        await tx.task.update({
          where: { id: taskId },
          data: {
            columnId: destinationColumnId,
            order: newOrder,
            completedAt,
          },
        });
      }
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
    console.error("Failed to move task:", error);
    return {
      success: false,
      error: "Failed to move task",
    };
  }
}

export async function updateTaskAction(
  input: UpdateTaskInput
): Promise<ActionResponse<void>> {
  const parsed = updateTaskSchema.safeParse(input);
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

  const {
    taskId,
    title,
    description,
    priority,
    dueDate,
    assigneeId,
    columnId,
    completedAt: explicitCompletedAt,
  } = parsed.data;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        columnId: true,
        projectId: true,
        completedAt: true,
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

    if (assigneeId !== undefined && assigneeId !== null) {
      const assignee = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: task.project.workspaceId,
            userId: assigneeId,
          },
        },
      });

      if (!assignee) {
        return {
          success: false,
          error: "Assignee is not a member of this workspace",
        };
      }
    }

    let nextCompletedAt = explicitCompletedAt;
    if (columnId && columnId !== task.columnId && explicitCompletedAt === undefined) {
      const destColumn = await prisma.column.findFirst({
        where: {
          id: columnId,
          board: { projectId: task.projectId },
        },
        select: { name: true },
      });

      if (destColumn) {
        const isDone = destColumn.name.trim().toLowerCase() === "done";
        nextCompletedAt = isDone ? (task.completedAt ?? new Date()) : null;
      }
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined
          ? { description: description?.trim() || null }
          : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
        ...(columnId !== undefined ? { columnId } : {}),
        ...(nextCompletedAt !== undefined ? { completedAt: nextCompletedAt } : {}),
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
    console.error("Failed to update task:", error);
    return {
      success: false,
      error: "Failed to update task",
    };
  }
}

export async function deleteTaskAction(
  taskId: string
): Promise<ActionResponse<void>> {
  const parsed = deleteTaskSchema.safeParse({ taskId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid task ID",
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

    await requireWorkspaceAccess(task.project.workspaceId, "MEMBER");

    await prisma.task.delete({
      where: { id: taskId },
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
    console.error("Failed to delete task:", error);
    return {
      success: false,
      error: "Failed to delete task",
    };
  }
}

export async function getTaskDetailsAction(
  taskId: string
): Promise<
  ActionResponse<{
    id: string;
    workspaceId: string;
    projectId: string;
    columnId: string;
    title: string;
    description: string | null;
    priority: string;
    order: number;
    dueDate: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    assignee: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    } | null;
    column: {
      id: string;
      name: string;
    };
    subtasks: Array<{
      id: string;
      title: string;
      isDone: boolean;
      order: number;
    }>;
    comments: Array<{
      id: string;
      content: string;
      createdAt: Date;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    }>;
    labels: Array<{
      label: {
        id: string;
        name: string;
        color: string;
      };
    }>;
  }>
> {
  if (!taskId || typeof taskId !== "string") {
    return {
      success: false,
      error: "Task ID is required",
    };
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            workspaceId: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            isDone: true,
            order: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        labels: {
          select: {
            label: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
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

    await requireWorkspaceAccess(task.project.workspaceId, "VIEWER");

    return {
      success: true,
      data: task,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to get task details:", error);
    return {
      success: false,
      error: "Failed to retrieve task details",
    };
  }
}

export async function getProjectTasksAction(
  projectId: string
): Promise<
  ActionResponse<
    Array<{
      id: string;
      columnId: string;
      title: string;
      description: string | null;
      priority: string;
      order: number;
      dueDate: Date | null;
      completedAt: Date | null;
      assignee: {
        id: string;
        name: string | null;
        image: string | null;
      } | null;
      _count: {
        subtasks: number;
        comments: number;
      };
      labels: Array<{
        label: {
          id: string;
          name: string;
          color: string;
        };
      }>;
    }>
  >
> {
  if (!projectId || typeof projectId !== "string") {
    return {
      success: false,
      error: "Project ID is required",
    };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        workspaceId: true,
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    await requireWorkspaceAccess(project.workspaceId, "VIEWER");

    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        columnId: true,
        title: true,
        description: true,
        priority: true,
        order: true,
        dueDate: true,
        completedAt: true,
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
          },
        },
        labels: {
          select: {
            label: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    return {
      success: true,
      data: tasks,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to get project tasks:", error);
    return {
      success: false,
      error: "Failed to retrieve project tasks",
    };
  }
}
