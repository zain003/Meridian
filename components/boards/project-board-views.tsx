"use client";

import * as React from "react";
import { KanbanBoard, type ColumnData } from "@/components/boards/kanban-board";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import type { TaskCardProps } from "@/components/tasks/task-card";

export interface ProjectBoardViewsProps {
  workspaceId: string;
  projectId: string;
  boardId?: string;
  currentView: string;
  initialColumns: ColumnData[];
  members?: Array<{ id: string; name?: string | null; email: string; image?: string | null }>;
  currentUserId?: string;
  canManage?: boolean;
}

export function ProjectBoardViews({
  workspaceId,
  projectId,
  boardId,
  currentView,
  initialColumns,
  members = [],
  currentUserId,
  canManage = false,
}: ProjectBoardViewsProps) {
  const [columns, setColumns] = React.useState<ColumnData[]>(initialColumns);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

  const [prevInitialColumns, setPrevInitialColumns] = React.useState<ColumnData[]>(initialColumns);
  if (initialColumns !== prevInitialColumns) {
    setPrevInitialColumns(initialColumns);
    setColumns(initialColumns);
  }

  // Flatten all tasks for list and calendar views
  const allTasks = React.useMemo(() => {
    return columns.flatMap((col) => col.tasks);
  }, [columns]);

  const selectedTask = React.useMemo(() => {
    if (!selectedTaskId) return null;
    return allTasks.find((t) => t.id === selectedTaskId) || null;
  }, [allTasks, selectedTaskId]);

  function handleTaskUpdated(updated: {
    id: string;
    columnId?: string;
    title?: string;
    description?: string | null;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: Date | null;
    assigneeId?: string | null;
  }) {
    setColumns((prevCols) => {
      let taskToMove: TaskCardProps["task"] | null = null;

      // Find task
      prevCols.forEach((col) => {
        const found = col.tasks.find((t) => t.id === updated.id);
        if (found) {
          const assigneeObj = updated.assigneeId !== undefined
            ? members.find((m) => m.id === updated.assigneeId) || null
            : found.assignee;

          taskToMove = {
            ...found,
            ...(updated.title !== undefined ? { title: updated.title } : {}),
            ...(updated.description !== undefined ? { description: updated.description } : {}),
            ...(updated.priority !== undefined ? { priority: updated.priority } : {}),
            ...(updated.dueDate !== undefined ? { dueDate: updated.dueDate } : {}),
            assignee: assigneeObj,
          };
        }
      });

      if (!taskToMove) return prevCols;

      // Check if column changed
      const targetColId = updated.columnId || (taskToMove as TaskCardProps["task"]).columnId;

      return prevCols.map((col) => {
        const remainingTasks = col.tasks.filter((t) => t.id !== updated.id);
        if (col.id === targetColId) {
          return {
            ...col,
            tasks: [...remainingTasks, { ...(taskToMove as TaskCardProps["task"]), columnId: targetColId }],
          };
        }
        return {
          ...col,
          tasks: remainingTasks,
        };
      });
    });
  }

  function handleTaskDeleted(taskId: string) {
    setColumns((prevCols) =>
      prevCols.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    );
    setSelectedTaskId(null);
  }

  const columnOptions = React.useMemo(() => {
    return columns.map((c) => ({ id: c.id, name: c.name }));
  }, [columns]);

  return (
    <div className="h-full flex flex-col min-h-0">
      {currentView === "kanban" && (
        <KanbanBoard
          workspaceId={workspaceId}
          projectId={projectId}
          boardId={boardId}
          initialColumns={columns}
          canManage={canManage}
          onTaskClick={(id) => setSelectedTaskId(id)}
        />
      )}

      {currentView === "list" && (
        <TaskListView
          tasks={allTasks}
          columns={columnOptions}
          onTaskClick={(id) => setSelectedTaskId(id)}
        />
      )}

      {currentView === "calendar" && (
        <TaskCalendarView
          tasks={allTasks}
          onTaskClick={(id) => setSelectedTaskId(id)}
        />
      )}

      {/* Task Detail Modal Drawer */}
      <TaskDetailModal
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        task={selectedTask}
        columns={columnOptions}
        members={members}
        currentUserId={currentUserId}
        canManage={canManage}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
}
