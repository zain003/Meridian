# FEAT-002-BE-projects-boards — P0

## Layer
Backend

## Goal
Implement Project and Board CRUD Server Actions, column management (create, reorder, delete), and workspace-scoped data access.

## Depends On
`000-shared-contracts.md`, `FEAT-001-VERIFY-auth-workspace.md`

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
export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
}

export interface CreateColumnInput {
  boardId: string;
  name: string;
  order?: number;
}

export interface ReorderColumnsInput {
  boardId: string;
  columnIds: string[];
}

export async function createProjectAction(
  input: CreateProjectInput
): Promise<ActionResponse<{ projectId: string; defaultBoardId: string }>>;

export async function getWorkspaceProjectsAction(
  workspaceId: string
): Promise<ActionResponse<Array<{ id: string; name: string; key: string; description: string | null }>>>;

export async function getProjectBoardsAction(
  projectId: string
): Promise<ActionResponse<Array<{ id: string; name: string; columns: Array<{ id: string; name: string; order: number }> }>>>;

export async function createColumnAction(
  input: CreateColumnInput
): Promise<ActionResponse<{ columnId: string }>>;

export async function reorderColumnsAction(
  input: ReorderColumnsInput
): Promise<ActionResponse<void>>;

export async function deleteColumnAction(
  columnId: string
): Promise<ActionResponse<void>>;
```

## Scope (In)
- Creating projects with automatic generation of a default board and default columns (Backlog, Todo, In Progress, Review, Done).
- Unique project `key` generation/validation within workspace scope (e.g., "MER", "OPS").
- Fetching workspace projects and project boards with ordered columns.
- Adding, renaming, reordering, and deleting columns within a board.
- RBAC validation requiring minimum `MEMBER` role for mutations and `VIEWER` for reads.

## Scope (Out)
- Task creation, moving, and updating within columns (handled in `FEAT-003-BE-tasks.md`).
- Real-time broadcasts for board column changes (handled in `FEAT-004-INT-realtime-sync.md`).

## Tech / Files to Touch
- `server/actions/projects.ts` — Project CRUD Server Actions.
- `server/actions/boards.ts` — Board and column management Server Actions.
- `lib/validations/project.ts` — Zod validation schemas for project and board inputs.

## Tests to Write FIRST
1. `createProjectAction`: Creates project and automatically provisions default board with 5 default columns; returns `{ success: true }`.
2. `createProjectAction` with duplicate key in same workspace: Fails with key collision error.
3. `reorderColumnsAction`: Updates `order` index for all provided column IDs in a single atomic transaction.
4. `deleteColumnAction` on column containing tasks: Rejects deletion or moves tasks to Backlog column.

## Implementation Steps
1. Create Zod schemas in `lib/validations/project.ts` for project creation, column addition, and column reordering.
2. Implement `createProjectAction` in `server/actions/projects.ts` with atomic transaction creating Project, Default Board, and 5 default Columns (Backlog, Todo, In Progress, Review, Done).
3. Implement `getWorkspaceProjectsAction` with `requireWorkspaceAccess` and `workspaceId` filter.
4. Implement `getProjectBoardsAction` in `server/actions/boards.ts` returning boards with columns sorted by `order ASC`.
5. Implement `createColumnAction` and `reorderColumnsAction` calculating sequential order numbers.
6. Implement `deleteColumnAction` ensuring columns with tasks are not deleted without fallback handling.

## Acceptance Criteria
- [ ] Creating a project automatically initializes a default board with Backlog, Todo, In Progress, Review, and Done columns.
- [ ] Duplicate project keys in the same workspace return `{ success: false, error: "KEY_ALREADY_EXISTS" }`.
- [ ] Users with `VIEWER` role attempting `createProjectAction` or `createColumnAction` receive `FORBIDDEN`.
- [ ] `reorderColumnsAction` updates the database column orders to match the exact array sequence passed in.
- [ ] All queries enforce strict `workspaceId` filtering.

## Definition of Done
- All 4 unit tests pass in Vitest.
- Strict TypeScript typecheck passes (`tsc --noEmit`).
- No direct database mutations without prior RBAC check.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Key collisions on project creation (e.g. two projects requesting key "ENG").
- Reordering with missing or stale column IDs.
- Deleting the only remaining column on a board (prevent empty boards).

## Pre-flight Check
Confirm `FEAT-001-VERIFY-auth-workspace.md` passed.

## What's Next
- `FEAT-002-FE-projects-boards.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-002-BE-projects-boards` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
