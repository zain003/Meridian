"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { BoardColumnHeader } from "@/components/boards/board-column-header";
import { TaskCard, type TaskCardProps } from "@/components/tasks/task-card";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KanbanColumnProps {
  workspaceId: string;
  projectId: string;
  column: {
    id: string;
    name: string;
    order: number;
  };
  tasks: TaskCardProps["task"][];
  canManage?: boolean;
  onTaskCreated?: (task: {
    id: string;
    columnId: string;
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    order: number;
  }) => void;
  onTaskClick?: (taskId: string) => void;
}

export function KanbanColumn({
  workspaceId,
  projectId,
  column,
  tasks,
  canManage = false,
  onTaskCreated,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const taskIds = React.useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      data-testid={`column-${column.id}`}
      className={cn(
        "w-80 shrink-0 flex flex-col max-h-full rounded-xl border border-zinc-800/80 bg-[#121215]/80 backdrop-blur-sm p-3 shadow-sm transition-all",
        isOver && "border-primary/50 ring-1 ring-primary/20 bg-[#141418]"
      )}
    >
      {/* Column Header */}
      <BoardColumnHeader
        columnId={column.id}
        columnName={column.name}
        taskCount={tasks.length}
        canManage={canManage}
      />

      {/* Task Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-2 py-2 min-h-[140px] pr-0.5 custom-scrollbar">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task.id)}
            />
          ))}
        </SortableContext>

        {/* Empty Drop Indicator */}
        {tasks.length === 0 && (
          <div
            className={cn(
              "flex flex-col items-center justify-center h-28 rounded-lg border border-dashed border-zinc-800/60 text-center p-3 text-zinc-500 transition-colors",
              isOver && "border-primary/40 bg-primary/5 text-primary/70"
            )}
            data-testid={`empty-column-${column.id}`}
          >
            <Inbox className="size-5 mb-1 text-zinc-600" />
            <span className="text-[11px] font-medium">No tasks in {column.name}</span>
          </div>
        )}
      </div>

      {/* Quick Add Task */}
      {canManage && (
        <div className="mt-1 pt-1 border-t border-zinc-800/40">
          <QuickAddTask
            workspaceId={workspaceId}
            projectId={projectId}
            columnId={column.id}
            onTaskCreated={onTaskCreated}
          />
        </div>
      )}
    </div>
  );
}
