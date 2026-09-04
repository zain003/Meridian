"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, RotateCcw, FolderKanban, Loader2 } from "lucide-react";

export interface ProjectOption {
  id: string;
  name: string;
  key: string;
}

export interface AnalyticsFiltersProps {
  projects: ProjectOption[];
  selectedProjectId: string | null;
  selectedDateRange: string;
  onProjectChange: (projectId: string | null) => void;
  onDateRangeChange: (range: string) => void;
  onReset: () => void;
  isPending?: boolean;
}

export const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "7d", label: "Last 7 Days" },
  { value: "14d", label: "Last 14 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

export function AnalyticsFilters({
  projects,
  selectedProjectId,
  selectedDateRange,
  onProjectChange,
  onDateRangeChange,
  onReset,
  isPending = false,
}: AnalyticsFiltersProps) {
  const isFiltered = selectedProjectId !== null || selectedDateRange !== "all";

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-[#121215] p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
      data-testid="analytics-filters"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Project Selector */}
        <div className="flex items-center gap-1.5">
          <Select
            value={selectedProjectId || "all"}
            onValueChange={(val) => onProjectChange(val === "all" ? null : val)}
            disabled={isPending}
          >
            <SelectTrigger
              className="h-8 min-w-[160px] text-xs border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 transition-colors"
              data-testid="project-filter-trigger"
            >
              <div className="flex items-center gap-2 truncate">
                <FolderKanban className="size-3.5 text-primary shrink-0" />
                <SelectValue placeholder="All Projects" />
              </div>
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-[#18181b]">
              <SelectItem value="all" className="text-xs">
                All Projects ({projects.length})
              </SelectItem>
              {projects.map((project) => (
                <SelectItem
                  key={project.id}
                  value={project.id}
                  className="text-xs"
                >
                  <span className="font-medium">{project.name}</span>
                  <span className="ml-1.5 font-mono text-[10px] text-zinc-500">
                    [{project.key}]
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5">
          <Select
            value={selectedDateRange}
            onValueChange={onDateRangeChange}
            disabled={isPending}
          >
            <SelectTrigger
              className="h-8 min-w-[140px] text-xs border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 transition-colors"
              data-testid="date-range-filter-trigger"
            >
              <div className="flex items-center gap-2 truncate">
                <Calendar className="size-3.5 text-emerald-400 shrink-0" />
                <SelectValue placeholder="Date Range" />
              </div>
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-[#18181b]">
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-xs"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isPending && (
          <div
            className="flex items-center gap-1.5 text-xs text-muted-foreground animate-in fade-in"
            data-testid="filter-loading-indicator"
          >
            <Loader2 className="size-3.5 animate-spin text-primary" />
            <span className="text-[11px]">Updating...</span>
          </div>
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={isPending}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800"
            data-testid="reset-filters-btn"
          >
            <RotateCcw className="mr-1.5 size-3" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
