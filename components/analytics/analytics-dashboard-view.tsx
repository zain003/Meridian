"use client";

import * as React from "react";
import { getWorkspaceAnalyticsAction } from "@/server/actions/analytics";
import { KpiCardGrid } from "@/components/analytics/kpi-card-grid";
import { VelocityChart } from "@/components/analytics/velocity-chart";
import { CycleTimeChart } from "@/components/analytics/cycle-time-chart";
import { WorkloadChart } from "@/components/analytics/workload-chart";
import {
  AnalyticsFilters,
  type ProjectOption,
} from "@/components/analytics/analytics-filters";
import { BarChart3 } from "lucide-react";
import type { AnalyticsSummary } from "@/lib/validations/analytics";

interface AnalyticsDashboardViewProps {
  workspaceId: string;
  initialSummary: AnalyticsSummary;
  projects: ProjectOption[];
}

export function getDateRangeBounds(range: string): {
  startDate?: Date;
  endDate?: Date;
} {
  const now = new Date();
  switch (range) {
    case "7d": {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: now };
    }
    case "14d": {
      const start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: now };
    }
    case "30d": {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: now };
    }
    case "90d": {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: now };
    }
    case "all":
    default:
      return { startDate: undefined, endDate: undefined };
  }
}

export function AnalyticsDashboardView({
  workspaceId,
  initialSummary,
  projects,
}: AnalyticsDashboardViewProps) {
  const [summary, setSummary] = React.useState<AnalyticsSummary>(initialSummary);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = React.useState<string>("all");
  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const fetchMetrics = React.useCallback(
    (projectId: string | null, dateRange: string) => {
      startTransition(async () => {
        setErrorMessage(null);
        const { startDate, endDate } = getDateRangeBounds(dateRange);

        const response = await getWorkspaceAnalyticsAction({
          workspaceId,
          projectId: projectId || undefined,
          startDate,
          endDate,
        });

        if (response.success) {
          setSummary(response.data);
        } else {
          setErrorMessage(response.error || "Failed to refresh analytics data.");
        }
      });
    },
    [workspaceId]
  );

  const handleProjectChange = (projectId: string | null) => {
    setSelectedProjectId(projectId);
    fetchMetrics(projectId, selectedDateRange);
  };

  const handleDateRangeChange = (dateRange: string) => {
    setSelectedDateRange(dateRange);
    fetchMetrics(selectedProjectId, dateRange);
  };

  const handleReset = () => {
    setSelectedProjectId(null);
    setSelectedDateRange("all");
    fetchMetrics(null, "all");
  };

  return (
    <div
      className="space-y-6 max-w-7xl mx-auto w-full"
      data-testid="analytics-dashboard-view"
    >
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-800">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              Team Analytics & Insights
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time velocity, cycle turnaround distribution, and member workload tracking.
            </p>
          </div>

          <div className="shrink-0">
            <AnalyticsFilters
              projects={projects}
              selectedProjectId={selectedProjectId}
              selectedDateRange={selectedDateRange}
              onProjectChange={handleProjectChange}
              onDateRangeChange={handleDateRangeChange}
              onReset={handleReset}
              isPending={isPending}
            />
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 animate-in fade-in"
          >
            {errorMessage}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <KpiCardGrid summary={summary} />

      {/* Bento Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Velocity Chart */}
        <VelocityChart velocity={summary.velocity} isLoading={isPending} />

        {/* Cycle Time Distribution Chart */}
        <CycleTimeChart cycleTime={summary.cycleTime} isLoading={isPending} />
      </div>

      {/* Member Workload Distribution Chart (Full Width) */}
      <WorkloadChart workload={summary.workload} isLoading={isPending} />
    </div>
  );
}
