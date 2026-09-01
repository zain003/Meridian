# FEAT-003-VERIFY-tasks — P0

## Files Being Verified
- `FEAT-003-BE-tasks.md`
- `FEAT-003-FE-kanban-dnd.md`
- `FEAT-003-FE-task-views.md`

## 1. Automated Test Execution

Run the automated test suite and record outcomes:

- [ ] `vitest run tests/unit/tasks.test.ts` — Pass / Fail
  - `createTaskAction`: Inserts task and assigns order correctly.
  - `moveTaskAction`: Shifts order indices accurately across columns.
  - `updateTaskAction`: Updates title, priority, assignee, and dates.
  - `toggleSubtaskAction`: Updates completion state.
  - `addCommentAction`: Saves comment with correct user and task links.
- [ ] `vitest run tests/components/kanban-dnd.test.tsx` — Pass / Fail
  - Card drag and drop between columns updates state optimistically.
  - Quick-add input dispatches creation action.
- [ ] `vitest run tests/components/task-views.test.tsx` — Pass / Fail
  - List view sorts tasks by column headers.
  - Calendar view maps tasks to due dates.
  - Detail modal opens and updates task metadata.

## 2. Acceptance Criteria Verification

Individually verify each criterion against the live running environment:

- [ ] Tasks created without explicit order are assigned the highest order index + 1 in that column.
- [ ] `moveTaskAction` successfully relocates a task from Column A to Column B and updates order indices.
- [ ] Task card position updates instantly on drop without UI flicker or waiting for server roundtrip.
- [ ] If the server action fails, the task card snaps back to its original column and an error toast appears.
- [ ] Switching to List view renders all tasks in structured rows with sortable column headers.
- [ ] Switching to Calendar view positions tasks accurately on their due dates.
- [ ] Clicking any task opens the Task Detail Modal with 65/35 split layout.
- [ ] Editing the task title, description, status, or assignee saves changes via `updateTaskAction`.
- [ ] Adding and checking off subtasks updates the progress indicator.
- [ ] Posting a comment adds the comment immediately to the stream.

## 3. Definition of Done Confirmation

- [ ] All unit and component tests pass without errors.
- [ ] `tsc --noEmit` passes with zero type errors.
- [ ] `npm run lint` passes with no warnings.
- [ ] Optimistic rollback is verified on simulated network failure.
- [ ] `DEVIATIONS.md` updated if applicable.

## 4. Verification Verdict
- [ ] **PASSED**: All criteria and tests verified. Update `INDEX.md` status to `Completed`.
- [ ] **FAILED**: Provide failure details below and return to the corresponding file for remediation.

*Failure Notes (if any):*
- None.
