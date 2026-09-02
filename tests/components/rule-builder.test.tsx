// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock Server Actions
const mockCreateRuleAction = vi.fn();
const mockToggleRuleAction = vi.fn();
const mockDeleteRuleAction = vi.fn();

vi.mock("@/server/actions/automation", () => ({
  createRuleAction: (...args: unknown[]) => mockCreateRuleAction(...args),
  toggleRuleAction: (...args: unknown[]) => mockToggleRuleAction(...args),
  deleteRuleAction: (...args: unknown[]) => mockDeleteRuleAction(...args),
}));

// Mock Upstash Redis and Prisma for Worker Tests
const mockRPush = vi.fn();
const mockLPop = vi.fn();
const mockFindManyAutomationRule = vi.fn();
const mockCreateExecutionLog = vi.fn();

vi.mock("@/lib/redis", () => ({
  getRedisClient: vi.fn(() => ({
    rpush: (...args: unknown[]) => mockRPush(...args),
    lpop: (...args: unknown[]) => mockLPop(...args),
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    automationRule: {
      findMany: (...args: unknown[]) => mockFindManyAutomationRule(...args),
    },
    executionLog: {
      create: (...args: unknown[]) => mockCreateExecutionLog(...args),
    },
    task: {
      findUnique: vi.fn().mockResolvedValue({ id: "t-1", workspaceId: "ws-1", projectId: "p-1" }),
      update: vi.fn().mockResolvedValue({ id: "t-1" }),
    },
  },
}));

import { RuleList } from "@/components/automation/rule-list";
import { ExecutionLogDrawer } from "@/components/automation/execution-log-drawer";
import { RuleBuilderDialog } from "@/components/automation/rule-builder-dialog";
import { enqueueAutomationJob, type RuleJobPayload } from "@/lib/automation/queue";
import { processAutomationJob, runQueueWorkerStep } from "@/lib/automation/worker";
import type { AutomationRule, ExecutionLog } from "@prisma/client";

describe("Automation Rule Builder & Queue Worker (FEAT-005-FE / INT)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateRuleAction.mockResolvedValue({ success: true, data: { ruleId: "rule-1" } });
    mockToggleRuleAction.mockResolvedValue({ success: true });
    mockDeleteRuleAction.mockResolvedValue({ success: true });
  });

  const mockRules: Array<AutomationRule & { logs: ExecutionLog[] }> = [
    {
      id: "rule-1",
      workspaceId: "ws-1",
      name: "Auto-escalate High Priority",
      description: "Escalate urgent bug reports",
      triggerType: "TASK_CREATED",
      triggerData: {},
      conditions: [{ field: "priority", operator: "EQUALS", value: "HIGH" }],
      actions: [{ type: "SET_PRIORITY", payload: { priority: "URGENT" } }],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      logs: [
        {
          id: "log-1",
          ruleId: "rule-1",
          status: "SUCCESS",
          eventData: { taskId: "t-10" },
          result: { actionsExecuted: 1 },
          error: null,
          firedAt: new Date("2026-09-02T12:00:00Z"),
        },
      ],
    },
  ];

  describe("RuleList Component", () => {
    it("renders rule name, trigger badge, and active toggle switch", () => {
      render(<RuleList workspaceId="ws-1" initialRules={mockRules} />);

      expect(screen.getByText("Auto-escalate High Priority")).toBeInTheDocument();
      expect(screen.getByText("TASK CREATED")).toBeInTheDocument();
      expect(screen.getByText("1 Action")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders empty state when workspace has no rules", () => {
      render(<RuleList workspaceId="ws-1" initialRules={[]} />);

      expect(screen.getByText("No Automations Configured")).toBeInTheDocument();
    });

    it("toggles rule switch and triggers toggleRuleAction", async () => {
      render(<RuleList workspaceId="ws-1" initialRules={mockRules} />);

      const toggleSwitch = screen.getByRole("switch");
      fireEvent.click(toggleSwitch);

      await waitFor(() => {
        expect(mockToggleRuleAction).toHaveBeenCalledWith("rule-1", false);
      });
    });
  });

  describe("ExecutionLogDrawer Component", () => {
    it("renders execution log with SUCCESS status and formatted details", () => {
      render(
        <ExecutionLogDrawer
          rule={mockRules[0]}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Execution Audit Trail")).toBeInTheDocument();
      expect(screen.getByText("SUCCESS")).toBeInTheDocument();
      expect(screen.getByText(/eventData/)).toBeInTheDocument();
    });
  });

  describe("RuleBuilderDialog Component", () => {
    it("opens dialog, fills required inputs, and submits new rule", async () => {
      const onCreated = vi.fn();
      render(<RuleBuilderDialog workspaceId="ws-1" onRuleCreated={onCreated} />);

      // Open Dialog
      const openBtn = screen.getByText("New Automation Rule");
      fireEvent.click(openBtn);

      expect(screen.getByText("Create Custom Automation Rule")).toBeInTheDocument();

      // Enter Rule Name
      const nameInput = screen.getByPlaceholderText(/Auto-escalate urgent bugs/i);
      fireEvent.change(nameInput, { target: { value: "Move Done Tasks" } });

      // Submit
      const submitBtn = screen.getByText("Save Automation Rule");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateRuleAction).toHaveBeenCalledWith(
          expect.objectContaining({
            workspaceId: "ws-1",
            name: "Move Done Tasks",
          })
        );
        expect(onCreated).toHaveBeenCalled();
      });
    });
  });

  describe("Upstash Redis Queue & Worker Integration (FEAT-005-INT)", () => {
    it("enqueues automation job payload to Upstash Redis", async () => {
      const payload: RuleJobPayload = {
        workspaceId: "ws-1",
        triggerType: "TASK_CREATED",
        taskId: "t-1",
        newData: { id: "t-1", priority: "HIGH" },
      };

      await enqueueAutomationJob(payload);

      expect(mockRPush).toHaveBeenCalledWith(
        "meridian:automation:queue",
        JSON.stringify(payload)
      );
    });

    it("evaluates rules in processAutomationJob and records SUCCESS when conditions pass", async () => {
      mockFindManyAutomationRule.mockResolvedValue([
        {
          id: "rule-1",
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
        taskId: "t-1",
        newData: { id: "t-1", priority: "HIGH" },
      });

      expect(result.rulesEvaluated).toBe(1);
      expect(result.rulesFired).toBe(1);
    });

    it("records SKIPPED in executionLog when rule conditions do not match", async () => {
      mockFindManyAutomationRule.mockResolvedValue([
        {
          id: "rule-1",
          workspaceId: "ws-1",
          triggerType: "TASK_CREATED",
          isActive: true,
          conditions: [{ field: "priority", operator: "EQUALS", value: "URGENT" }],
          actions: [{ type: "SET_PRIORITY", payload: { priority: "LOW" } }],
        },
      ]);

      const result = await processAutomationJob({
        workspaceId: "ws-1",
        triggerType: "TASK_CREATED",
        taskId: "t-1",
        newData: { id: "t-1", priority: "LOW" }, // Mismatch
      });

      expect(result.rulesEvaluated).toBe(1);
      expect(result.rulesFired).toBe(0);
      expect(mockCreateExecutionLog).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ruleId: "rule-1",
            status: "SKIPPED",
          }),
        })
      );
    });

    it("drains queue batch in runQueueWorkerStep", async () => {
      mockLPop
        .mockResolvedValueOnce(
          JSON.stringify({
            workspaceId: "ws-1",
            triggerType: "TASK_CREATED",
            taskId: "t-1",
            newData: { id: "t-1" },
          })
        )
        .mockResolvedValueOnce(null);

      mockFindManyAutomationRule.mockResolvedValue([]);

      const count = await runQueueWorkerStep();
      expect(count).toBe(1);
    });
  });
});
