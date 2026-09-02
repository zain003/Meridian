import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Redis & Prisma
const mockRPush = vi.fn();
const mockLPop = vi.fn();
const mockFindManyRules = vi.fn();
const mockCreateExecutionLog = vi.fn();
const mockFindUniqueTask = vi.fn();
const mockUpdateTask = vi.fn();

vi.mock("@/lib/redis", () => ({
  getRedisClient: vi.fn(() => ({
    rpush: (...args: unknown[]) => mockRPush(...args),
    lpop: (...args: unknown[]) => mockLPop(...args),
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    automationRule: {
      findMany: (...args: unknown[]) => mockFindManyRules(...args),
    },
    executionLog: {
      create: (...args: unknown[]) => mockCreateExecutionLog(...args),
    },
    task: {
      findUnique: (...args: unknown[]) => mockFindUniqueTask(...args),
      update: (...args: unknown[]) => mockUpdateTask(...args),
    },
    workspaceMember: {
      findUnique: vi.fn().mockResolvedValue({ id: "mem-1" }),
    },
    column: {
      findFirst: vi.fn().mockResolvedValue({ id: "col-done", name: "Done" }),
    },
    taskLabel: {
      upsert: vi.fn().mockResolvedValue({}),
    },
    notification: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { enqueueAutomationJob, AUTOMATION_QUEUE_KEY, type RuleJobPayload } from "@/lib/automation/queue";
import { processAutomationJob, runQueueWorkerStep } from "@/lib/automation/worker";

describe("Upstash Redis Queue & Background Worker (FEAT-005-INT)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUniqueTask.mockResolvedValue({
      id: "t-100",
      workspaceId: "ws-1",
      projectId: "proj-1",
      columnId: "col-todo",
    });
  });

  describe("1. enqueueAutomationJob (Producer)", () => {
    it("serializes and pushes job payload to Upstash Redis queue", async () => {
      const payload: RuleJobPayload = {
        workspaceId: "ws-1",
        triggerType: "TASK_CREATED",
        taskId: "t-100",
        newData: { title: "New Issue", priority: "HIGH" },
      };

      await enqueueAutomationJob(payload);

      expect(mockRPush).toHaveBeenCalledWith(
        AUTOMATION_QUEUE_KEY,
        JSON.stringify(payload)
      );
    });
  });

  describe("2. processAutomationJob (Rule Matcher & Executor)", () => {
    it("evaluates matching active rules, executes actions, and writes SUCCESS execution log", async () => {
      mockFindManyRules.mockResolvedValue([
        {
          id: "rule-auto-assign",
          workspaceId: "ws-1",
          triggerType: "TASK_CREATED",
          isActive: true,
          conditions: [{ field: "priority", operator: "EQUALS", value: "HIGH" }],
          actions: [{ type: "SET_PRIORITY", payload: { priority: "URGENT" } }],
        },
      ]);

      const result = await processAutomationJob({
        workspaceId: "ws-1",
        triggerType: "TASK_CREATED",
        taskId: "t-100",
        newData: { priority: "HIGH" },
      });

      expect(result.rulesEvaluated).toBe(1);
      expect(result.rulesFired).toBe(1);
      expect(mockUpdateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "t-100" },
          data: expect.objectContaining({ priority: "URGENT" }),
        })
      );
      expect(mockCreateExecutionLog).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ruleId: "rule-auto-assign",
            status: "SUCCESS",
          }),
        })
      );
    });

    it("writes SKIPPED execution log when rule conditions do not match", async () => {
      mockFindManyRules.mockResolvedValue([
        {
          id: "rule-urgent-only",
          workspaceId: "ws-1",
          triggerType: "TASK_CREATED",
          isActive: true,
          conditions: [{ field: "priority", operator: "EQUALS", value: "URGENT" }],
          actions: [{ type: "MOVE_COLUMN", payload: { columnId: "col-done" } }],
        },
      ]);

      const result = await processAutomationJob({
        workspaceId: "ws-1",
        triggerType: "TASK_CREATED",
        taskId: "t-100",
        newData: { priority: "LOW" }, // Mismatch
      });

      expect(result.rulesEvaluated).toBe(1);
      expect(result.rulesFired).toBe(0);
      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(mockCreateExecutionLog).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ruleId: "rule-urgent-only",
            status: "SKIPPED",
            result: { reason: "CONDITIONS_NOT_MET" },
          }),
        })
      );
    });
  });

  describe("3. runQueueWorkerStep (Consumer / Queue Drainer)", () => {
    it("pops jobs from Redis and processes them sequentially in batch", async () => {
      const job1: RuleJobPayload = {
        workspaceId: "ws-1",
        triggerType: "TASK_CREATED",
        taskId: "t-1",
        newData: { priority: "HIGH" },
      };
      const job2: RuleJobPayload = {
        workspaceId: "ws-1",
        triggerType: "TASK_STATUS_CHANGED",
        taskId: "t-2",
        newData: { columnId: "col-done" },
      };

      mockLPop
        .mockResolvedValueOnce(JSON.stringify(job1))
        .mockResolvedValueOnce(JSON.stringify(job2))
        .mockResolvedValueOnce(null);

      mockFindManyRules.mockResolvedValue([]);

      const jobsCount = await runQueueWorkerStep();

      expect(jobsCount).toBe(2);
      expect(mockLPop).toHaveBeenCalledTimes(3);
    });
  });
});
