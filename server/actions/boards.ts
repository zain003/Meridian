"use server";

import { requireWorkspaceAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  createColumnSchema,
  reorderColumnsSchema,
  deleteColumnSchema,
  type CreateColumnInput,
  type ReorderColumnsInput,
} from "@/lib/validations/project";
import type { ActionResponse } from "@/types";

export type { CreateColumnInput, ReorderColumnsInput };

export async function getProjectBoardsAction(
  projectId: string
): Promise<
  ActionResponse<
    Array<{
      id: string;
      name: string;
      columns: Array<{ id: string; name: string; order: number }>;
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

    const boards = await prisma.board.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        columns: {
          select: {
            id: true,
            name: true,
            order: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    return {
      success: true,
      data: boards,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to get project boards:", error);
    return {
      success: false,
      error: "Failed to retrieve project boards",
    };
  }
}

export async function createColumnAction(
  input: CreateColumnInput
): Promise<ActionResponse<{ columnId: string }>> {
  const parsed = createColumnSchema.safeParse(input);
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

  const { boardId, name, order } = parsed.data;

  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: {
        id: true,
        project: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!board) {
      return {
        success: false,
        error: "Board not found",
      };
    }

    await requireWorkspaceAccess(board.project.workspaceId, "MEMBER");

    let targetOrder = order;
    if (targetOrder === undefined) {
      const maxColumn = await prisma.column.findFirst({
        where: { boardId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      targetOrder = maxColumn !== null ? maxColumn.order + 1 : 0;
    }

    const column = await prisma.column.create({
      data: {
        boardId,
        name: name.trim(),
        order: targetOrder,
      },
    });

    return {
      success: true,
      data: { columnId: column.id },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to create column:", error);
    return {
      success: false,
      error: "Failed to create column",
    };
  }
}

export async function reorderColumnsAction(
  input: ReorderColumnsInput
): Promise<ActionResponse<void>> {
  const parsed = reorderColumnsSchema.safeParse(input);
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

  const { boardId, columnIds } = parsed.data;

  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: {
        id: true,
        project: {
          select: {
            workspaceId: true,
          },
        },
        columns: {
          select: { id: true },
        },
      },
    });

    if (!board) {
      return {
        success: false,
        error: "Board not found",
      };
    }

    await requireWorkspaceAccess(board.project.workspaceId, "MEMBER");

    const existingColumnIds = new Set(board.columns.map((c) => c.id));
    const allBelong = columnIds.every((id) => existingColumnIds.has(id));

    if (!allBelong) {
      return {
        success: false,
        error: "Invalid column IDs for board",
      };
    }

    await prisma.$transaction(
      columnIds.map((colId, index) =>
        prisma.column.update({
          where: { id: colId },
          data: { order: index },
        })
      )
    );

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
    console.error("Failed to reorder columns:", error);
    return {
      success: false,
      error: "Failed to reorder columns",
    };
  }
}

export async function deleteColumnAction(
  columnId: string
): Promise<ActionResponse<void>> {
  const parsed = deleteColumnSchema.safeParse({ columnId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid column ID",
    };
  }

  try {
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      select: {
        id: true,
        name: true,
        boardId: true,
        board: {
          select: {
            id: true,
            project: {
              select: {
                workspaceId: true,
              },
            },
            columns: {
              select: {
                id: true,
                name: true,
                order: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!column) {
      return {
        success: false,
        error: "Column not found",
      };
    }

    await requireWorkspaceAccess(column.board.project.workspaceId, "MEMBER");

    if (column.board.columns.length <= 1) {
      return {
        success: false,
        error: "CANNOT_DELETE_LAST_COLUMN",
      };
    }

    const taskCount = column._count.tasks;
    if (taskCount > 0) {
      const otherColumns = column.board.columns.filter((c) => c.id !== columnId);
      const fallbackColumn =
        otherColumns.find((c) => c.name.toLowerCase() === "backlog") ||
        otherColumns[0];

      if (!fallbackColumn) {
        return {
          success: false,
          error: "Cannot delete column with tasks: No fallback column available",
        };
      }

      await prisma.$transaction(async (tx) => {
        await tx.task.updateMany({
          where: { columnId },
          data: { columnId: fallbackColumn.id },
        });
        await tx.column.delete({
          where: { id: columnId },
        });
      });
    } else {
      await prisma.column.delete({
        where: { id: columnId },
      });
    }

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
    console.error("Failed to delete column:", error);
    return {
      success: false,
      error: "Failed to delete column",
    };
  }
}
