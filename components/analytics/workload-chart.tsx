"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Users, Inbox } from "lucide-react";
import type { MemberWorkloadMetric } from "@/lib/validations/analytics";

interface WorkloadChartProps {
  workload: MemberWorkloadMetric[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomWorkloadTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const completed = payload.find((p) => p.dataKey === "completedCount")?.value ?? 0;
    const inProgress = payload.find((p) => p.dataKey === "inProgressCount")?.value ?? 0;
    const backlog = payload.find((p) => p.dataKey === "backlogCount")?.value ?? 0;
    const total = Number(completed) + Number(inProgress) + Number(backlog);

    return (
      <div className="rounded-lg border border-zinc-800 bg-[#18181b]/95 p-3 shadow-2xl backdrop-blur-md min-w-[170px]">
        <p className="font-semibold text-foreground text-xs pb-1.5 border-b border-zinc-800 mb-2 truncate max-w-[200px]">
          {label}
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400" />
              Completed
            </span>
            <span className="font-mono font-medium text-foreground">{completed}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="size-2 rounded-full bg-sky-400" />
              In Progress
            </span>
            <span className="font-mono font-medium text-foreground">{inProgress}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="size-2 rounded-full bg-zinc-500" />
              Todo / Backlog
            </span>
            <span className="font-mono font-medium text-foreground">{backlog}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-zinc-800/60 text-[11px]">
            <span className="text-muted-foreground">Total Assigned</span>
            <span className="font-mono font-semibold text-primary">{total}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function WorkloadChart({
  workload,
  isLoading = false,
}: WorkloadChartProps) {
  const hasData =
    workload &&
    workload.length > 0 &&
    workload.some((w) => w.assignedCount > 0);

  // Transform data for stacked bars
  const chartData = React.useMemo(() => {
    return workload.map((member) => {
      const backlogCount = Math.max(
        0,
        member.assignedCount - member.inProgressCount - member.completedCount
      );
      return {
        ...member,
        backlogCount,
        displayName:
          member.userName.length > 16
            ? `${member.userName.slice(0, 14)}…`
            : member.userName,
      };
    });
  }, [workload]);

  // Adjust height based on number of members
  const dynamicHeight = Math.max(280, chartData.length * 44 + 80);

  return (
    <Card
      className="border border-zinc-800/80 bg-[#121215] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
      data-testid="workload-chart-card"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Team Workload Distribution
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Task distribution, in-flight progress, and completions per team member
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="flex h-[280px] w-full items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Loading member workload...
            </div>
          </div>
        ) : !hasData ? (
          <div
            className="flex h-[280px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800/80 bg-zinc-900/20 p-6 text-center"
            data-testid="workload-empty-state"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800/50 text-zinc-500 mb-2">
              <Inbox className="size-5" />
            </div>
            <p className="text-xs font-medium text-zinc-400">No Member Tasks</p>
            <p className="mt-1 text-[11px] text-zinc-500 max-w-[220px]">
              No tasks have been assigned to team members in the current filter range.
            </p>
          </div>
        ) : (
          <div
            className="w-full overflow-x-auto"
            style={{ height: `${dynamicHeight}px` }}
            data-testid="workload-chart-container"
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                barCategoryGap="25%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#27272a" }}
                  allowDecimals={false}
                />

                <YAxis
                  type="category"
                  dataKey="displayName"
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#27272a" }}
                  width={110}
                />

                <Tooltip content={<CustomWorkloadTooltip />} />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{
                    fontSize: "11px",
                    paddingBottom: "12px",
                  }}
                  formatter={(value) => {
                    if (value === "completedCount") return <span className="text-zinc-400">Completed</span>;
                    if (value === "inProgressCount") return <span className="text-zinc-400">In Progress</span>;
                    return <span className="text-zinc-400">Todo / Backlog</span>;
                  }}
                />

                <Bar
                  dataKey="completedCount"
                  name="completedCount"
                  stackId="workload"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={22}
                />

                <Bar
                  dataKey="inProgressCount"
                  name="inProgressCount"
                  stackId="workload"
                  fill="#38bdf8"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={22}
                />

                <Bar
                  dataKey="backlogCount"
                  name="backlogCount"
                  stackId="workload"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
