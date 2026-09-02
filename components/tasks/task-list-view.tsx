"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Clock,
  CheckSquare,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  ArrowUpDown,
  Search,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskCardProps } from "@/components/tasks/task-card";

export interface TaskListViewProps {
  tasks: TaskCardProps["task"][];
  columns: Array<{ id: string; name: string }>;
  onTaskClick?: (taskId: string) => void;
}

type SortField = "title" | "priority" | "dueDate" | "status";
type SortDirection = "asc" | "desc";

const PRIORITY_CONFIG = {
  URGENT: {
    label: "Urgent",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: AlertCircle,
    weight: 4,
  },
  HIGH: {
    label: "High",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: ArrowUp,
    weight: 3,
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Minus,
    weight: 2,
  },
  LOW: {
    label: "Low",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    icon: ArrowDown,
    weight: 1,
  },
};

export function TaskListView({
  tasks,
  columns,
  onTaskClick,
}: TaskListViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortField, setSortField] = React.useState<SortField>("dueDate");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  const columnMap = React.useMemo(() => {
    const map = new Map<string, string>();
    columns.forEach((col) => map.set(col.id, col.name));
    return map;
  }, [columns]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  const filteredAndSortedTasks = React.useMemo(() => {
    let result = [...tasks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.assignee?.name && t.assignee.name.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === "priority") {
        const weightA = PRIORITY_CONFIG[a.priority]?.weight || 0;
        const weightB = PRIORITY_CONFIG[b.priority]?.weight || 0;
        comparison = weightA - weightB;
      } else if (sortField === "dueDate") {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB;
      } else if (sortField === "status") {
        const statusA = columnMap.get(a.columnId) || "";
        const statusB = columnMap.get(b.columnId) || "";
        comparison = statusA.localeCompare(statusB);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, searchQuery, sortField, sortDirection, columnMap]);

  return (
    <div className="flex flex-col h-full space-y-3" data-testid="task-list-view">
      {/* Search & Filter Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title or assignee..."
            className="h-8 pl-8 text-xs bg-zinc-900 border-zinc-800 text-foreground placeholder:text-zinc-500"
            data-testid="list-search-input"
          />
        </div>

        <div className="text-xs text-muted-foreground font-medium">
          {filteredAndSortedTasks.length} {filteredAndSortedTasks.length === 1 ? "task" : "tasks"}
        </div>
      </div>

      {/* Structured Table Container */}
      <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-[#121215]/80 backdrop-blur-sm shadow-sm custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-900/50 text-zinc-400 select-none">
              <th
                onClick={() => handleSort("title")}
                className="py-2.5 px-4 font-medium cursor-pointer hover:text-foreground"
                data-testid="sort-header-title"
              >
                <div className="flex items-center gap-1.5">
                  <span>Task Title</span>
                  <ArrowUpDown className="size-3" />
                </div>
              </th>

              <th
                onClick={() => handleSort("status")}
                className="py-2.5 px-3 font-medium cursor-pointer hover:text-foreground"
                data-testid="sort-header-status"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="size-3" />
                </div>
              </th>

              <th
                onClick={() => handleSort("priority")}
                className="py-2.5 px-3 font-medium cursor-pointer hover:text-foreground"
                data-testid="sort-header-priority"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="size-3" />
                </div>
              </th>

              <th
                onClick={() => handleSort("dueDate")}
                className="py-2.5 px-3 font-medium cursor-pointer hover:text-foreground"
                data-testid="sort-header-dueDate"
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date</span>
                  <ArrowUpDown className="size-3" />
                </div>
              </th>

              <th className="py-2.5 px-3 font-medium">Subtasks</th>

              <th className="py-2.5 px-4 font-medium">Assignee</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60">
            {filteredAndSortedTasks.map((task) => {
              const priorityInfo =
                PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
              const PriorityIcon = priorityInfo.icon;
              const statusName = columnMap.get(task.columnId) || "Backlog";

              const totalSubtasks =
                task.subtasks?.length ?? task._count?.subtasks ?? 0;
              const completedSubtasks =
                task.subtasks?.filter((s) => s.isDone).length ?? 0;

              const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
              const isOverdue =
                dueDateObj &&
                !task.completedAt &&
                dueDateObj.getTime() < new Date().setHours(0, 0, 0, 0);

              const formattedDueDate = dueDateObj
                ? dueDateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—";

              const initials = task.assignee?.name
                ? task.assignee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : task.assignee?.email
                ? task.assignee.email.slice(0, 2).toUpperCase()
                : null;

              return (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick?.(task.id)}
                  data-testid={`task-row-${task.id}`}
                  className="group hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  {/* Title & Labels */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {task.title}
                      </span>

                      {task.labels && task.labels.length > 0 && (
                        <div className="flex items-center gap-1">
                          {task.labels.map(({ label }) => (
                            <span
                              key={label.id}
                              className="size-2 rounded-full"
                              style={{ backgroundColor: label.color }}
                              title={label.name}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status Column */}
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {statusName}
                    </span>
                  </td>

                  {/* Priority Badge */}
                  <td className="py-2.5 px-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-1.5 py-0.5 text-[10px] font-medium gap-1 flex items-center w-fit rounded-md border",
                        priorityInfo.className
                      )}
                    >
                      <PriorityIcon className="size-3" />
                      <span>{priorityInfo.label}</span>
                    </Badge>
                  </td>

                  {/* Due Date */}
                  <td className="py-2.5 px-3">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        isOverdue ? "text-red-400 font-medium" : "text-zinc-400"
                      )}
                    >
                      {dueDateObj && <Clock className="size-3" />}
                      <span>{formattedDueDate}</span>
                    </div>
                  </td>

                  {/* Subtasks Progress */}
                  <td className="py-2.5 px-3">
                    {totalSubtasks > 0 ? (
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <CheckSquare className="size-3" />
                        <span>
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Assignee Avatar */}
                  <td className="py-2.5 px-4">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="size-5 border border-zinc-700">
                          {task.assignee.image && (
                            <AvatarImage
                              src={task.assignee.image}
                              alt={task.assignee.name || "User"}
                            />
                          )}
                          <AvatarFallback className="text-[9px] bg-zinc-800 text-zinc-300 font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-zinc-300 truncate max-w-[120px]">
                          {task.assignee.name || task.assignee.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs">Unassigned</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredAndSortedTasks.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <Inbox className="size-6 text-zinc-600 mb-1" />
                    <span className="text-xs font-medium text-zinc-400">
                      No tasks found
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Try adjusting your search query or add a new task.
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
