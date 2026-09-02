# Test Execution Report — FEAT-003-BE: Task CRUD, Column Movement, Subtasks & Comments

> **Feature Specs**: [`FEAT-003-BE-tasks.md`](file:///c:/Users/zaina/Desktop/meridian/context/feature-specs/FEAT-003-BE-tasks.md)  
> **Execution Date**: 2026-09-02  
> **Overall Verdict**: ✅ **PASSED (47 / 47 Feature Tests Passed, 148 / 148 Global Suite Passed)**  
> **TypeScript Strict Mode**: ✅ **0 Errors (`tsc --noEmit`)**  
> **ESLint Code Quality**: ✅ **0 Warnings / 0 Errors (`npm run lint`)**  
> **Database Scoping**: ✅ **Prisma Queries Scoped by `workspaceId` & RBAC Protected**

---

## 1. Test Suite Summary Table

| Test Suite | Layer | Total Tests | Passed | Failed | Duration | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [`tests/unit/task-validations.test.ts`](file:///c:/Users/zaina/Desktop/meridian/tests/unit/task-validations.test.ts) | Backend / Zod Schemas | 17 | 17 | 0 | 73ms | ✅ PASS |
| [`tests/unit/tasks.test.ts`](file:///c:/Users/zaina/Desktop/meridian/tests/unit/tasks.test.ts) | Backend / Task Server Actions | 14 | 14 | 0 | 61ms | ✅ PASS |
| [`tests/unit/subtasks.test.ts`](file:///c:/Users/zaina/Desktop/meridian/tests/unit/subtasks.test.ts) | Backend / Subtask Actions | 6 | 6 | 0 | 22ms | ✅ PASS |
| [`tests/unit/comments.test.ts`](file:///c:/Users/zaina/Desktop/meridian/tests/unit/comments.test.ts) | Backend / Comment Actions | 6 | 6 | 0 | 16ms | ✅ PASS |
| [`tests/unit/labels.test.ts`](file:///c:/Users/zaina/Desktop/meridian/tests/unit/labels.test.ts) | Backend / Label Actions | 4 | 4 | 0 | 16ms | ✅ PASS |
| **FEAT-003-BE TOTALS** | **Backend & Validation** | **47** | **47** | **0** | **~188ms** | ✅ **100% PASS** |

---

## 2. Granular Test Cases Matrix

### 2.1 Task Validation Schemas (`tests/unit/task-validations.test.ts`)
| Test ID | Test Case Description | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| `TC-VAL-TSK-01` | `createTaskSchema` validates valid task with default `priority: "MEDIUM"` and empty `labelIds` | Validated with defaults | ✅ PASS |
| `TC-VAL-TSK-02` | `createTaskSchema` validates full task payload with priority, dueDate, assigneeId, and labels | Type-coerced and validated | ✅ PASS |
| `TC-VAL-TSK-03` | `createTaskSchema` rejects empty title and missing required identifiers | Validation errors returned | ✅ PASS |
| `TC-VAL-TSK-04` | `createTaskSchema` rejects titles exceeding 200 characters | Validation error returned | ✅ PASS |
| `TC-VAL-TSK-05` | `createTaskSchema` rejects invalid priority enum values | Validation error returned | ✅ PASS |
| `TC-VAL-MOV-01` | `moveTaskSchema` validates valid move payload | Validated successfully | ✅ PASS |
| `TC-VAL-MOV-02` | `moveTaskSchema` rejects negative order and missing column IDs | Validation error returned | ✅ PASS |
| `TC-VAL-UPD-01` | `updateTaskSchema` validates partial update payload | Validated successfully | ✅ PASS |
| `TC-VAL-UPD-02` | `updateTaskSchema` coerces `dueDate` and `completedAt` to Date objects | Dates coerced successfully | ✅ PASS |
| `TC-VAL-UPD-03` | `updateTaskSchema` rejects empty string title if title is provided | Validation error returned | ✅ PASS |
| `TC-VAL-DEL-01` | `deleteTaskSchema` validates non-empty task ID | Validated successfully | ✅ PASS |
| `TC-VAL-SUB-01` | `createSubtaskSchema` validates title and rejects empty title | Validated / Rejected | ✅ PASS |
| `TC-VAL-SUB-02` | `toggleSubtaskSchema` validates `isDone` boolean | Validated successfully | ✅ PASS |
| `TC-VAL-SUB-03` | `deleteSubtaskSchema` validates subtaskId | Validated successfully | ✅ PASS |
| `TC-VAL-COM-01` | `createCommentSchema` validates content and rejects empty content | Validated / Rejected | ✅ PASS |
| `TC-VAL-COM-02` | `deleteCommentSchema` validates commentId | Validated successfully | ✅ PASS |
| `TC-VAL-LBL-01` | `createLabelSchema` validates label name and color code | Validated successfully | ✅ PASS |

---

### 2.2 Task Server Actions (`tests/unit/tasks.test.ts`)
| Test ID | Test Case Description | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| `TC-TSK-01` | `createTaskAction` unauthenticated check | Returns `{ success: false, error: "UNAUTHORIZED" }` | ✅ PASS |
| `TC-TSK-02` | `createTaskAction` with `VIEWER` role in workspace | Returns `{ success: false, error: "FORBIDDEN" }` | ✅ PASS |
| `TC-TSK-03` | `createTaskAction` with project outside workspace | Returns `{ success: false, error: "Project not found" }` | ✅ PASS |
| `TC-TSK-04` | `createTaskAction` with non-member assignee | Returns `{ success: false, error: "Assignee is not a member of this workspace" }` | ✅ PASS |
| `TC-TSK-05` | `createTaskAction` calculates `MAX(order) + 1` at column bottom | Creates task at target sequential order with label associations | ✅ PASS |
| `TC-TSK-06` | `createTaskAction` sets order 0 on empty column and sets `completedAt` for Done column | Order 0 and `completedAt` set | ✅ PASS |
| `TC-MOV-01` | `moveTaskAction` reorders tasks within same column | Atomic transaction shifts intermediate task orders up/down | ✅ PASS |
| `TC-MOV-02` | `moveTaskAction` moves task across columns | Shifts source and destination tasks; sets `completedAt` on Done column | ✅ PASS |
| `TC-UPD-01` | `updateTaskAction` updates priority, assignee, description | Updates task record | ✅ PASS |
| `TC-UPD-02` | `updateTaskAction` rejects assignment to non-workspace user | Returns validation error | ✅ PASS |
| `TC-DEL-01` | `deleteTaskAction` allows workspace `MEMBER` to delete task | Task deleted in Prisma | ✅ PASS |
| `TC-DEL-02` | `deleteTaskAction` rejects `VIEWER` role | Returns `{ success: false, error: "FORBIDDEN" }` | ✅ PASS |
| `TC-QRY-01` | `getTaskDetailsAction` returns task with subtasks, comments, assignee, and labels | Enforces VIEWER access and returns complete relations | ✅ PASS |
| `TC-QRY-02` | `getProjectTasksAction` returns all project tasks ordered by `order ASC` | Scoped by project with counts and labels | ✅ PASS |

---

### 2.3 Subtask Server Actions (`tests/unit/subtasks.test.ts`)
| Test ID | Test Case Description | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| `TC-SUB-01` | `createSubtaskAction` unauthenticated check | Returns `{ success: false, error: "UNAUTHORIZED" }` | ✅ PASS |
| `TC-SUB-02` | `createSubtaskAction` with `VIEWER` role | Returns `{ success: false, error: "FORBIDDEN" }` | ✅ PASS |
| `TC-SUB-03` | `createSubtaskAction` computes sequential `MAX(order) + 1` | Creates subtask with `isDone: false` | ✅ PASS |
| `TC-SUB-04` | `toggleSubtaskAction` updates `isDone` boolean | Updates `isDone` state in Prisma | ✅ PASS |
| `TC-SUB-05` | `toggleSubtaskAction` on non-existent subtask | Returns `{ success: false, error: "Subtask not found" }` | ✅ PASS |
| `TC-SUB-06` | `deleteSubtaskAction` deletes subtask for workspace member | Subtask deleted in Prisma | ✅ PASS |

---

### 2.4 Comment Server Actions (`tests/unit/comments.test.ts`)
| Test ID | Test Case Description | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| `TC-COM-01` | `addCommentAction` unauthenticated check | Returns `{ success: false, error: "UNAUTHORIZED" }` | ✅ PASS |
| `TC-COM-02` | `addCommentAction` with `VIEWER` role | Returns `{ success: false, error: "FORBIDDEN" }` | ✅ PASS |
| `TC-COM-03` | `addCommentAction` creates comment linked to current session user | Comment created with user attribution | ✅ PASS |
| `TC-COM-04` | `deleteCommentAction` allows author to delete their own comment | Comment deleted | ✅ PASS |
| `TC-COM-05` | `deleteCommentAction` allows workspace `ADMIN` to delete comment | Comment deleted | ✅ PASS |
| `TC-COM-06` | `deleteCommentAction` rejects non-author `MEMBER` deleting another's comment | Returns `{ success: false, error: "FORBIDDEN" }` | ✅ PASS |

---

### 2.5 Label Server Actions (`tests/unit/labels.test.ts`)
| Test ID | Test Case Description | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| `TC-LBL-01` | `getWorkspaceLabelsAction` unauthenticated check | Returns `{ success: false, error: "UNAUTHORIZED" }` | ✅ PASS |
| `TC-LBL-02` | `getWorkspaceLabelsAction` returns workspace labels sorted by name ASC | Returns workspace-scoped labels | ✅ PASS |
| `TC-LBL-03` | `createLabelAction` rejects duplicate label name in same workspace | Returns `{ success: false, error: "LABEL_ALREADY_EXISTS" }` | ✅ PASS |
| `TC-LBL-04` | `createLabelAction` creates label for workspace MEMBER | Label created with name and color | ✅ PASS |

---

## 3. Acceptance Criteria Checklist

- [x] Tasks created without explicit order are assigned the highest order index + 1 in that column.
- [x] `moveTaskAction` successfully relocates a task from Column A to Column B and updates order indices.
- [x] Users with `VIEWER` role cannot create, move, update, or delete tasks.
- [x] Subtask toggle accurately updates `isDone` in database.
- [x] Deleting a task deletes all related comments, subtasks, and task label associations (cascades configured via Prisma schema).
- [x] Moving a task into the "Done" column automatically populates `completedAt`.
- [x] Reassigning a task to a non-workspace member is blocked with an explicit error.

---

## 4. How to Run These Tests Locally

```bash
# Run all unit test suites
npm test

# Run specific FEAT-003 backend test suites
npx vitest run tests/unit/task-validations.test.ts
npx vitest run tests/unit/tasks.test.ts
npx vitest run tests/unit/subtasks.test.ts
npx vitest run tests/unit/comments.test.ts
npx vitest run tests/unit/labels.test.ts

# Run strict TypeScript typecheck
npx tsc --noEmit

# Run ESLint validation
npm run lint
```
