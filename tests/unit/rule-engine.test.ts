import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockFindUniqueTask = vi.fn();
const mockUpdateTask = vi.fn();
const mockFindUniqueWorkspaceMember = vi.fn();
const mockFindFirstColumn = vi.fn();
const mockUpsertTaskLabel = vi.fn();
const mockCreateNotification = vi.fn();
const mockCreateExecutionLog = vi.fn();
const mockCreateAutomationRule = vi.fn();
const mockFindUniqueAutomationRule = vi.fn();
const mockUpdateAutomationRule = vi.fn();
const mockFindManyAutomationRule = vi.fn();
const mockDeleteAutomationRule = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findUnique: (...args: unknown[]) => mockFindUniqueTask(...args),
      update: (...args: unknown[]) => mockUpdateTask(...args),
    },
    workspaceMember: {
      findUnique: (...args: unknown[]) => mockFindUniqueWorkspaceMember(...args),
    },
    column: {
      findFirst: (...args: unknown[]) => mockFindFirstColumn(...args),
    },
    taskLabel: {
      upsert: (...args: unknown[]) => mockUpsertTaskLabel(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockCreateNotification(...args),
    },
    executionLog: {
      create: (...args: unknown[]) => mockCreateExecutionLog(...args),
    },
    automationRule: {
      create: (...args: unknown[]) => mockCreateAutomationRule(...args),
      findUnique: (...args: unknown[]) => mockFindUniqueAutomationRule(...args),
      update: (...args: unknown[]) => mockUpdateAutomationRule(...args),
      findMany: (...args: unknown[]) => mockFindManyAutomationRule(...args),
      delete: (...args: unknown[]) => mockDeleteAutomationRule(...args),
    },
  },
}));

// Mock RBAC
const mockRequireWorkspaceAccess = vi.fn();
vi.mock("@/lib/rbac", () => ({
  requireWorkspaceAccess: (...args: unknown[]) => mockRequireWorkspaceAccess(...args),
}));

import {
  evaluateCondition,
  evaluateRuleConditions,
} from "@/lib/automation/evaluator";
import {
  executeRuleActions,
  MAX_RECURSION_DEPTH,
} from "@/lib/automation/executor";
import {
  createRuleAction,
  toggleRuleAction,
  getWorkspaceRulesAction,
  deleteRuleAction,
  updateRuleAction,
} from "@/server/actions/automation";
import type { RuleCondition, RuleAction } from "@/lib/validations/automation";

describe("Automation Rule Engine (FEAT-005-BE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireWorkspaceAccess.mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.com" },
      role: "ADMIN",
    });
  });

  describe("1. Condition Evaluator (evaluateCondition)", () => {
    it("evaluates EQUALS operator correctly for strings, numbers, booleans, and nulls", () => {
      expect(
        evaluateCondition(
          { field: "priority", operator: "EQUALS", value: "HIGH" },
          { priority: "HIGH" }
        )
      ).toBe(true);

      expect(
        evaluateCondition(
          { field: "priority", operator: "EQUALS", value: "HIGH" },
          { priority: "LOW" }
        )
      ).toBe(false);

      expect(
        evaluateCondition(
          { field: "order", operator: "EQUALS", value: 3 },
          { order: 3 }
        )
      ).toBe(true);

      expect(
        evaluateCondition(
          { field: "assigneeId", operator: "EQUALS", value: null },
          { assigneeId: null }
        )
      ).toBe(true);
    });

    it("evaluates NOT_EQUALS operator correctly", () => {
      expect(
        evaluateCondition(
          { field: "priority", operator: "NOT_EQUALS", value: "LOW" },
          { priority: "URGENT" }
        )
      ).toBe(true);

      expect(
        evaluateCondition(
          { field: "priority", operator: "NOT_EQUALS", value: "URGENT" },
          { priority: "URGENT" }
        )
      ).toBe(false);
    });

    it("evaluates CONTAINS operator correctly", () => {
      expect(
        evaluateCondition(
          { field: "title", operator: "CONTAINS", value: "bug" },
          { title: "Fix login button bug on mobile" }
        )
      ).toBe(true);

      expect(
        evaluateCondition(
          { field: "title", operator: "CONTAINS", value: "feature" },
          { title: "Fix login button bug on mobile" }
        )
      ).toBe(false);
    });

    it("evaluates GREATER_THAN and LESS_THAN numerical and date comparisons", () => {
      expect(
        evaluateCondition(
          { field: "order", operator: "GREATER_THAN", value: 5 },
          { order: 10 }
        )
      ).toBe(true);

      expect(
        evaluateCondition(
          { field: "order", operator: "LESS_THAN", value: 5 },
          { order: 10 }
        )
      ).toBe(false);

      const pastDate = "2026-01-01T00:00:00.000Z";
      const futureDate = "2026-12-31T00:00:00.000Z";

      expect(
        evaluateCondition(
          { field: "dueDate", operator: "LESS_THAN", value: futureDate },
          { dueDate: pastDate }
        )
      ).toBe(true);
    });

    it("evaluates IS_EMPTY and IS_NOT_EMPTY correctly", () => {
      expect(
        evaluateCondition(
          { field: "assigneeId", operator: "IS_EMPTY", value: null },
          { assigneeId: null }
        )
      ).toBe(true);

      expect(
        evaluateCondition(
          { field: "assigneeId", operator: "IS_EMPTY", value: null },
          { assigneeId: "user-123" }
        )
      ).toBe(false);

      expect(
        evaluateCondition(
          { field: "assigneeId", operator: "IS_NOT_EMPTY", value: null },
          { assigneeId: "user-123" }
        )
      ).toBe(true);
    });
  });

  describe("2. Multiple Conditions Evaluation (evaluateRuleConditions)", () => {
    it("returns true when all conditions match (logical AND)", () => {
      const conditions: RuleCondition[] = [
        { field: "priority", operator: "EQUALS", value: "HIGH" },
        { field: "title", operator: "CONTAINS", value: "Security" },
      ];

      expect(
        evaluateRuleConditions(conditions, {
          priority: "HIGH",
          title: "Critical Security Audit",
        })
      ).toBe(true);
    });

    it("returns false if any condition fails", () => {
      const conditions: RuleCondition[] = [
        { field: "priority", operator: "EQUALS", value: "HIGH" },
        { field: "title", operator: "CONTAINS", value: "Security" },
      ];

      expect(
        evaluateRuleConditions(conditions, {
          priority: "LOW",
          title: "Critical Security Audit",
        })
      ).toBe(false);
    });

    it("returns true when condition list is empty", () => {
      expect(evaluateRuleConditions([], { title: "Any Task" })).toBe(true);
    });
  });

  describe("3. Action Executor & Recursion Guard (executeRuleActions)", () => {
    const mockTask = {
      id: "t-100",
      workspaceId: "ws-1",
      projectId: "proj-1",
      columnId: "col-todo",
    };

    it("aborts execution and logs SKIPPED when recursion depth > 3", async () => {
      const res = await executeRuleActions(
        "rule-1",
        [{ type: "MOVE_COLUMN", payload: { columnId: "col-done" } }],
        {
          workspaceId: "ws-1",
          taskId: "t-100",
          depth: MAX_RECURSION_DEPTH + 1,
        }
      );

      expect(res.success).toBe(false);
      expect(res.error).toBe("MAX_DEPTH_EXCEEDED");
      expect(mockCreateExecutionLog).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ruleId: "rule-1",
            status: "SKIPPED",
            error: expect.stringContaining("MAX_DEPTH_EXCEEDED"),
          }),
        })
      );
      expect(mockUpdateTask).not.toHaveBeenCalled();
    });

    it("executes MOVE_COLUMN, ASSIGN_USER, SET_PRIORITY, and ADD_LABEL actions", async () => {
      mockFindUniqueTask.mockResolvedValue(mockTask);
      mockFindFirstColumn.mockResolvedValue({ id: "col-done", name: "Done" });
      mockFindUniqueWorkspaceMember.mockResolvedValue({ id: "mem-1" });
      mockUpsertTaskLabel.mockResolvedValue({ taskId: "t-100", labelId: "lbl-1" });

      const actions: RuleAction[] = [
        { type: "MOVE_COLUMN", payload: { columnId: "col-done" } },
        { type: "ASSIGN_USER", payload: { userId: "user-target" } },
        { type: "SET_PRIORITY", payload: { priority: "URGENT" } },
        { type: "ADD_LABEL", payload: { labelId: "lbl-1" } },
        {
          type: "SEND_NOTIFICATION",
          payload: { userId: "user-target", title: "Task Assigned", message: "You were assigned." },
        },
      ];

      const res = await executeRuleActions("rule-1", actions, {
        workspaceId: "ws-1",
        taskId: "t-100",
        depth: 0,
      });

      expect(res.success).toBe(true);
      expect(mockUpdateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "t-100" },
          data: expect.objectContaining({ columnId: "col-done" }),
        })
      );
      expect(mockUpdateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "t-100" },
          data: expect.objectContaining({ assigneeId: "user-target" }),
        })
      );
      expect(mockUpdateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "t-100" },
          data: expect.objectContaining({ priority: "URGENT" }),
        })
      );
      expect(mockUpsertTaskLabel).toHaveBeenCalled();
      expect(mockCreateNotification).toHaveBeenCalled();
      expect(mockCreateExecutionLog).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ruleId: "rule-1",
            status: "SUCCESS",
          }),
        })
      );
    });

    it("records FAILED execution log when target task does not exist", async () => {
      mockFindUniqueTask.mockResolvedValue(null);

      const res = await executeRuleActions(
        "rule-1",
        [{ type: "SET_PRIORITY", payload: { priority: "HIGH" } }],
        {
          workspaceId: "ws-1",
          taskId: "t-nonexistent",
        }
      );

      expect(res.success).toBe(false);
      expect(mockCreateExecutionLog).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ruleId: "rule-1",
            status: "FAILED",
          }),
        })
      );
    });
  });

  describe("4. Rule CRUD Server Actions", () => {
    it("creates an automation rule for workspace ADMIN", async () => {
      mockCreateAutomationRule.mockResolvedValue({ id: "rule-new-1" });

      const res = await createRuleAction({
        workspaceId: "ws-1",
        name: "Auto Move Done",
        description: "Move completed tasks",
        triggerType: "TASK_STATUS_CHANGED",
        conditions: [{ field: "status", operator: "EQUALS", value: "Done" }],
        actions: [{ type: "SET_PRIORITY", payload: { priority: "LOW" } }],
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data?.ruleId).toBe("rule-new-1");
      }
      expect(mockRequireWorkspaceAccess).toHaveBeenCalledWith("ws-1", "ADMIN");
    });

    it("rejects rule creation if user lacks ADMIN permissions (FORBIDDEN)", async () => {
      mockRequireWorkspaceAccess.mockRejectedValue(new Error("FORBIDDEN"));

      const res = await createRuleAction({
        workspaceId: "ws-1",
        name: "Auto Move Done",
        triggerType: "TASK_STATUS_CHANGED",
        conditions: [],
        actions: [{ type: "SET_PRIORITY", payload: { priority: "LOW" } }],
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("FORBIDDEN");
      }
    });

    it("toggles rule active state", async () => {
      mockFindUniqueAutomationRule.mockResolvedValue({ id: "rule-1", workspaceId: "ws-1" });
      mockUpdateAutomationRule.mockResolvedValue({ id: "rule-1", isActive: false });

      const res = await toggleRuleAction("rule-1", false);

      expect(res.success).toBe(true);
      expect(mockUpdateAutomationRule).toHaveBeenCalledWith({
        where: { id: "rule-1" },
        data: { isActive: false },
      });
    });

    it("fetches workspace rules with execution logs for MEMBER role", async () => {
      mockFindManyAutomationRule.mockResolvedValue([
        { id: "rule-1", name: "Rule 1", logs: [] },
      ]);

      const res = await getWorkspaceRulesAction("ws-1");

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(1);
      }
      expect(mockRequireWorkspaceAccess).toHaveBeenCalledWith("ws-1", "MEMBER");
    });

    it("deletes automation rule for workspace ADMIN", async () => {
      mockFindUniqueAutomationRule.mockResolvedValue({ id: "rule-1", workspaceId: "ws-1" });
      mockDeleteAutomationRule.mockResolvedValue({ id: "rule-1" });

      const res = await deleteRuleAction("rule-1");

      expect(res.success).toBe(true);
      expect(mockDeleteAutomationRule).toHaveBeenCalledWith({
        where: { id: "rule-1" },
      });
    });

    it("updates an existing rule configuration", async () => {
      mockFindUniqueAutomationRule.mockResolvedValue({ id: "rule-1", workspaceId: "ws-1" });
      mockUpdateAutomationRule.mockResolvedValue({ id: "rule-1" });

      const res = await updateRuleAction({
        ruleId: "rule-1",
        name: "Renamed Rule",
      });

      expect(res.success).toBe(true);
      expect(mockUpdateAutomationRule).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "rule-1" },
          data: expect.objectContaining({ name: "Renamed Rule" }),
        })
      );
    });
  });
});
