# FEAT-002-VERIFY-projects-boards — P0

## Files Being Verified
- `FEAT-002-BE-projects-boards.md`
- `FEAT-002-FE-projects-boards.md`

## 1. Automated Test Execution

Run the automated test suite and record outcomes:

- [ ] `vitest run tests/unit/projects-boards.test.ts` — Pass / Fail
  - `createProjectAction`: Provisions project, default board, and default columns.
  - Duplicate project key constraint prevents collisions within the same workspace.
  - `reorderColumnsAction`: Atomically reorders column indices in database.
  - `deleteColumnAction`: Validates column deletion rules and handles orphaned tasks.
- [ ] `vitest run tests/components/board-scaffold.test.tsx` — Pass / Fail
  - Project sidebar renders active projects.
  - Project creation dialog submits and auto-generates key.
  - View switcher updates URL query parameters.
  - Add column inline form triggers `createColumnAction`.

## 2. Acceptance Criteria Verification

Individually verify each criterion against the live running environment:

- [ ] Creating a project automatically initializes a default board with Backlog, Todo, In Progress, Review, and Done columns.
- [ ] Duplicate project keys in the same workspace return `{ success: false, error: "KEY_ALREADY_EXISTS" }`.
- [ ] Users with `VIEWER` role attempting `createProjectAction` or `createColumnAction` receive `FORBIDDEN`.
- [ ] `reorderColumnsAction` updates the database column orders to match the exact array sequence passed in.
- [ ] Clicking a project in the sidebar navigates to `/[workspaceId]/projects/[projectId]`.
- [ ] Submitting the Create Project dialog creates the project and redirects to its default board.
- [ ] View tabs switch active view in state and sync with `?view=` URL query parameter.
- [ ] Adding a new column renders it immediately at the end of the column list.
- [ ] Deleting a column triggers a confirmation modal before removing it from the board.

## 3. Definition of Done Confirmation

- [ ] All unit and component tests pass without errors.
- [ ] `tsc --noEmit` passes with zero type errors.
- [ ] `npm run lint` passes with no warnings.
- [ ] Design system tokens and layout constraints adhered to.
- [ ] `DEVIATIONS.md` updated if applicable.

## 4. Verification Verdict
- [ ] **PASSED**: All criteria and tests verified. Update `INDEX.md` status to `Completed`.
- [ ] **FAILED**: Provide failure details below and return to the corresponding file for remediation.

*Failure Notes (if any):*
- None.
