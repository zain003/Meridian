"use client";

import * as React from "react";
import { KanbanBoard, type ColumnData } from "@/components/boards/kanban-board";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import type { TaskCardProps } from "@/components/tasks/task-card";
import { usePresenceChannel } from "@/hooks/use-presence-channel";
import { useBoardRealtimeSync } from "@/hooks/use-board-realtime";

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

  const { activeCardViewers, broadcastTaskView, broadcastTaskLeave } =
    usePresenceChannel(workspaceId, boardId, currentUserId);

  useBoardRealtimeSync({
    boardId,
    currentUserId,
    onTaskCreated: (data) => {
      if (!data || !data.id || !data.columnId) return;
      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === data.columnId) {
            if (col.tasks.some((t) => t.id === data.id)) return col;
            return {
              ...col,
              tasks: [
                ...col.tasks,
                {
                  id: data.id as string,
                  columnId: data.columnId as string,
                  title: (data.title as string) || "Untitled Task",
                  priority: (data.priority as TaskCardProps["task"]["priority"]) || "MEDIUM",
                  order: (data.order as number) || col.tasks.length,
                  dueDate: (data.dueDate as Date | string | null) || null,
                },
              ],
            };
          }
          return col;
        })
      );
    },
    onTaskMoved: (payload) => {
      const { taskId, destinationColumnId, columnId, newOrder, order } = payload;
      const targetColId = destinationColumnId || columnId;
      const targetOrder = newOrder ?? order ?? 0;
      if (!targetColId) return;

      setColumns((prev) => {
        let taskItem: TaskCardProps["task"] | null = null;
        prev.forEach((col) => {
          const found = col.tasks.find((t) => t.id === taskId);
          if (found) taskItem = { ...found, columnId: targetColId, order: targetOrder };
        });

        if (!taskItem) return prev;

        return prev.map((col) => {
          const filtered = col.tasks.filter((t) => t.id !== taskId);
          if (col.id === targetColId) {
            const nextTasks = [...filtered, taskItem!].sort((a, b) => a.order - b.order);
            return { ...col, tasks: nextTasks };
          }
          return { ...col, tasks: filtered };
        });
      });
    },
    onTaskUpdated: (data) => {
      if (!data || !data.taskId) return;
      handleTaskUpdated({
        id: data.taskId as string,
        title: data.title as string | undefined,
        description: data.description as string | null | undefined,
        priority: data.priority as TaskCardProps["task"]["priority"] | undefined,
        dueDate: data.dueDate ? new Date(data.dueDate as string) : undefined,
        assigneeId: data.assigneeId as string | null | undefined,
        columnId: data.columnId as string | undefined,
      });
    },
    onTaskDeleted: ({ taskId }) => {
      handleTaskDeleted(taskId);
    },
  });

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

  const handleOpenTask = (id: string) => {
    setSelectedTaskId(id);
    broadcastTaskView(id);
  };

  const handleCloseTask = () => {
    if (selectedTaskId) {
      broadcastTaskLeave(selectedTaskId);
    }
    setSelectedTaskId(null);
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {currentView === "kanban" && (
        <KanbanBoard
          workspaceId={workspaceId}
          projectId={projectId}
          boardId={boardId}
          initialColumns={columns}
          cardViewers={activeCardViewers}
          canManage={canManage}
          onTaskClick={handleOpenTask}
        />
      )}

      {currentView === "list" && (
        <TaskListView
          tasks={allTasks}
          columns={columnOptions}
          onTaskClick={handleOpenTask}
        />
      )}

      {currentView === "calendar" && (
        <TaskCalendarView
          tasks={allTasks}
          onTaskClick={handleOpenTask}
        />
      )}

      {/* Task Detail Modal Drawer */}
      <TaskDetailModal
        isOpen={Boolean(selectedTaskId)}
        onClose={handleCloseTask}
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
