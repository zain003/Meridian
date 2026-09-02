import { getRedisClient } from "@/lib/redis";
import type { RuleTriggerType } from "@/lib/validations/automation";
import { processAutomationJob } from "@/lib/automation/worker";

export const AUTOMATION_QUEUE_KEY = "meridian:automation:queue";

export interface RuleJobPayload {
  workspaceId: string;
  triggerType: RuleTriggerType;
  taskId: string;
  previousData?: Record<string, unknown>;
  newData: Record<string, unknown>;
  depth?: number;
}

/**
 * Enqueues an automation job to Upstash Redis for asynchronous execution.
 * Falls back to direct async execution if Redis is unavailable.
 */
export async function enqueueAutomationJob(payload: RuleJobPayload): Promise<void> {
  try {
    const redis = getRedisClient();

    if (redis) {
      await redis.rpush(AUTOMATION_QUEUE_KEY, JSON.stringify(payload));
    } else {
      // In-process async execution fallback
      void processAutomationJob(payload).catch((err) => {
        console.error("[Automation Engine] Fallback execution error:", err);
      });
    }
  } catch (error) {
    console.error("[Automation Engine] Failed to enqueue job, running fallback:", error);
    void processAutomationJob(payload).catch((err) => {
      console.error("[Automation Engine] Fallback execution error after enqueue failure:", err);
    });
  }
}
