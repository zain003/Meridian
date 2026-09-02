"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/rbac";
import {
  createRuleSchema,
  updateRuleSchema,
  toggleRuleSchema,
  deleteRuleSchema,
  type CreateRuleInput,
  type UpdateRuleInput,
} from "@/lib/validations/automation";
import type { ActionResponse } from "@/types";
import type { AutomationRule, ExecutionLog, Prisma } from "@prisma/client";

export async function createRuleAction(
  input: CreateRuleInput
): Promise<ActionResponse<{ ruleId: string }>> {
  const parsed = createRuleSchema.safeParse(input);
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
    name,
    description,
    triggerType,
    triggerData,
    conditions,
    actions,
  } = parsed.data;

  try {
    // Only ADMIN or OWNER can create automation rules
    await requireWorkspaceAccess(workspaceId, "ADMIN");

    const rule = await prisma.automationRule.create({
      data: {
        workspaceId,
        name: name.trim(),
        description: description?.trim() || null,
        triggerType,
        triggerData: (triggerData ?? {}) as unknown as Prisma.InputJsonValue,
        conditions: conditions as unknown as Prisma.InputJsonValue,
        actions: actions as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
      select: { id: true },
    });

    return {
      success: true,
      data: { ruleId: rule.id },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to create automation rule:", error);
    return {
      success: false,
      error: "Failed to create automation rule",
    };
  }
}

export async function toggleRuleAction(
  ruleId: string,
  isActive: boolean
): Promise<ActionResponse<void>> {
  const parsed = toggleRuleSchema.safeParse({ ruleId, isActive });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
    };
  }

  try {
    const rule = await prisma.automationRule.findUnique({
      where: { id: ruleId },
      select: { id: true, workspaceId: true },
    });

    if (!rule) {
      return {
        success: false,
        error: "Automation rule not found",
      };
    }

    await requireWorkspaceAccess(rule.workspaceId, "ADMIN");

    await prisma.automationRule.update({
      where: { id: ruleId },
      data: { isActive },
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
    console.error("Failed to toggle automation rule:", error);
    return {
      success: false,
      error: "Failed to toggle automation rule",
    };
  }
}

export async function getWorkspaceRulesAction(
  workspaceId: string
): Promise<ActionResponse<Array<AutomationRule & { logs: ExecutionLog[] }>>> {
  if (!workspaceId) {
    return {
      success: false,
      error: "Workspace ID is required",
    };
  }

  try {
    await requireWorkspaceAccess(workspaceId, "MEMBER");

    const rules = await prisma.automationRule.findMany({
      where: { workspaceId },
      include: {
        logs: {
          orderBy: { firedAt: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: rules,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to fetch automation rules:", error);
    return {
      success: false,
      error: "Failed to fetch automation rules",
    };
  }
}

export async function deleteRuleAction(
  ruleId: string
): Promise<ActionResponse<void>> {
  const parsed = deleteRuleSchema.safeParse({ ruleId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid rule ID",
    };
  }

  try {
    const rule = await prisma.automationRule.findUnique({
      where: { id: ruleId },
      select: { id: true, workspaceId: true },
    });

    if (!rule) {
      return {
        success: false,
        error: "Automation rule not found",
      };
    }

    await requireWorkspaceAccess(rule.workspaceId, "ADMIN");

    await prisma.automationRule.delete({
      where: { id: ruleId },
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
    console.error("Failed to delete automation rule:", error);
    return {
      success: false,
      error: "Failed to delete automation rule",
    };
  }
}

export async function updateRuleAction(
  input: UpdateRuleInput
): Promise<ActionResponse<void>> {
  const parsed = updateRuleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
    };
  }

  const {
    ruleId,
    name,
    description,
    triggerType,
    triggerData,
    conditions,
    actions,
    isActive,
  } = parsed.data;

  try {
    const rule = await prisma.automationRule.findUnique({
      where: { id: ruleId },
      select: { id: true, workspaceId: true },
    });

    if (!rule) {
      return {
        success: false,
        error: "Automation rule not found",
      };
    }

    await requireWorkspaceAccess(rule.workspaceId, "ADMIN");

    await prisma.automationRule.update({
      where: { id: ruleId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(triggerType !== undefined ? { triggerType } : {}),
        ...(triggerData !== undefined ? { triggerData: triggerData as unknown as Prisma.InputJsonValue } : {}),
        ...(conditions !== undefined ? { conditions: conditions as unknown as Prisma.InputJsonValue } : {}),
        ...(actions !== undefined ? { actions: actions as unknown as Prisma.InputJsonValue } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
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
    console.error("Failed to update automation rule:", error);
    return {
      success: false,
      error: "Failed to update automation rule",
    };
  }
}
