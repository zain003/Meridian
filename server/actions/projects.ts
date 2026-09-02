"use server";

import { requireWorkspaceAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validations/project";
import type { ActionResponse } from "@/types";

export type { CreateProjectInput };

export async function createProjectAction(
  input: CreateProjectInput
): Promise<ActionResponse<{ projectId: string; defaultBoardId: string }>> {
  const parsed = createProjectSchema.safeParse(input);
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

  const { workspaceId, name, key, description } = parsed.data;

  try {
    await requireWorkspaceAccess(workspaceId, "MEMBER");

    const existingProject = await prisma.project.findUnique({
      where: {
        workspaceId_key: {
          workspaceId,
          key,
        },
      },
    });

    if (existingProject) {
      return {
        success: false,
        error: "KEY_ALREADY_EXISTS",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          workspaceId,
          name: name.trim(),
          key,
          description: description?.trim() || null,
        },
      });

      const board = await tx.board.create({
        data: {
          projectId: project.id,
          name: "Main Board",
          order: 0,
        },
      });

      await tx.column.createMany({
        data: [
          { boardId: board.id, name: "Backlog", order: 0 },
          { boardId: board.id, name: "Todo", order: 1 },
          { boardId: board.id, name: "In Progress", order: 2 },
          { boardId: board.id, name: "Review", order: 3 },
          { boardId: board.id, name: "Done", order: 4 },
        ],
      });

      return {
        projectId: project.id,
        defaultBoardId: board.id,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to create project:", error);
    return {
      success: false,
      error: "Failed to create project. Please try again.",
    };
  }
}

export async function getWorkspaceProjectsAction(
  workspaceId: string
): Promise<
  ActionResponse<
    Array<{ id: string; name: string; key: string; description: string | null }>
  >
> {
  if (!workspaceId || typeof workspaceId !== "string") {
    return {
      success: false,
      error: "Workspace ID is required",
    };
  }

  try {
    await requireWorkspaceAccess(workspaceId, "VIEWER");

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      success: true,
      data: projects,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to get workspace projects:", error);
    return {
      success: false,
      error: "Failed to retrieve projects",
    };
  }
}
