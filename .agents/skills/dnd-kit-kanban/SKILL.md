---
name: dnd-kit-kanban
description: >-
  Provides patterns and guidelines for implementing accessible, high-performance drag-and-drop
  Kanban boards using @dnd-kit/core and @dnd-kit/sortable in Next.js 16 with optimistic UI updates.
  Use when building or modifying Kanban boards, task cards, sortable columns, and drop indicators.
---

# @dnd-kit Kanban Board Skill

## Overview

Meridian uses **`@dnd-kit/core`** and **`@dnd-kit/sortable`** for accessible, performant multi-column task reordering with zero UI jank and instant optimistic reconciliation.

## Core Packages

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Implementation Architecture

1. **`KanbanBoard` (DndContext Container)**:
   - Configures `PointerSensor` (activation constraint: `distance: 5` to prevent accidental drag during click) and `KeyboardSensor` (`sortableKeyboardCoordinates`).
   - Uses `pointerWithin` or `closestCorners` collision detection algorithm.
   - Manages active dragging item in `DragOverlay` to prevent DOM layout shift.

2. **`KanbanColumn` (SortableContext & Droppable)**:
   - Wraps task cards in `<SortableContext items={taskIds} strategy={verticalListSortingStrategy}>`.
   - Attaches `useDroppable` to the column container for empty column drops.

3. **`TaskCard` (useSortable)**:
   - Uses `useSortable({ id: task.id })` providing `attributes`, `listeners`, `setNodeRef`, `transform`, `transition`, and `isDragging`.
   - Renders drag handle or enables drag across the card surface while keeping interactive child buttons/menus isolated.

## Optimistic State & Rollback Pattern

```tsx
"use client";

import { useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { moveTaskAction } from "@/server/actions/tasks";
import { toast } from "sonner";

export function useOptimisticKanban(initialColumns: ColumnWithTasks[]) {
  const [columns, setColumns] = useState(initialColumns);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const previousColumns = [...columns];
    
    // 1. Calculate optimistic reorder
    const updated = calculateNewColumnState(columns, active.id as string, over.id as string);
    setColumns(updated);

    // 2. Dispatch Server Action in background
    const result = await moveTaskAction({
      taskId: active.id as string,
      targetColumnId: getTargetColumnId(updated, active.id as string),
      newOrder: getTaskOrder(updated, active.id as string),
    });

    // 3. Rollback if server rejects mutation
    if (!result.success) {
      setColumns(previousColumns);
      toast.error("Failed to move task. Reverting changes.");
    }
  }

  return { columns, handleDragEnd };
}
```
