# FEAT-003-BE-tasks — P0

## Layer
Backend

## Goal
Implement Task CRUD Server Actions, subtasks, labels, task reordering across/within columns, comments, and task assignment logic.

## Depends On
`000-shared-contracts.md`, `FEAT-002-VERIFY-projects-boards.md`

## Context Pack
```typescript
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
```

## Provides / Exposes
```typescript
export interface CreateTaskInput {
  workspaceId: string;
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date | null;
  assigneeId?: string | null;
  labelIds?: string[];
}

export interface MoveTaskInput {
  taskId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  newOrder: number;
}

export interface UpdateTaskInput {
  taskId: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date | null;
  assigneeId?: string | null;
  columnId?: string;
  completedAt?: Date | null;
}

export async function createTaskAction(
  input: CreateTaskInput
): Promise<ActionResponse<{ taskId: string }>>;

export async function moveTaskAction(
  input: MoveTaskInput
): Promise<ActionResponse<void>>;

export async function updateTaskAction(
  input: UpdateTaskInput
): Promise<ActionResponse<void>>;

export async function deleteTaskAction(
  taskId: string
): Promise<ActionResponse<void>>;

export async function toggleSubtaskAction(
  subtaskId: string,
  isDone: boolean
): Promise<ActionResponse<void>>;

export async function addCommentAction(
  taskId: string,
  content: string
): Promise<ActionResponse<{ commentId: string }>>;
```

## Scope (In)
- Task creation with order calculation (placed at bottom of target column).
- Reordering tasks within the same column or moving across columns.
- Updating task title, rich markdown description, priority, due date, and assignee.
- Subtask creation and toggle completion state.
- Adding comments with author attribution and timestamp.
- Task deletion with cascade deletion of subtasks and comments.

## Scope (Out)
- Front-end drag-and-drop mechanics (handled in `FEAT-003-FE-kanban-dnd.md`).
- Multi-view UI rendering (handled in `FEAT-003-FE-task-views.md`).
- Emitting real-time WebSocket events (handled in `FEAT-004-INT-realtime-sync.md`).
- Triggering automation engine rules (handled in `FEAT-005-INT-queue-worker.md`).

## Tech / Files to Touch
- `server/actions/tasks.ts` — Task CRUD and movement Server Actions.
- `server/actions/subtasks.ts` — Subtask actions.
- `server/actions/comments.ts` — Comment actions.
- `lib/validations/task.ts` — Zod validation schemas for task inputs.

## Tests to Write FIRST
1. `createTaskAction`: Creates task with calculated order in column; returns `{ success: true, data: { taskId } }`.
2. `moveTaskAction`: Shifts order of adjacent tasks in target column and updates task `columnId`.
3. `updateTaskAction`: Modifies priority/assignee and sets `completedAt` timestamp if moved to Done column.
4. `toggleSubtaskAction`: Updates `isDone` boolean for target subtask.
5. `addCommentAction`: Creates comment record and links to user and task.

## Implementation Steps
1. Create Zod validation schemas in `lib/validations/task.ts`.
2. Implement `createTaskAction` calculating `MAX(order) + 1` in target column.
3. Implement `moveTaskAction` in a transaction: update target column items' `order` field and destination column items.
4. Implement `updateTaskAction` with partial updates and RBAC verification.
5. Implement `deleteTaskAction` ensuring user has at least `MEMBER` role.
6. Implement `toggleSubtaskAction` and `addCommentAction` with author attribution.

## Acceptance Criteria
- [ ] Tasks created without explicit order are assigned the highest order index + 1 in that column.
- [ ] `moveTaskAction` successfully relocates a task from Column A to Column B and updates order indices.
- [ ] Users with `VIEWER` role cannot create, move, update, or delete tasks.
- [ ] Subtask toggle accurately updates `isDone` in database.
- [ ] Deleting a task deletes all related comments, subtasks, and task label associations.

## Definition of Done
- All 5 unit tests pass in Vitest.
- `tsc --noEmit` passes with zero type errors.
- All mutations execute within Prisma transactions where multi-row updates occur.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Moving task to an empty column (sets `newOrder = 0`).
- Concurrent moves (handle order index recalculation safely).
- Reassigning task to a user who is not a member of the workspace (reject with validation error).

## Pre-flight Check
Confirm `FEAT-002-VERIFY-projects-boards.md` passed.

## What's Next
- `FEAT-003-FE-kanban-dnd.md`
- `FEAT-003-FE-task-views.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-003-BE-tasks` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
