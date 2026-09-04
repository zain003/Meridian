"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListTodo, CheckCircle2, Percent, Clock } from "lucide-react";
import type { AnalyticsSummary } from "@/lib/validations/analytics";

interface KpiCardGridProps {
  summary: AnalyticsSummary;
}

export function KpiCardGrid({ summary }: KpiCardGridProps) {
  const { totalTasks, completedTasks, cycleTime } = summary;

  const completionRate =
    totalTasks > 0
      ? Number(((completedTasks / totalTasks) * 100).toFixed(1))
      : 0;

  const inProgressOrOpen = Math.max(0, totalTasks - completedTasks);

  // Format cycle time display
  const formatCycleTime = (hours: number) => {
    if (hours === 0) return "0h";
    if (hours < 24) return `${hours}h`;
    const days = (hours / 24).toFixed(1);
    return `${days}d (${hours}h)`;
  };

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      data-testid="kpi-card-grid"
    >
      {/* 1. Total Tasks */}
      <Card className="border border-zinc-800/80 bg-[#121215] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-zinc-700/80 transition-all duration-150">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Tasks
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <ListTodo className="size-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span
              className="text-2xl font-bold tracking-tight text-foreground"
              data-testid="kpi-total-tasks"
            >
              {totalTasks}
            </span>
            <Badge
              variant="outline"
              className="border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-400 font-mono"
            >
              {inProgressOrOpen} open
            </Badge>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Created across workspace projects
          </p>
        </CardContent>
      </Card>

      {/* 2. Completed Tasks */}
      <Card className="border border-zinc-800/80 bg-[#121215] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-zinc-700/80 transition-all duration-150">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Completed Tasks
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="size-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span
              className="text-2xl font-bold tracking-tight text-foreground"
              data-testid="kpi-completed-tasks"
            >
              {completedTasks}
            </span>
            <Badge
              variant="success"
              className="border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-400"
            >
              Done
            </Badge>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Marked as done and delivered
          </p>
        </CardContent>
      </Card>

      {/* 3. Completion Rate */}
      <Card className="border border-zinc-800/80 bg-[#121215] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-zinc-700/80 transition-all duration-150">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Completion Rate
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Percent className="size-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span
              className="text-2xl font-bold tracking-tight text-foreground"
              data-testid="kpi-completion-rate"
            >
              {completionRate}%
            </span>
            <Badge
              variant="info"
              className="border-sky-500/30 bg-sky-500/10 text-[11px] text-sky-400 font-mono"
            >
              {completedTasks}/{totalTasks}
            </Badge>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Of all workspace tasks resolved
          </p>
        </CardContent>
      </Card>

      {/* 4. Average Cycle Time */}
      <Card className="border border-zinc-800/80 bg-[#121215] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-zinc-700/80 transition-all duration-150">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg Cycle Time
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="size-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span
              className="text-2xl font-bold tracking-tight text-foreground"
              data-testid="kpi-avg-cycle-time"
            >
              {formatCycleTime(cycleTime.averageHours)}
            </span>
            <Badge
              variant="warning"
              className="border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-400 font-mono"
            >
              Med: {cycleTime.medianHours}h
            </Badge>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            From creation to completion
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
