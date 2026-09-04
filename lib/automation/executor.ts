import { prisma } from "@/lib/prisma";
import type { RuleAction } from "@/lib/validations/automation";
import type { TaskPriority } from "@prisma/client";
import {
  sendTransactionalEmail,
  renderNotificationEmailHtml,
} from "@/lib/email/resend";

export const MAX_RECURSION_DEPTH = 3;

export interface ExecutionContext {
  workspaceId: string;
  taskId: string;
  depth?: number;
}

export interface ExecutionResult {
  success: boolean;
  error?: string;
}

/**
 * Dispatches and executes a list of actions for a matched automation rule.
 * Enforces loop protection (depth <= 3) and records audit logs in PostgreSQL.
 */
export async function executeRuleActions(
  ruleId: string,
  actions: RuleAction[],
  context: ExecutionContext
): Promise<ExecutionResult> {
  const depth = context.depth ?? 0;

  // 1. Loop Protection Guard
  if (depth > MAX_RECURSION_DEPTH) {
    const errorMsg = "MAX_DEPTH_EXCEEDED: Execution depth limit exceeded (loop guard)";
    await prisma.executionLog.create({
      data: {
        ruleId,
        status: "SKIPPED",
        eventData: { taskId: context.taskId, depth },
        result: { reason: "MAX_DEPTH_EXCEEDED" },
        error: errorMsg,
      },
    });

    return {
      success: false,
      error: "MAX_DEPTH_EXCEEDED",
    };
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: context.taskId },
      select: {
        id: true,
        workspaceId: true,
        projectId: true,
        columnId: true,
      },
    });

    if (!task) {
      throw new Error(`Target task '${context.taskId}' not found`);
    }

    const executedActions: string[] = [];

    for (const action of actions) {
      switch (action.type) {
        case "ASSIGN_USER": {
          const assigneeId = (action.payload.userId ||
            action.payload.assigneeId) as string | null;

          if (assigneeId) {
            const member = await prisma.workspaceMember.findUnique({
              where: {
                workspaceId_userId: {
                  workspaceId: context.workspaceId,
                  userId: assigneeId,
                },
              },
            });

            if (member) {
              await prisma.task.update({
                where: { id: context.taskId },
                data: { assigneeId },
              });
              executedActions.push(`ASSIGN_USER:${assigneeId}`);
            }
          }
          break;
        }

        case "MOVE_COLUMN": {
          const columnId = action.payload.columnId as string;
          if (columnId) {
            const column = await prisma.column.findFirst({
              where: {
                id: columnId,
                board: { projectId: task.projectId },
              },
              select: { id: true, name: true },
            });

            if (column) {
              const isDone = column.name.trim().toLowerCase() === "done";
              await prisma.task.update({
                where: { id: context.taskId },
                data: {
                  columnId,
                  completedAt: isDone ? new Date() : null,
                },
              });
              executedActions.push(`MOVE_COLUMN:${columnId}`);
            }
          }
          break;
        }

        case "SET_PRIORITY": {
          const priority = action.payload.priority as TaskPriority;
          if (priority) {
            await prisma.task.update({
              where: { id: context.taskId },
              data: { priority },
            });
            executedActions.push(`SET_PRIORITY:${priority}`);
          }
          break;
        }

        case "ADD_LABEL": {
          const labelId = action.payload.labelId as string;
          if (labelId) {
            await prisma.taskLabel.upsert({
              where: {
                taskId_labelId: {
                  taskId: context.taskId,
                  labelId,
                },
              },
              create: {
                taskId: context.taskId,
                labelId,
              },
              update: {},
            });
            executedActions.push(`ADD_LABEL:${labelId}`);
          }
          break;
        }

        case "SEND_NOTIFICATION": {
          const userId = action.payload.userId as string;
          const title = (action.payload.title as string) || "Automation Alert";
          const message = (action.payload.message as string) || "An automation rule has executed.";

          if (userId) {
            await prisma.notification.create({
              data: {
                workspaceId: context.workspaceId,
                userId,
                title,
                message,
                entityType: "TASK",
                entityId: context.taskId,
              },
            });
            executedActions.push(`SEND_NOTIFICATION:${userId}`);
          }
          break;
        }

        case "SEND_EMAIL": {
          const to = (action.payload.to || action.payload.email) as string | undefined;
          const subject =
            (action.payload.subject as string) || "Meridian Automation Alert";
          const body =
            (action.payload.body ||
              action.payload.message ||
              "An automation rule has executed in your workspace.") as string;

          if (to) {
            void sendTransactionalEmail(
              to,
              subject,
              renderNotificationEmailHtml({ title: subject, message: body })
            ).catch((err) => {
              console.error("[Automation Executor] Email dispatch failed:", err);
            });
            executedActions.push(`SEND_EMAIL:${to}`);
          } else {
            executedActions.push("SEND_EMAIL:QUEUED");
          }
          break;
        }
      }
    }

    // 2. Record Success Log
    await prisma.executionLog.create({
      data: {
        ruleId,
        status: "SUCCESS",
        eventData: { taskId: context.taskId, depth },
        result: {
          actionsExecuted: executedActions.length,
          details: executedActions,
        },
      },
    });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown execution error";

    // 3. Record Failure Log
    await prisma.executionLog.create({
      data: {
        ruleId,
        status: "FAILED",
        eventData: { taskId: context.taskId, depth },
        result: {},
        error: errorMsg,
      },
    });

    return {
      success: false,
      error: errorMsg,
    };
  }
}
