import { prisma } from "@/lib/prisma";
import { getRedisClient } from "@/lib/redis";
import { evaluateRuleConditions } from "@/lib/automation/evaluator";
import { executeRuleActions } from "@/lib/automation/executor";
import type { RuleCondition, RuleAction } from "@/lib/validations/automation";
import { AUTOMATION_QUEUE_KEY, type RuleJobPayload } from "@/lib/automation/queue";

export interface JobProcessResult {
  rulesEvaluated: number;
  rulesFired: number;
}

/**
 * Processes an automation job by finding matching active rules in the workspace,
 * evaluating conditions, and dispatching actions with execution logging.
 */
export async function processAutomationJob(
  payload: RuleJobPayload
): Promise<JobProcessResult> {
  const { workspaceId, triggerType, taskId, newData, depth = 0 } = payload;

  if (!prisma.automationRule) {
    return { rulesEvaluated: 0, rulesFired: 0 };
  }

  const rules = await prisma.automationRule.findMany({
    where: {
      workspaceId,
      triggerType,
      isActive: true,
    },
    orderBy: { createdAt: "asc" },
  });

  let rulesEvaluated = 0;
  let rulesFired = 0;

  for (const rule of rules) {
    rulesEvaluated++;

    const conditions = (rule.conditions as unknown as RuleCondition[]) || [];
    const actions = (rule.actions as unknown as RuleAction[]) || [];

    const isMatch = evaluateRuleConditions(conditions, newData);

    if (isMatch) {
      await executeRuleActions(rule.id, actions, {
        workspaceId,
        taskId,
        depth,
      });
      rulesFired++;
    } else {
      // Record SKIPPED execution log
      await prisma.executionLog.create({
        data: {
          ruleId: rule.id,
          status: "SKIPPED",
          eventData: { taskId, triggerType, depth },
          result: { reason: "CONDITIONS_NOT_MET" },
        },
      });
    }
  }

  return { rulesEvaluated, rulesFired };
}

/**
 * Drains and executes pending jobs from the Upstash Redis automation queue.
 * Returns the number of jobs processed.
 */
export async function runQueueWorkerStep(): Promise<number> {
  const redis = getRedisClient();
  if (!redis) {
    return 0;
  }

  let jobsProcessed = 0;
  const maxBatchSize = 10;

  for (let i = 0; i < maxBatchSize; i++) {
    const rawJob = await redis.lpop<string>(AUTOMATION_QUEUE_KEY);
    if (!rawJob) {
      break;
    }

    try {
      const payload: RuleJobPayload =
        typeof rawJob === "string" ? JSON.parse(rawJob) : (rawJob as RuleJobPayload);
      await processAutomationJob(payload);
      jobsProcessed++;
    } catch (error) {
      console.error("[Automation Worker] Error processing queue job:", error);
    }
  }

  return jobsProcessed;
}
