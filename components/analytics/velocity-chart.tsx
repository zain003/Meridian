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
import { TrendingUp, Inbox } from "lucide-react";
import type { VelocityMetric } from "@/lib/validations/analytics";

interface VelocityChartProps {
  velocity: VelocityMetric[];
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

function CustomVelocityTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const created = payload.find((p) => p.dataKey === "createdTasks")?.value ?? 0;
    const completed = payload.find((p) => p.dataKey === "completedTasks")?.value ?? 0;
    const netVelocity = Number(completed) - Number(created);

    return (
      <div className="rounded-lg border border-zinc-800 bg-[#18181b]/95 p-3 shadow-2xl backdrop-blur-md min-w-[160px]">
        <p className="font-semibold text-foreground text-xs pb-1.5 border-b border-zinc-800 mb-2">
          {label}
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="size-2 rounded-full bg-sky-400" />
              Created
            </span>
            <span className="font-mono font-medium text-foreground">{created}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="size-2 rounded-full bg-indigo-500" />
              Completed
            </span>
            <span className="font-mono font-medium text-foreground">{completed}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-zinc-800/60 text-[11px]">
            <span className="text-muted-foreground">Net Velocity</span>
            <span
              className={`font-mono font-semibold ${
                netVelocity >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {netVelocity >= 0 ? `+${netVelocity}` : netVelocity}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function VelocityChart({ velocity, isLoading = false }: VelocityChartProps) {
  const hasData =
    velocity &&
    velocity.length > 0 &&
    velocity.some((v) => v.createdTasks > 0 || v.completedTasks > 0);

  return (
    <Card
      className="border border-zinc-800/80 bg-[#121215] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
      data-testid="velocity-chart-card"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Team Velocity
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Created tasks vs completed tasks per time interval
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="flex h-[280px] w-full items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Loading velocity metrics...
            </div>
          </div>
        ) : !hasData ? (
          <div
            className="flex h-[280px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800/80 bg-zinc-900/20 p-6 text-center"
            data-testid="velocity-empty-state"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800/50 text-zinc-500 mb-2">
              <Inbox className="size-5" />
            </div>
            <p className="text-xs font-medium text-zinc-400">No Velocity Activity</p>
            <p className="mt-1 text-[11px] text-zinc-500 max-w-[220px]">
              No tasks were created or completed during the selected timeframe.
            </p>
          </div>
        ) : (
          <div className="h-[280px] w-full" data-testid="velocity-chart-container">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={velocity}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barCategoryGap="20%"
              >
                <defs>
                  <linearGradient id="velocityCreatedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="velocityCompletedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />

                <XAxis
                  dataKey="interval"
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

                <Tooltip content={<CustomVelocityTooltip />} />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{
                    fontSize: "11px",
                    paddingBottom: "12px",
                  }}
                  formatter={(value) => (
                    <span className="text-zinc-400 capitalize">
                      {value === "createdTasks" ? "Created" : "Completed"}
                    </span>
                  )}
                />

                <Bar
                  dataKey="createdTasks"
                  name="createdTasks"
                  fill="url(#velocityCreatedGrad)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />

                <Bar
                  dataKey="completedTasks"
                  name="completedTasks"
                  fill="url(#velocityCompletedGrad)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
