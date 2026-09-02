"use client";

import * as React from "react";
import { TaskCard, type TaskCardProps } from "@/components/tasks/task-card";

export interface TaskDragOverlayProps {
  task: TaskCardProps["task"] | null;
}

export function TaskDragOverlay({ task }: TaskDragOverlayProps) {
  if (!task) return null;

  return (
    <div className="w-80 pointer-events-none">
      <TaskCard task={task} isOverlay />
    </div>
  );
}
