# FEAT-003-FE-task-views — P0

## Layer
Frontend

## Goal
Build the List view table, Calendar view, and the comprehensive Task Detail Drawer/Modal with subtasks, markdown description editing, and comment stream.

## Depends On
`FEAT-003-BE-tasks.md`, `FEAT-003-FE-kanban-dnd.md`

## Context Pack
```typescript
export interface UpdateTaskInput {
  taskId: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date | null;
  assigneeId?: string | null;
  columnId?: string;
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
export async function updateTaskAction(input: UpdateTaskInput): Promise<ActionResponse<void>>;
export async function deleteTaskAction(taskId: string): Promise<ActionResponse<void>>;
export async function toggleSubtaskAction(subtaskId: string, isDone: boolean): Promise<ActionResponse<void>>;
export async function addCommentAction(taskId: string, content: string): Promise<ActionResponse<{ commentId: string }>>;
```

## Scope (In)
- List view: Sortable, filterable table displaying task rows with status, priority, due date, and assignee.
- Calendar view: Monthly grid displaying tasks on their respective due dates with click-to-open.
- Task Detail Modal / Slide-over:
  - Left panel (65%): Editable title, markdown description editor, subtasks checklist with add/toggle/delete, and real-time comment stream.
  - Right panel (35%): Status dropdown, priority picker, assignee combobox, due date calendar picker, and labels.
- Keyboard shortcuts (`Cmd+Enter` to save comment, `Esc` to close modal).

## Scope (Out)
- Automation rule visual builder (handled in `FEAT-005-FE-rule-builder.md`).
- Live real-time collaboration avatars (handled in `FEAT-004-FE-presence-ui.md`).

## Tech / Files to Touch
- `components/tasks/task-list-view.tsx` — Table-based list view component (shadcn `Table`, `Badge`, `Avatar`, Lucide icons).
- `components/tasks/task-calendar-view.tsx` — Monthly calendar grid view (shadcn `Card`, `Badge`, Lucide `ChevronLeft`, `ChevronRight`).
- `components/tasks/task-detail-modal.tsx` — Split-view detail modal with React Hook Form + Zod (shadcn `Dialog` / `Sheet`, `Select`, `Button`, Lucide `X`, `Calendar`, `User`, `Tag`).
- `components/tasks/task-subtasks.tsx` — Subtask list with React Hook Form + Zod, completion progress bar (shadcn `Progress`, `Checkbox`, Lucide `Plus`, `Trash2`).
- `components/tasks/task-comments.tsx` — Markdown comment stream and input form with React Hook Form + Zod (shadcn `Textarea`, `Button`, `Avatar`, Lucide `Send`, `MessageSquare`).

## Tests to Write FIRST
1. `List View Table`: Renders task rows with correct priority badges, sorting by due date when column header is clicked.
2. `Calendar View Grid`: Renders task pills on days matching `dueDate`.
3. `Task Detail Modal`: Opens on task card click, binds fields with React Hook Form, and displays all task metadata.
4. `Subtask Progress`: Toggling a subtask checkbox updates progress bar and calls `toggleSubtaskAction`.
5. `Comment Stream`: Submitting a comment via React Hook Form validates schema, appends it to the thread, and resets input.

## Implementation Steps
1. Build `TaskListView` using shadcn `Table` and `Badge` with sorting and column selection.
2. Build `TaskCalendarView` calculating calendar days in month and placing task pills with Lucide icons on corresponding days.
3. Build `TaskDetailModal` using shadcn `Dialog` / `Sheet` with 65/35 split layout, binding metadata controls with React Hook Form and Zod schemas (`updateTaskSchema`).
4. Implement markdown description editor with live preview toggle using shadcn `Tabs`.
5. Implement `TaskSubtasks` component with React Hook Form inline addition, shadcn `Progress`, and `Checkbox`.
6. Implement `TaskComments` component with React Hook Form + Zod (`createCommentSchema`), author avatar, timestamp, and submit button with Lucide `Send`.

## Acceptance Criteria
- [ ] Switching to List view renders all tasks in structured rows with sortable column headers.
- [ ] Switching to Calendar view positions tasks accurately on their due dates.
- [ ] Clicking any task opens the Task Detail Modal with full metadata.
- [ ] Editing the task title, description, status, or assignee saves changes via `updateTaskAction`.
- [ ] Adding and checking off subtasks updates the progress indicator.
- [ ] Posting a comment adds the comment immediately to the stream.

## Definition of Done
- All component tests pass in Vitest.
- Visual styling strictly conforms to `context/UI/UI-Rules.md` and `ui-context.md` (65/35 split, typography, colors, morphism).
- `tsc --noEmit` passes with 0 errors.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Task with no due date in calendar view (not displayed on grid, listed in "Unscheduled" drawer).
- Long comment text handling (word-wrap with markdown support).
- Closing modal with unsaved title edits (auto-save on blur).

## Pre-flight Check
Confirm `FEAT-003-FE-kanban-dnd.md` is complete.

## What's Next
- `FEAT-003-VERIFY-tasks.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-003-FE-task-views` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
