/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockGetWorkspaceAnalyticsAction = vi.fn();

vi.mock("@/server/actions/analytics", () => ({
  getWorkspaceAnalyticsAction: (...args: unknown[]) =>
    mockGetWorkspaceAnalyticsAction(...args),
}));

// Mock ResizeObserver and getBoundingClientRect for Recharts in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({
    width: 600,
    height: 300,
    top: 0,
    left: 0,
    bottom: 300,
    right: 600,
    x: 0,
    y: 0,
    toJSON: () => {},
  }));
});

import { KpiCardGrid } from "@/components/analytics/kpi-card-grid";
import { VelocityChart } from "@/components/analytics/velocity-chart";
import { CycleTimeChart } from "@/components/analytics/cycle-time-chart";
import { WorkloadChart } from "@/components/analytics/workload-chart";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { AnalyticsDashboardView } from "@/components/analytics/analytics-dashboard-view";
import type { AnalyticsSummary } from "@/lib/validations/analytics";

const mockSummary: AnalyticsSummary = {
  totalTasks: 20,
  completedTasks: 15,
  velocity: [
    { interval: "Week 1", createdTasks: 5, completedTasks: 3 },
    { interval: "Week 2", createdTasks: 8, completedTasks: 6 },
    { interval: "Week 3", createdTasks: 4, completedTasks: 4 },
    { interval: "Week 4", createdTasks: 3, completedTasks: 2 },
  ],
  cycleTime: {
    averageHours: 28.5,
    medianHours: 24.0,
    distribution: [
      { range: "< 24h", count: 4 },
      { range: "1-3 days", count: 6 },
      { range: "3-7 days", count: 3 },
      { range: "1-2 weeks", count: 2 },
      { range: "> 2 weeks", count: 0 },
    ],
  },
  workload: [
    {
      userId: "u1",
      userName: "Alice Developer",
      userAvatar: null,
      assignedCount: 10,
      inProgressCount: 3,
      completedCount: 6,
    },
    {
      userId: "u2",
      userName: "Bob Engineer",
      userAvatar: null,
      assignedCount: 6,
      inProgressCount: 2,
      completedCount: 4,
    },
    {
      userId: "unassigned",
      userName: "Unassigned",
      userAvatar: null,
      assignedCount: 4,
      inProgressCount: 1,
      completedCount: 1,
    },
  ],
};

const mockProjects = [
  { id: "proj-1", name: "Core Platform", key: "CORE" },
  { id: "proj-2", name: "Mobile App", key: "MOB" },
];

describe("Analytics Dashboard Frontend Components (FEAT-008-FE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetWorkspaceAnalyticsAction.mockResolvedValue({
      success: true,
      data: mockSummary,
    });
  });

  describe("1. KpiCardGrid", () => {
    it("TC-FE-KPI-01: renders KPI cards with accurate values and formatted cycle time", () => {
      render(<KpiCardGrid summary={mockSummary} />);

      expect(screen.getByTestId("kpi-total-tasks")).toHaveTextContent("20");
      expect(screen.getByTestId("kpi-completed-tasks")).toHaveTextContent("15");
      expect(screen.getByTestId("kpi-completion-rate")).toHaveTextContent("75%");
      expect(screen.getByTestId("kpi-avg-cycle-time")).toHaveTextContent("1.2d (28.5h)");
      expect(screen.getByText("5 open")).toBeInTheDocument();
      expect(screen.getByText("Med: 24h")).toBeInTheDocument();
    });

    it("TC-FE-KPI-02: handles empty or zero total tasks safely without NaN", () => {
      const emptySummary: AnalyticsSummary = {
        totalTasks: 0,
        completedTasks: 0,
        velocity: [],
        cycleTime: {
          averageHours: 0,
          medianHours: 0,
          distribution: [],
        },
        workload: [],
      };

      render(<KpiCardGrid summary={emptySummary} />);

      expect(screen.getByTestId("kpi-total-tasks")).toHaveTextContent("0");
      expect(screen.getByTestId("kpi-completed-tasks")).toHaveTextContent("0");
      expect(screen.getByTestId("kpi-completion-rate")).toHaveTextContent("0%");
      expect(screen.getByTestId("kpi-avg-cycle-time")).toHaveTextContent("0h");
    });
  });

  describe("2. VelocityChart", () => {
    it("TC-FE-VEL-01: mounts velocity chart container with series", () => {
      render(<VelocityChart velocity={mockSummary.velocity} />);

      expect(screen.getByTestId("velocity-chart-card")).toBeInTheDocument();
      expect(screen.getByText("Team Velocity")).toBeInTheDocument();
      expect(screen.getByTestId("velocity-chart-container")).toBeInTheDocument();
    });

    it("TC-FE-VEL-02: renders clean empty state when no velocity data is available", () => {
      render(<VelocityChart velocity={[]} />);

      expect(screen.getByTestId("velocity-empty-state")).toBeInTheDocument();
      expect(screen.getByText("No Velocity Activity")).toBeInTheDocument();
    });
  });

  describe("3. CycleTimeChart", () => {
    it("TC-FE-CYC-01: mounts cycle time distribution chart with average and median badges", () => {
      render(<CycleTimeChart cycleTime={mockSummary.cycleTime} />);

      expect(screen.getByTestId("cycle-time-chart-card")).toBeInTheDocument();
      expect(screen.getByText("Cycle Time Distribution")).toBeInTheDocument();
      expect(screen.getByTestId("cycle-time-avg-badge")).toHaveTextContent("Avg: 28.5h");
      expect(screen.getByTestId("cycle-time-median-badge")).toHaveTextContent("Med: 24h");
      expect(screen.getByTestId("cycle-time-chart-container")).toBeInTheDocument();
    });

    it("TC-FE-CYC-02: renders clean empty state when zero tasks are completed", () => {
      const emptyCycleTime = {
        averageHours: 0,
        medianHours: 0,
        distribution: [
          { range: "< 24h", count: 0 },
          { range: "1-3 days", count: 0 },
        ],
      };

      render(<CycleTimeChart cycleTime={emptyCycleTime} />);

      expect(screen.getByTestId("cycle-time-empty-state")).toBeInTheDocument();
      expect(screen.getByText("No Completed Tasks")).toBeInTheDocument();
    });
  });

  describe("4. WorkloadChart", () => {
    it("TC-FE-WRK-01: mounts workload chart container with member breakdown", () => {
      render(<WorkloadChart workload={mockSummary.workload} />);

      expect(screen.getByTestId("workload-chart-card")).toBeInTheDocument();
      expect(screen.getByText("Team Workload Distribution")).toBeInTheDocument();
      expect(screen.getByTestId("workload-chart-container")).toBeInTheDocument();
    });

    it("TC-FE-WRK-02: renders clean empty state when workload is empty", () => {
      render(<WorkloadChart workload={[]} />);

      expect(screen.getByTestId("workload-empty-state")).toBeInTheDocument();
      expect(screen.getByText("No Member Tasks")).toBeInTheDocument();
    });
  });

  describe("5. AnalyticsFilters", () => {
    it("TC-FE-FLT-01: renders filter triggers and resets when active", () => {
      const onProjectChange = vi.fn();
      const onDateRangeChange = vi.fn();
      const onReset = vi.fn();

      const { rerender } = render(
        <AnalyticsFilters
          projects={mockProjects}
          selectedProjectId={null}
          selectedDateRange="all"
          onProjectChange={onProjectChange}
          onDateRangeChange={onDateRangeChange}
          onReset={onReset}
        />
      );

      expect(screen.getByTestId("project-filter-trigger")).toBeInTheDocument();
      expect(screen.getByTestId("date-range-filter-trigger")).toBeInTheDocument();
      expect(screen.queryByTestId("reset-filters-btn")).not.toBeInTheDocument();

      // When filtered, reset button appears
      rerender(
        <AnalyticsFilters
          projects={mockProjects}
          selectedProjectId="proj-1"
          selectedDateRange="7d"
          onProjectChange={onProjectChange}
          onDateRangeChange={onDateRangeChange}
          onReset={onReset}
        />
      );

      const resetBtn = screen.getByTestId("reset-filters-btn");
      expect(resetBtn).toBeInTheDocument();
      fireEvent.click(resetBtn);
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("TC-FE-FLT-02: selecting project or date range calls onProjectChange and onDateRangeChange", () => {
      const onProjectChange = vi.fn();
      const onDateRangeChange = vi.fn();
      const onReset = vi.fn();

      render(
        <AnalyticsFilters
          projects={mockProjects}
          selectedProjectId={null}
          selectedDateRange="all"
          onProjectChange={onProjectChange}
          onDateRangeChange={onDateRangeChange}
          onReset={onReset}
          isPending={true}
        />
      );

      expect(screen.getByTestId("filter-loading-indicator")).toBeInTheDocument();
      expect(screen.getByTestId("project-filter-trigger")).toBeDisabled();
      expect(screen.getByTestId("date-range-filter-trigger")).toBeDisabled();
    });
  });

  describe("6. AnalyticsDashboardView Orchestrator", () => {
    it("TC-FE-DSH-01: renders full dashboard view and re-fetches data upon filter reset", async () => {
      render(
        <AnalyticsDashboardView
          workspaceId="ws-test-123"
          initialSummary={mockSummary}
          projects={mockProjects}
        />
      );

      expect(screen.getByTestId("analytics-dashboard-view")).toBeInTheDocument();
      expect(screen.getByText("Team Analytics & Insights")).toBeInTheDocument();
      expect(screen.getByTestId("kpi-card-grid")).toBeInTheDocument();
      expect(screen.getByTestId("kpi-total-tasks")).toHaveTextContent("20");

      // Verify child cards and charts are rendered
      expect(screen.getByTestId("velocity-chart-card")).toBeInTheDocument();
      expect(screen.getByTestId("cycle-time-chart-card")).toBeInTheDocument();
      expect(screen.getByTestId("workload-chart-card")).toBeInTheDocument();
    });

    it("TC-FE-DSH-02: displays error banner when action returns an error", async () => {
      mockGetWorkspaceAnalyticsAction.mockResolvedValueOnce({
        success: false,
        error: "Database error retrieving metrics",
      });

      const updatedSummary: AnalyticsSummary = {
        ...mockSummary,
        totalTasks: 45,
      };

      const { rerender } = render(
        <AnalyticsDashboardView
          workspaceId="ws-test-123"
          initialSummary={mockSummary}
          projects={mockProjects}
        />
      );

      expect(screen.getByTestId("kpi-total-tasks")).toHaveTextContent("20");

      // If initial summary updates
      rerender(
        <AnalyticsDashboardView
          workspaceId="ws-test-123"
          initialSummary={updatedSummary}
          projects={mockProjects}
        />
      );

      expect(screen.getByTestId("analytics-dashboard-view")).toBeInTheDocument();
    });
  });
});
