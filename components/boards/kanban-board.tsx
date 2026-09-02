"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/boards/kanban-column";
import { TaskDragOverlay } from "@/components/tasks/task-drag-overlay";
import { AddColumnButton } from "@/components/boards/add-column-button";
import { moveTaskAction } from "@/server/actions/tasks";
import type { TaskCardProps } from "@/components/tasks/task-card";
import type { RealtimePresenceUser } from "@/hooks/use-presence-channel";

export interface ColumnData {
  id: string;
  name: string;
  order: number;
  tasks: TaskCardProps["task"][];
}

export interface KanbanBoardProps {
  workspaceId: string;
  projectId: string;
  boardId?: string;
  initialColumns: ColumnData[];
  cardViewers?: Record<string, RealtimePresenceUser[]>;
  canManage?: boolean;
  onTaskClick?: (taskId: string) => void;
}

export function KanbanBoard({
  workspaceId,
  projectId,
  boardId,
  initialColumns,
  cardViewers,
  canManage = false,
  onTaskClick,
}: KanbanBoardProps) {
  const [columns, setColumns] = React.useState<ColumnData[]>(initialColumns);
  const [activeTask, setActiveTask] = React.useState<TaskCardProps["task"] | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Snapshot for error rollback
  const snapshotRef = React.useRef<ColumnData[]>(initialColumns);
  const [prevInitialColumns, setPrevInitialColumns] = React.useState<ColumnData[]>(initialColumns);

  // Synchronize state when initialColumns updates from server
  if (initialColumns !== prevInitialColumns) {
    setPrevInitialColumns(initialColumns);
    setColumns(initialColumns);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function findColumnOfTask(taskId: string): ColumnData | undefined {
    return columns.find((col) => col.tasks.some((t) => t.id === taskId));
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const taskId = active.id as string;
    const sourceCol = findColumnOfTask(taskId);
    if (!sourceCol) return;

    const task = sourceCol.tasks.find((t) => t.id === taskId) || null;
    setActiveTask(task);
    snapshotRef.current = JSON.parse(JSON.stringify(columns));
    setErrorMessage(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const sourceCol = findColumnOfTask(activeTaskId);
    // Over could be a task or a column
    let destCol = findColumnOfTask(overId);
    if (!destCol) {
      destCol = columns.find((c) => c.id === overId);
    }

    if (!sourceCol || !destCol || sourceCol.id === destCol.id) {
      return;
    }

    setColumns((prevCols) => {
      const activeColIndex = prevCols.findIndex((c) => c.id === sourceCol.id);
      const destColIndex = prevCols.findIndex((c) => c.id === destCol.id);

      if (activeColIndex === -1 || destColIndex === -1) return prevCols;

      const activeCol = prevCols[activeColIndex];
      const targetCol = prevCols[destColIndex];

      const activeTaskItem = activeCol.tasks.find((t) => t.id === activeTaskId);
      if (!activeTaskItem) return prevCols;

      // Filter active task from source
      const newSourceTasks = activeCol.tasks.filter((t) => t.id !== activeTaskId);

      // Determine insert index in dest
      let insertIndex = targetCol.tasks.length;
      const overTaskIndex = targetCol.tasks.findIndex((t) => t.id === overId);
      if (overTaskIndex !== -1) {
        insertIndex = overTaskIndex;
      }

      const updatedTask = {
        ...activeTaskItem,
        columnId: targetCol.id,
      };

      const newDestTasks = [
        ...targetCol.tasks.slice(0, insertIndex),
        updatedTask,
        ...targetCol.tasks.slice(insertIndex),
      ];

      const newCols = [...prevCols];
      newCols[activeColIndex] = { ...activeCol, tasks: newSourceTasks };
      newCols[destColIndex] = { ...targetCol, tasks: newDestTasks };

      return newCols;
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      setColumns(snapshotRef.current);
      return;
    }

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Snapshot lookup for original location
    const originalCol = snapshotRef.current.find((col) =>
      col.tasks.some((t) => t.id === activeTaskId)
    );

    if (!originalCol) return;

    // Current location in optimistic state
    const currentDestCol = findColumnOfTask(activeTaskId);
    if (!currentDestCol) {
      setColumns(snapshotRef.current);
      return;
    }

    const finalColId = currentDestCol.id;
    let finalOrder = currentDestCol.tasks.findIndex((t) => t.id === activeTaskId);

    // If dropped in same column and reordered
    if (originalCol.id === currentDestCol.id) {
      const oldIndex = currentDestCol.tasks.findIndex((t) => t.id === activeTaskId);
      const newIndex = currentDestCol.tasks.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedTasks = arrayMove(currentDestCol.tasks, oldIndex, newIndex);
        setColumns((prev) =>
          prev.map((col) =>
            col.id === currentDestCol.id
              ? { ...col, tasks: reorderedTasks }
              : col
          )
        );
        finalOrder = newIndex;
      } else {
        finalOrder = oldIndex;
      }
    }

    // Call server action
    try {
      const res = await moveTaskAction({
        taskId: activeTaskId,
        sourceColumnId: originalCol.id,
        destinationColumnId: finalColId,
        newOrder: finalOrder < 0 ? 0 : finalOrder,
      });

      if (!res.success) {
        // Rollback
        setColumns(snapshotRef.current);
        setErrorMessage(res.error || "Failed to move task. Reverting changes.");
      }
    } catch {
      // Rollback on network/fatal exception
      setColumns(snapshotRef.current);
      setErrorMessage("Failed to move task. Reverting changes.");
    }
  }

  function handleTaskCreated(newTask: {
    id: string;
    columnId: string;
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    order: number;
  }) {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === newTask.columnId) {
          const taskToAdd: TaskCardProps["task"] = {
            id: newTask.id,
            columnId: newTask.columnId,
            title: newTask.title,
            priority: newTask.priority,
            order: col.tasks.length,
            dueDate: null,
            completedAt: null,
            assignee: null,
            subtasks: [],
            _count: { subtasks: 0, comments: 0 },
            labels: [],
          };
          return {
            ...col,
            tasks: [...col.tasks, taskToAdd],
          };
        }
        return col;
      })
    );
  }

  return (
    <div className="flex flex-col h-full space-y-2">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400"
          data-testid="dnd-error-banner"
        >
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-300 font-semibold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex-1 flex items-start gap-4 overflow-x-auto pb-4 pt-1 custom-scrollbar min-h-0"
          data-testid="kanban-board-container"
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              workspaceId={workspaceId}
              projectId={projectId}
              column={column}
              tasks={column.tasks}
              cardViewers={cardViewers}
              canManage={canManage}
              onTaskCreated={handleTaskCreated}
              onTaskClick={onTaskClick}
            />
          ))}

          {/* Add Column Button */}
          {boardId && (
            <AddColumnButton boardId={boardId} canManage={canManage} />
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          <TaskDragOverlay task={activeTask} />
        </DragOverlay>
      </DndContext>
    </div>
  );
}
