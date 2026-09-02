"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, CheckSquare, AlertCircle, ArrowUp, ArrowDown, Minus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskItem {
  id: string;
  columnId: string;
  title: string;
  description?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  order: number;
  dueDate?: Date | string | null;
  completedAt?: Date | string | null;
  assignee?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  subtasks?: Array<{ id: string; title?: string; isDone: boolean; order?: number }>;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: Date | string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }>;
  _count?: {
    subtasks: number;
    comments?: number;
  };
  labels?: Array<{
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

export interface TaskCardProps {
  task: TaskItem;
  isOverlay?: boolean;
  onClick?: () => void;
}

const PRIORITY_CONFIG = {
  URGENT: {
    label: "Urgent",
    className: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20",
    icon: AlertCircle,
  },
  HIGH: {
    label: "High",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20",
    icon: ArrowUp,
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
    icon: Minus,
  },
  LOW: {
    label: "Low",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20",
    icon: ArrowDown,
  },
};

export function TaskCard({ task, isOverlay = false, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
  const PriorityIcon = priorityInfo.icon;

  const totalSubtasks = task.subtasks?.length ?? task._count?.subtasks ?? 0;
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
      })
    : null;

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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      data-testid={`task-card-${task.id}`}
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg border border-zinc-800/80 bg-[#18181b]/90 p-3 text-left shadow-sm transition-all hover:border-zinc-700 hover:shadow-md cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40 border-dashed border-primary/50 bg-primary/5",
        isOverlay && "cursor-grabbing shadow-2xl ring-2 ring-primary/40 rotate-1 scale-[1.02] bg-[#18181b] border-zinc-700"
      )}
    >
      {/* Top Header: Priority Badge & Drag Handle Indicator */}
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={cn(
            "px-1.5 py-0.5 text-[10px] font-medium gap-1 flex items-center rounded-md border",
            priorityInfo.className
          )}
          data-testid={`task-priority-${task.priority.toLowerCase()}`}
        >
          <PriorityIcon className="size-3" />
          <span>{priorityInfo.label}</span>
        </Badge>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500">
          <GripVertical className="size-3.5" />
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-medium text-foreground leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
            >
              <span
                className="size-1.5 rounded-full mr-1"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Metadata: Due Date, Subtasks, Assignee */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[11px] text-muted-foreground mt-0.5">
        <div className="flex items-center gap-2.5">
          {/* Due Date Indicator */}
          {formattedDueDate && (
            <div
              className={cn(
                "flex items-center gap-1",
                isOverdue ? "text-red-400 font-medium" : "text-zinc-400"
              )}
              data-testid="task-due-date"
            >
              <Clock className="size-3" />
              <span>{formattedDueDate}</span>
            </div>
          )}

          {/* Subtask Ratio */}
          {totalSubtasks > 0 && (
            <div
              className="flex items-center gap-1 text-zinc-400"
              data-testid="task-subtasks-count"
            >
              <CheckSquare className="size-3" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee ? (
          <Avatar className="size-5 border border-zinc-700" data-testid="task-assignee-avatar">
            {task.assignee.image && (
              <AvatarImage src={task.assignee.image} alt={task.assignee.name || "Assignee"} />
            )}
            <AvatarFallback className="text-[9px] bg-zinc-800 text-zinc-300 font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    </div>
  );
}
