import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateVelocityMetrics,
  calculateCycleTimeMetrics,
  calculateWorkloadMetrics,
  calculateMetricsFromData,
  getWorkspaceAnalytics,
  type TaskMetricItem,
  type WorkspaceMemberMetricItem,
} from "@/lib/analytics/metrics";
import { getWorkspaceAnalyticsAction } from "@/server/actions/analytics";
import { prisma } from "@/lib/prisma";
import * as rbac from "@/lib/rbac";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
    },
    workspaceMember: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/rbac", () => ({
  requireWorkspaceAccess: vi.fn(),
}));

describe("Analytics Metrics & Engine (FEAT-008-BE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Velocity Calculation", () => {
    it("TC-ANA-VEL-01: correctly counts tasks completed and created within date intervals", () => {
      const baseDate = new Date("2026-08-01T00:00:00.000Z");
      const endDate = new Date("2026-08-29T00:00:00.000Z"); // 28 days -> 4 intervals of 7 days

      const tasks: TaskMetricItem[] = [
        // Interval 1: Aug 1 - Aug 8
        {
          id: "task-1",
          createdAt: new Date("2026-08-02T10:00:00.000Z"),
          completedAt: new Date("2026-08-05T10:00:00.000Z"),
          assigneeId: "user-1",
        },
        {
          id: "task-2",
          createdAt: new Date("2026-08-03T10:00:00.000Z"),
          completedAt: null,
          assigneeId: "user-1",
        },
        // Interval 2: Aug 8 - Aug 15
        {
          id: "task-3",
          createdAt: new Date("2026-08-10T10:00:00.000Z"),
          completedAt: new Date("2026-08-12T10:00:00.000Z"),
          assigneeId: "user-2",
        },
        // Interval 3: Aug 15 - Aug 22 (Task created in interval 1, completed in interval 3)
        {
          id: "task-4",
          createdAt: new Date("2026-08-04T10:00:00.000Z"),
          completedAt: new Date("2026-08-18T10:00:00.000Z"),
          assigneeId: "user-2",
        },
        // Interval 4: Aug 22 - Aug 29
        {
          id: "task-5",
          createdAt: new Date("2026-08-25T10:00:00.000Z"),
          completedAt: new Date("2026-08-28T10:00:00.000Z"),
          assigneeId: "user-1",
        },
      ];

      const velocity = calculateVelocityMetrics(tasks, baseDate, endDate);

      expect(velocity).toHaveLength(4);
      // Interval 1: created task-1, task-2, task-4 (3), completed task-1 (1)
      expect(velocity[0]).toEqual({
        interval: "Week 1",
        createdTasks: 3,
        completedTasks: 1,
      });
      // Interval 2: created task-3 (1), completed task-3 (1)
      expect(velocity[1]).toEqual({
        interval: "Week 2",
        createdTasks: 1,
        completedTasks: 1,
      });
      // Interval 3: created 0, completed task-4 (1)
      expect(velocity[2]).toEqual({
        interval: "Week 3",
        createdTasks: 0,
        completedTasks: 1,
      });
      // Interval 4: created task-5 (1), completed task-5 (1)
      expect(velocity[3]).toEqual({
        interval: "Week 4",
        createdTasks: 1,
        completedTasks: 1,
      });
    });

    it("TC-ANA-VEL-02: fills missing date intervals with zero counts when there is no activity", () => {
      const baseDate = new Date("2026-08-01T00:00:00.000Z");
      const endDate = new Date("2026-08-29T00:00:00.000Z");

      const tasks: TaskMetricItem[] = []; // Empty workspace activity

      const velocity = calculateVelocityMetrics(tasks, baseDate, endDate);

      expect(velocity).toHaveLength(4);
      for (const item of velocity) {
        expect(item.createdTasks).toBe(0);
        expect(item.completedTasks).toBe(0);
      }
    });
  });

  describe("2. Cycle Time Calculation", () => {
    it("TC-ANA-CYC-01: computes accurate average and median hours for completed tasks", () => {
      const tasks: TaskMetricItem[] = [
        // Duration: 10 hours
        {
          id: "t1",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: new Date("2026-08-01T10:00:00.000Z"),
          assigneeId: "user-1",
        },
        // Duration: 30 hours
        {
          id: "t2",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: new Date("2026-08-02T06:00:00.000Z"),
          assigneeId: "user-1",
        },
        // Duration: 50 hours
        {
          id: "t3",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: new Date("2026-08-03T02:00:00.000Z"),
          assigneeId: "user-2",
        },
        // Uncompleted task (must be excluded from cycle time)
        {
          id: "t4",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: null,
          assigneeId: "user-2",
        },
      ];

      const cycleTime = calculateCycleTimeMetrics(tasks);

      // Average: (10 + 30 + 50) / 3 = 30.0 hours
      expect(cycleTime.averageHours).toBe(30.0);
      // Median: middle element of [10, 30, 50] = 30.0 hours
      expect(cycleTime.medianHours).toBe(30.0);
    });

    it("TC-ANA-CYC-02: categorizes tasks into correct distribution buckets", () => {
      const tasks: TaskMetricItem[] = [
        // < 24h (12 hours)
        {
          id: "t1",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: new Date("2026-08-01T12:00:00.000Z"),
          assigneeId: null,
        },
        // 1-3 days (48 hours)
        {
          id: "t2",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: new Date("2026-08-03T00:00:00.000Z"),
          assigneeId: null,
        },
        // 3-7 days (100 hours)
        {
          id: "t3",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: new Date("2026-08-05T04:00:00.000Z"),
          assigneeId: null,
        },
        // 1-2 weeks (200 hours)
        {
          id: "t4",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: new Date("2026-08-09T08:00:00.000Z"),
          assigneeId: null,
        },
        // > 2 weeks (400 hours)
        {
          id: "t5",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: new Date("2026-08-17T16:00:00.000Z"),
          assigneeId: null,
        },
      ];

      const cycleTime = calculateCycleTimeMetrics(tasks);

      expect(cycleTime.distribution).toEqual([
        { range: "< 24h", count: 1 },
        { range: "1-3 days", count: 1 },
        { range: "3-7 days", count: 1 },
        { range: "1-2 weeks", count: 1 },
        { range: "> 2 weeks", count: 1 },
      ]);
    });

    it("TC-ANA-CYC-03: returns zero hours without division by zero when no tasks are completed", () => {
      const tasks: TaskMetricItem[] = [
        {
          id: "t1",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: null,
          assigneeId: "user-1",
        },
        {
          id: "t2",
          createdAt: new Date("2026-08-02T00:00:00.000Z"),
          completedAt: null,
          assigneeId: "user-2",
        },
      ];

      const cycleTime = calculateCycleTimeMetrics(tasks);

      expect(cycleTime.averageHours).toBe(0);
      expect(cycleTime.medianHours).toBe(0);
      expect(cycleTime.distribution).toEqual([
        { range: "< 24h", count: 0 },
        { range: "1-3 days", count: 0 },
        { range: "3-7 days", count: 0 },
        { range: "1-2 weeks", count: 0 },
        { range: "> 2 weeks", count: 0 },
      ]);
    });
  });

  describe("3. Workload Distribution", () => {
    it("TC-ANA-WRK-01: summarizes active, in-progress, and completed tasks per member", () => {
      const members: WorkspaceMemberMetricItem[] = [
        {
          userId: "user-1",
          user: {
            id: "user-1",
            name: "Alice Smith",
            email: "alice@example.com",
            image: "https://avatar.com/alice.png",
          },
        },
        {
          userId: "user-2",
          user: {
            id: "user-2",
            name: "Bob Jones",
            email: "bob@example.com",
            image: null,
          },
        },
      ];

      const tasks: TaskMetricItem[] = [
        // Alice: 1 completed, 1 in-progress, 1 backlog = 3 assigned
        {
          id: "t1",
          createdAt: new Date(),
          completedAt: new Date(),
          assigneeId: "user-1",
          column: { id: "col-5", name: "Done" },
        },
        {
          id: "t2",
          createdAt: new Date(),
          completedAt: null,
          assigneeId: "user-1",
          column: { id: "col-3", name: "In Progress" },
        },
        {
          id: "t3",
          createdAt: new Date(),
          completedAt: null,
          assigneeId: "user-1",
          column: { id: "col-1", name: "Backlog" },
        },
        // Bob: 1 in-progress = 1 assigned
        {
          id: "t4",
          createdAt: new Date(),
          completedAt: null,
          assigneeId: "user-2",
          column: { id: "col-3", name: "In Progress" },
        },
      ];

      const workload = calculateWorkloadMetrics(tasks, members);

      expect(workload).toHaveLength(2);
      // Alice has 3 assigned, sorted first
      expect(workload[0]).toEqual({
        userId: "user-1",
        userName: "Alice Smith",
        userAvatar: "https://avatar.com/alice.png",
        assignedCount: 3,
        inProgressCount: 1,
        completedCount: 1,
      });
      // Bob has 1 assigned
      expect(workload[1]).toEqual({
        userId: "user-2",
        userName: "Bob Jones",
        userAvatar: null,
        assignedCount: 1,
        inProgressCount: 1,
        completedCount: 0,
      });
    });

    it("TC-ANA-WRK-02: aggregates unassigned tasks under an Unassigned bucket", () => {
      const members: WorkspaceMemberMetricItem[] = [
        {
          userId: "user-1",
          user: {
            id: "user-1",
            name: "Alice",
            email: "alice@example.com",
            image: null,
          },
        },
      ];

      const tasks: TaskMetricItem[] = [
        {
          id: "t1",
          createdAt: new Date(),
          completedAt: null,
          assigneeId: "user-1",
          column: { id: "col-2", name: "Todo" },
        },
        {
          id: "t2",
          createdAt: new Date(),
          completedAt: null,
          assigneeId: null,
          column: { id: "col-3", name: "In Progress" },
        },
        {
          id: "t3",
          createdAt: new Date(),
          completedAt: new Date(),
          assigneeId: null,
          column: { id: "col-5", name: "Done" },
        },
      ];

      const workload = calculateWorkloadMetrics(tasks, members);

      expect(workload).toHaveLength(2);
      const unassigned = workload.find((w) => w.userId === "unassigned");
      expect(unassigned).toBeDefined();
      expect(unassigned).toEqual({
        userId: "unassigned",
        userName: "Unassigned",
        userAvatar: null,
        assignedCount: 2,
        inProgressCount: 1,
        completedCount: 1,
      });
    });
  });

  describe("4. Database Scoping & Aggregation Query", () => {
    it("TC-ANA-SCP-01: scopes queries strictly to workspaceId and optional projectId", async () => {
      const mockTasks = [
        {
          id: "t1",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: new Date("2026-08-02T00:00:00.000Z"),
          assigneeId: "user-1",
          assignee: { id: "user-1", name: "User One", email: "u1@test.com", image: null },
          column: { id: "col-1", name: "Done", order: 4 },
        },
      ];
      const mockMembers = [
        {
          userId: "user-1",
          user: { id: "user-1", name: "User One", email: "u1@test.com", image: null },
        },
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);
      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue(mockMembers as never);

      const summary = await getWorkspaceAnalytics({
        workspaceId: "ws-test-1",
        projectId: "proj-123",
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: "ws-test-1",
            projectId: "proj-123",
          }),
        })
      );
      expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-test-1" },
        select: expect.anything(),
      });

      expect(summary.totalTasks).toBe(1);
      expect(summary.completedTasks).toBe(1);
      expect(summary.cycleTime.averageHours).toBe(24);
      expect(summary.workload[0].userName).toBe("User One");
    });

    it("TC-ANA-SCP-02: computes complete AnalyticsSummary from raw task and member collections", () => {
      const mockTasks: TaskMetricItem[] = [
        {
          id: "t1",
          createdAt: new Date("2026-08-01T00:00:00.000Z"),
          completedAt: new Date("2026-08-02T00:00:00.000Z"),
          assigneeId: "user-1",
          column: { id: "col-1", name: "Done" },
        },
      ];
      const mockMembers: WorkspaceMemberMetricItem[] = [
        {
          userId: "user-1",
          user: { id: "user-1", name: "User One", email: "u1@test.com", image: null },
        },
      ];

      const summary = calculateMetricsFromData(mockTasks, mockMembers);

      expect(summary.totalTasks).toBe(1);
      expect(summary.completedTasks).toBe(1);
      expect(summary.velocity.length).toBeGreaterThan(0);
      expect(summary.cycleTime.averageHours).toBe(24);
      expect(summary.workload.length).toBe(1);
    });
  });

  describe("5. Server Action (getWorkspaceAnalyticsAction)", () => {
    it("TC-ANA-ACT-01: enforces requireWorkspaceAccess with VIEWER role", async () => {
      vi.mocked(rbac.requireWorkspaceAccess).mockResolvedValue({
        user: { id: "user-viewer", email: "viewer@test.com", name: "Viewer User" },
        role: "VIEWER",
      });

      vi.mocked(prisma.task.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([] as never);

      const response = await getWorkspaceAnalyticsAction({
        workspaceId: "ws-test-1",
      });

      expect(rbac.requireWorkspaceAccess).toHaveBeenCalledWith("ws-test-1", "VIEWER");
      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data.totalTasks).toBe(0);
        expect(response.data.completedTasks).toBe(0);
      }
    });

    it("TC-ANA-ACT-02: returns UNAUTHORIZED when session is missing", async () => {
      vi.mocked(rbac.requireWorkspaceAccess).mockRejectedValue(new Error("UNAUTHORIZED"));

      const response = await getWorkspaceAnalyticsAction({
        workspaceId: "ws-test-1",
      });

      expect(response).toEqual({
        success: false,
        error: "UNAUTHORIZED",
      });
    });

    it("TC-ANA-ACT-03: returns FORBIDDEN when user lacks workspace membership", async () => {
      vi.mocked(rbac.requireWorkspaceAccess).mockRejectedValue(new Error("FORBIDDEN"));

      const response = await getWorkspaceAnalyticsAction({
        workspaceId: "ws-test-1",
      });

      expect(response).toEqual({
        success: false,
        error: "FORBIDDEN",
      });
    });

    it("TC-ANA-ACT-04: returns validation field errors on missing workspaceId", async () => {
      const response = await getWorkspaceAnalyticsAction({
        workspaceId: "",
      });

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toBe("Invalid analytics filter parameters");
        expect(response.fieldErrors?.workspaceId).toBeDefined();
      }
    });
  });
});
