"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Inbox, Timer } from "lucide-react";
import type { CycleTimeMetric } from "@/lib/validations/analytics";

interface CycleTimeChartProps {
  cycleTime: CycleTimeMetric;
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  label?: string;
  totalCompleted?: number;
}

function CustomCycleTooltip({
  active,
  payload,
  label,
  totalCompleted = 0,
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const count = payload[0].value;
    const percentage =
      totalCompleted > 0 ? ((count / totalCompleted) * 100).toFixed(1) : "0.0";

    return (
      <div className="rounded-lg border border-zinc-800 bg-[#18181b]/95 p-3 shadow-2xl backdrop-blur-md min-w-[150px]">
        <p className="font-semibold text-foreground text-xs pb-1.5 border-b border-zinc-800 mb-2 flex items-center gap-1.5">
          <Clock className="size-3.5 text-emerald-400" />
          {label}
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Tasks:</span>
            <span className="font-mono font-medium text-foreground">{count}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Share:</span>
            <span className="font-mono font-medium text-emerald-400">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function CycleTimeChart({
  cycleTime,
  isLoading = false,
}: CycleTimeChartProps) {
  const { averageHours, medianHours, distribution } = cycleTime;

  const totalCompleted = distribution.reduce((sum, item) => sum + item.count, 0);
  const hasData = totalCompleted > 0;

  return (
    <Card
      className="border border-zinc-800/80 bg-[#121215] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
      data-testid="cycle-time-chart-card"
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Timer className="size-4 text-emerald-400" />
              Cycle Time Distribution
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Turnaround duration histogram for resolved tasks
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-zinc-800 bg-zinc-900/50 text-[11px] font-mono text-zinc-300"
              data-testid="cycle-time-avg-badge"
            >
              Avg: {averageHours}h
            </Badge>
            <Badge
              variant="outline"
              className="border-zinc-800 bg-zinc-900/50 text-[11px] font-mono text-zinc-400"
              data-testid="cycle-time-median-badge"
            >
              Med: {medianHours}h
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="flex h-[280px] w-full items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <div className="size-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              Loading cycle time metrics...
            </div>
          </div>
        ) : !hasData ? (
          <div
            className="flex h-[280px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800/80 bg-zinc-900/20 p-6 text-center"
            data-testid="cycle-time-empty-state"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800/50 text-zinc-500 mb-2">
              <Inbox className="size-5" />
            </div>
            <p className="text-xs font-medium text-zinc-400">No Completed Tasks</p>
            <p className="mt-1 text-[11px] text-zinc-500 max-w-[220px]">
              Complete tasks to measure duration and turnaround distribution.
            </p>
          </div>
        ) : (
          <div className="h-[280px] w-full" data-testid="cycle-time-chart-container">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={distribution}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barCategoryGap="25%"
              >
                <defs>
                  <linearGradient id="cycleTimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />

                <XAxis
                  dataKey="range"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#27272a" }}
                />

                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#27272a" }}
                  allowDecimals={false}
                />

                <Tooltip
                  content={
                    <CustomCycleTooltip totalCompleted={totalCompleted} />
                  }
                />

                <Bar
                  dataKey="count"
                  name="Tasks"
                  fill="url(#cycleTimeGrad)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
