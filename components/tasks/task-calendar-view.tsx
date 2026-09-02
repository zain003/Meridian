"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskCardProps } from "@/components/tasks/task-card";

export interface TaskCalendarViewProps {
  tasks: TaskCardProps["task"][];
  onTaskClick?: (taskId: string) => void;
}

const PRIORITY_COLORS = {
  URGENT: "bg-red-500 text-red-500 border-red-500/30",
  HIGH: "bg-amber-500 text-amber-500 border-amber-500/30",
  MEDIUM: "bg-blue-500 text-blue-500 border-blue-500/30",
  LOW: "bg-slate-500 text-slate-400 border-slate-500/30",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TaskCalendarView({
  tasks,
  onTaskClick,
}: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState<Date>(() => {
    // Check if any task has due date, otherwise default to today
    const firstTaskWithDate = tasks.find((t) => t.dueDate);
    return firstTaskWithDate?.dueDate ? new Date(firstTaskWithDate.dueDate) : new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Tasks mapped by date string 'YYYY-MM-DD'
  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, TaskCardProps["task"][]>();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(task);
      }
    });
    return map;
  }, [tasks]);

  const unscheduledTasks = React.useMemo(() => {
    return tasks.filter((t) => !t.dueDate);
  }, [tasks]);

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  const isCurrentMonthToday =
    today.getFullYear() === year && today.getMonth() === month;

  // Generate calendar cells (leading days + current days + trailing days)
  const daysInGrid: Array<{ dayNumber: number; isCurrentMonth: boolean; dateKey: string }> = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const dateKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    daysInGrid.push({ dayNumber: day, isCurrentMonth: false, dateKey });
  }

  // Current month days
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    daysInGrid.push({ dayNumber: day, isCurrentMonth: true, dateKey });
  }

  // Next month leading days to complete grid (42 cells = 6 rows x 7 days)
  const remainingCells = 42 - daysInGrid.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthDate = new Date(year, month + 1, day);
    const dateKey = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    daysInGrid.push({ dayNumber: day, isCurrentMonth: false, dateKey });
  }

  return (
    <div className="flex flex-col h-full space-y-3" data-testid="task-calendar-view">
      {/* Calendar Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3
            className="text-base font-semibold text-foreground"
            data-testid="calendar-month-heading"
          >
            {monthName}
          </h3>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="size-7 text-zinc-400 hover:text-foreground"
              data-testid="calendar-prev-month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="size-7 text-zinc-400 hover:text-foreground"
              data-testid="calendar-next-month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="h-7 text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-foreground px-2.5"
          data-testid="calendar-today-btn"
        >
          <CalendarIcon className="size-3 mr-1 text-primary" />
          <span>Today</span>
        </Button>
      </div>

      {/* Main Calendar Grid */}
      <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-zinc-800 bg-[#121215]/80 backdrop-blur-sm shadow-sm overflow-hidden">
        {/* Weekdays Header */}
        <div className="grid grid-cols-7 border-b border-zinc-800/80 bg-zinc-900/60 text-center py-2 text-xs font-medium text-zinc-400 select-none">
          {WEEKDAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-zinc-800/60 overflow-y-auto custom-scrollbar">
          {daysInGrid.map(({ dayNumber, isCurrentMonth, dateKey }, idx) => {
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isToday =
              isCurrentMonthToday &&
              isCurrentMonth &&
              dayNumber === today.getDate();

            return (
              <div
                key={`${dateKey}-${idx}`}
                data-testid={`calendar-day-${dateKey}`}
                className={cn(
                  "p-1.5 min-h-[85px] flex flex-col gap-1 transition-colors hover:bg-zinc-800/20",
                  !isCurrentMonth && "bg-zinc-950/40 text-zinc-600",
                  isToday && "bg-primary/5 ring-1 ring-inset ring-primary/30"
                )}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-medium size-5 flex items-center justify-center rounded-full",
                      isToday
                        ? "bg-primary text-primary-foreground font-semibold"
                        : isCurrentMonth
                        ? "text-zinc-300"
                        : "text-zinc-600"
                    )}
                  >
                    {dayNumber}
                  </span>

                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Day Tasks Pills */}
                <div className="space-y-1 overflow-y-auto max-h-20 custom-scrollbar">
                  {dayTasks.map((task) => {
                    const colorClass =
                      PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick?.(task.id)}
                        data-testid={`calendar-task-${task.id}`}
                        className="group flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 cursor-pointer transition-all truncate text-zinc-200"
                      >
                        <span
                          className={cn("size-1.5 rounded-full shrink-0", colorClass)}
                        />
                        <span className="truncate leading-tight">
                          {task.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled Tasks Section */}
      {unscheduledTasks.length > 0 && (
        <div
          className="rounded-xl border border-zinc-800 bg-[#121215]/80 p-3"
          data-testid="calendar-unscheduled-drawer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Inbox className="size-3.5 text-zinc-500" />
              <span>Unscheduled Tasks ({unscheduledTasks.length})</span>
            </div>
            <span className="text-[10px] text-zinc-500">No due date set</span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
            {unscheduledTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => onTaskClick?.(task.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-700 hover:text-foreground transition-all"
                data-testid={`unscheduled-task-${task.id}`}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    PRIORITY_COLORS[task.priority]
                  )}
                />
                <span className="truncate max-w-[200px]">{task.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
