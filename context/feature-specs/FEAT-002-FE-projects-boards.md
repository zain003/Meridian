# FEAT-002-FE-projects-boards — P0

## Layer
Frontend

## Goal
Build the project navigation list in the workspace sidebar, project creation modal, board layout scaffold, and column header controls.

## Depends On
`FEAT-002-BE-projects-boards.md`

## Context Pack
```typescript
export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
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
export async function createProjectAction(input: CreateProjectInput): Promise<ActionResponse<{ projectId: string; defaultBoardId: string }>>;
export async function getWorkspaceProjectsAction(workspaceId: string): Promise<ActionResponse<Array<{ id: string; name: string; key: string; description: string | null }>>>;
export async function getProjectBoardsAction(projectId: string): Promise<ActionResponse<Array<{ id: string; name: string; columns: Array<{ id: string; name: string; order: number }> }>>>;
export async function createColumnAction(input: { boardId: string; name: string; order?: number }): Promise<ActionResponse<{ columnId: string }>>;
export async function reorderColumnsAction(input: { boardId: string; columnIds: string[] }): Promise<ActionResponse<void>>;
export async function deleteColumnAction(columnId: string): Promise<ActionResponse<void>>;
```

## Scope (In)
- Project list section in the workspace sidebar with active project indicator.
- "Create Project" modal dialog with name, uppercase key input, and description fields.
- Board viewport header with Project title, view selector tabs (Kanban, List, Calendar), and filter toolbar.
- Board column container scaffold and column headers with task count pill, menu dropdown, and "+ Add Task" button.
- "Add Column" button and inline title input at the end of the board.

## Scope (Out)
- Task drag-and-drop mechanics (handled in `FEAT-003-FE-kanban-dnd.md`).
- Real-time presence indicators in the top bar (handled in `FEAT-004-FE-presence-ui.md`).

## Tech / Files to Touch
- `components/workspace/sidebar.tsx` — Sidebar project tree integration (shadcn/ui, Lucide `Folder`, `Plus`).
- `components/projects/create-project-dialog.tsx` — Project creation dialog with React Hook Form + Zod and shadcn `Dialog`.
- `app/(dashboard)/[workspaceId]/projects/[projectId]/page.tsx` — Main project board page (Next.js 16 Server Component).
- `components/boards/board-header.tsx` — View switcher and toolbar (shadcn `Tabs`, `Button`, Lucide `Kanban`, `List`, `Calendar`).
- `components/boards/board-column-header.tsx` — Column title, badge task counter, and shadcn `DropdownMenu` (Lucide `MoreHorizontal`, `Plus`, `Trash2`).
- `components/boards/add-column-button.tsx` — Inline add column trigger with React Hook Form + Zod.

## Tests to Write FIRST
1. `Sidebar Projects List`: Fetches and renders all workspace projects returned by `getWorkspaceProjectsAction`.
2. `Create Project Modal`: Auto-generates key from project name (e.g. "Mobile App" ➔ "MOB") and submits valid form using React Hook Form + Zod.
3. `Board View Tabs`: Switching between Kanban, List, and Calendar updates URL query parameter (`?view=kanban`).
4. `Add Column Component`: Inline form creates new column with Zod validation and adds it to the board view.

## Implementation Steps
1. Update `components/workspace/sidebar.tsx` to render project links with Lucide icons using `getWorkspaceProjectsAction`.
2. Create `components/projects/create-project-dialog.tsx` using React Hook Form, Zod schema (`createProjectSchema`), shadcn `<Form>`, `<Dialog>`, `<Input>`, and uppercase key input auto-generator.
3. Build `app/(dashboard)/[workspaceId]/projects/[projectId]/page.tsx` as Next.js 16 Server Component fetching board and column data.
4. Build `components/boards/board-header.tsx` with shadcn `Tabs` and Lucide icons for Kanban, List, and Calendar views.
5. Build `components/boards/board-column-header.tsx` displaying column name, shadcn `Badge` count, and column options dropdown menu (`DropdownMenu`).
6. Build `components/boards/add-column-button.tsx` with inline React Hook Form + Zod input for column creation at the end of the horizontal board.

## Acceptance Criteria
- [ ] Clicking a project in the sidebar navigates to `/[workspaceId]/projects/[projectId]`.
- [ ] Submitting the Create Project dialog creates the project and redirects to its default board.
- [ ] View tabs switch active view in state and sync with `?view=` URL query parameter.
- [ ] Adding a new column renders it immediately at the end of the column list.
- [ ] Deleting a column triggers a confirmation modal before removing it from the board.

## Definition of Done
- Component tests pass in Vitest.
- Design tokens, morphism, and styling strictly conform to `context/UI/UI-Rules.md` and `ui-context.md`.
- `tsc --noEmit` passes with 0 errors.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Empty project list state in sidebar (render "+ Create first project" prompt).
- Extremely long project names (truncate with tooltip).
- User without permission viewing read-only board (hide column addition and project creation triggers).

## Pre-flight Check
Confirm `FEAT-002-BE-projects-boards.md` tests pass and `000-shared-contracts.md` types are imported.

## What's Next
- `FEAT-002-VERIFY-projects-boards.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-002-FE-projects-boards` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
