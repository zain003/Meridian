# FEAT-003-FE-kanban-dnd — P0

## Layer
Frontend

## Goal
Build the drag-and-drop Kanban board interface using `@dnd-kit`, featuring optimistic task card reordering across columns and smooth drag overlays.

## Depends On
`FEAT-003-BE-tasks.md`

## Context Pack
```typescript
export interface MoveTaskInput {
  taskId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  newOrder: number;
}

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
```

## Consumes
```typescript
export async function moveTaskAction(input: MoveTaskInput): Promise<ActionResponse<void>>;
export async function createTaskAction(input: CreateTaskInput): Promise<ActionResponse<{ taskId: string }>>;
```

## Scope (In)
- Interactive Kanban board powered by `@dnd-kit/core` and `@dnd-kit/sortable`.
- Task card component (`TaskCard`) displaying title, priority badge, due date indicator, subtask completion count, and assignee avatar.
- Drag overlay rendering a stylized preview of the dragged task card.
- Optimistic UI updates when dropping a card into a new column or reordering within a column.
- Quick inline "+ Add task" input at the bottom of each column.

## Scope (Out)
- Task detail modal dialog (handled in `FEAT-003-FE-task-views.md`).
- Multi-user live drag cursor broadcasting (handled in `FEAT-004-FE-presence-ui.md`).

## Tech / Files to Touch
- `components/boards/kanban-board.tsx` — Main `@dnd-kit` DndContext container (Next.js 16 Client Component).
- `components/boards/kanban-column.tsx` — SortableContext column wrapper (shadcn `Card`, `Badge`).
- `components/tasks/task-card.tsx` — Draggable task card item (shadcn `Badge`, `Avatar`, Lucide `Clock`, `CheckSquare`, `AlertCircle`, `GripVertical`).
- `components/tasks/task-drag-overlay.tsx` — Active dragging preview.
- `components/tasks/quick-add-task.tsx` — Inline task creation form in column using React Hook Form + Zod (`createTaskSchema`, shadcn `Input`, `Button`, Lucide `Plus`).

## Tests to Write FIRST
1. `Kanban Board Render`: Renders all columns and task cards passed via initial server props.
2. `Task Card Component`: Displays correct priority styling (Urgent, High, Medium, Low) and subtask ratio (e.g. `2/4`) with Lucide icons.
3. `Optimistic Drag-and-Drop`: Dropping task in new column immediately updates local state and dispatches `moveTaskAction`.
4. `Quick Add Task`: Submitting inline form with React Hook Form + Zod validates input, invokes `createTaskAction`, and clears input.

## Implementation Steps
1. Install and configure `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`.
2. Build `TaskCard` component with drag handle, priority badge, due date badge, Lucide icons, and avatar.
3. Build `KanbanColumn` using `useDroppable` and `SortableContext`.
4. Implement `KanbanBoard` with `DndContext`, `pointerWithin` collision detection, and sensors (Pointer + Keyboard).
5. Implement `QuickAddTask` with React Hook Form, Zod schema (`createTaskSchema`), and shadcn `<Input>`.
6. Implement optimistic reorder handler in `onDragEnd` and trigger `moveTaskAction` in background.
7. Add error rollback logic reverting local state if `moveTaskAction` returns `{ success: false }`.

## Acceptance Criteria
- [ ] Task cards can be picked up, dragged, and dropped into different columns or positions within the same column.
- [ ] Task card position updates instantly on drop without UI flicker or waiting for server roundtrip.
- [ ] If the server action fails, the task card snaps back to its original column and an error toast appears.
- [ ] Priority badges match the color tokens specified in `ui-context.md` (Red for Urgent, Amber for High, etc.).
- [ ] Quick-add input creates a new card and focuses the input for rapid multi-task entry.

## Definition of Done
- Component drag interactions pass automated Vitest tests.
- UI uses design tokens, card glassmorphism, and drag overlay styling from `context/UI/UI-Rules.md` and `ui-context.md`.
- `tsc --noEmit` passes with zero errors.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Dragging card over an empty column.
- Dragging cancelled midway (e.g. user presses `Escape`).
- Rapid consecutive drags before initial server action completes.

## Pre-flight Check
Confirm `FEAT-003-BE-tasks.md` is complete and tests pass.

## What's Next
- `FEAT-003-FE-task-views.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-003-FE-kanban-dnd` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
