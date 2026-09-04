"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Filter, Layers, Clock } from "lucide-react";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { TaskItem } from "@/components/tasks/task-card";

export interface CalendarTaskItem extends TaskItem {
  projectName?: string;
  projectKey?: string;
  projectId?: string;
  columnName?: string;
}

interface WorkspaceCalendarViewProps {
  workspaceId?: string;
  tasks: CalendarTaskItem[];
  projects: Array<{ id: string; name: string; key: string }>;
  members: Array<{ id: string; name?: string | null; email: string; image?: string | null }>;
  currentUserId?: string;
  canManage?: boolean;
}

export function WorkspaceCalendarView({
  tasks: initialTasks,
  projects,
  members,
  currentUserId,
  canManage = false,
}: WorkspaceCalendarViewProps) {
  const [tasks, setTasks] = React.useState<CalendarTaskItem[]>(initialTasks);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("all");
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

  // Filter tasks based on selected project
  const filteredTasks = React.useMemo(() => {
    if (selectedProjectId === "all") {
      return tasks;
    }
    return tasks.filter((task) => task.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const scheduledCount = React.useMemo(
    () => filteredTasks.filter((t) => !!t.dueDate).length,
    [filteredTasks]
  );
  const unscheduledCount = filteredTasks.length - scheduledCount;

  // Selected task for detail modal
  const activeTask = React.useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleTaskUpdate = (updatedTask: {
    id: string;
    columnId?: string;
    title?: string;
    description?: string | null;
    priority?: TaskItem["priority"];
    dueDate?: Date | string | null;
    assigneeId?: string | null;
  }) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTaskId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <CalendarIcon className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Timeline & Schedule
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading">
            Workspace Calendar
          </h1>
          <p className="text-xs text-muted-foreground">
            Visualize deadlines and scheduled deliverables across all workspace projects.
          </p>
        </div>

        {/* Project Filter & Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[11px] gap-1 px-2.5 py-1 border-zinc-800 bg-zinc-900/60 text-zinc-300"
            >
              <Clock className="size-3 text-primary" />
              <span>{scheduledCount} Scheduled</span>
            </Badge>
            <Badge
              variant="outline"
              className="text-[11px] gap-1 px-2.5 py-1 border-zinc-800 bg-zinc-900/60 text-zinc-400"
            >
              <Layers className="size-3 text-zinc-500" />
              <span>{unscheduledCount} Unscheduled</span>
            </Badge>
          </div>

          {projects.length > 0 && (
            <div className="w-48">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200">
                  <Filter className="size-3.5 mr-1.5 text-zinc-400" />
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent className="bg-[#141418] border-zinc-800">
                  <SelectItem value="all" className="text-xs">
                    All Projects ({tasks.length})
                  </SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.name} ({p.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 min-h-0">
        <TaskCalendarView
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
        />
      </div>

      {/* Task Detail Modal */}
      {activeTask && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          task={activeTask}
          members={members}
          currentUserId={currentUserId}
          canManage={canManage}
          onTaskUpdated={handleTaskUpdate}
          onTaskDeleted={handleTaskDelete}
        />
      )}
    </div>
  );
}
