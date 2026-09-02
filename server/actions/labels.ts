"use server";

import { requireWorkspaceAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  createLabelSchema,
  type CreateLabelInput,
} from "@/lib/validations/task";
import type { ActionResponse } from "@/types";

export type { CreateLabelInput };

export async function getWorkspaceLabelsAction(
  workspaceId: string
): Promise<
  ActionResponse<
    Array<{
      id: string;
      name: string;
      color: string;
    }>
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

    const labels = await prisma.label.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        color: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: labels,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to get workspace labels:", error);
    return {
      success: false,
      error: "Failed to retrieve labels",
    };
  }
}

export async function createLabelAction(
  input: CreateLabelInput
): Promise<ActionResponse<{ labelId: string }>> {
  const parsed = createLabelSchema.safeParse(input);
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

  const { workspaceId, name, color } = parsed.data;

  try {
    await requireWorkspaceAccess(workspaceId, "MEMBER");

    const existing = await prisma.label.findUnique({
      where: {
        workspaceId_name: {
          workspaceId,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "LABEL_ALREADY_EXISTS",
      };
    }

    const label = await prisma.label.create({
      data: {
        workspaceId,
        name: name.trim(),
        color: color.trim(),
      },
      select: { id: true },
    });

    return {
      success: true,
      data: { labelId: label.id },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to create label:", error);
    return {
      success: false,
      error: "Failed to create label",
    };
  }
}
