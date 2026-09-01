# FEAT-005-BE-rule-engine — P0

## Layer
Backend

## Goal
Implement the core deterministic rules engine: JSON condition evaluator, action executor, loop protection guards, and Rule CRUD Server Actions.

## Depends On
`000-shared-contracts.md`, `FEAT-003-BE-tasks.md`

## Context Pack
```typescript
export interface RuleCondition {
  field: "status" | "priority" | "assigneeId" | "columnId" | "dueDate";
  operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GREATER_THAN" | "LESS_THAN" | "IS_EMPTY" | "IS_NOT_EMPTY";
  value: string | number | boolean | null;
}

export interface RuleAction {
  type: "ASSIGN_USER" | "MOVE_COLUMN" | "SET_PRIORITY" | "ADD_LABEL" | "SEND_NOTIFICATION" | "SEND_EMAIL";
  payload: Record<string, unknown>;
}

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
```

## Provides / Exposes
```typescript
export interface CreateRuleInput {
  workspaceId: string;
  name: string;
  description?: string;
  triggerType: RuleTriggerType;
  triggerData?: Record<string, unknown>;
  conditions: RuleCondition[];
  actions: RuleAction[];
}

export async function createRuleAction(
  input: CreateRuleInput
): Promise<ActionResponse<{ ruleId: string }>>;

export async function toggleRuleAction(
  ruleId: string,
  isActive: boolean
): Promise<ActionResponse<void>>;

export async function getWorkspaceRulesAction(
  workspaceId: string
): Promise<ActionResponse<Array<AutomationRule & { logs: ExecutionLog[] }>>>;

export function evaluateCondition(condition: RuleCondition, taskData: Record<string, unknown>): boolean;

export function evaluateRuleConditions(conditions: RuleCondition[], taskData: Record<string, unknown>): boolean;

export async function executeRuleActions(
  ruleId: string,
  actions: RuleAction[],
  context: { workspaceId: string; taskId: string; depth?: number }
): Promise<{ success: boolean; error?: string }>;
```

## Scope (In)
- Creating, editing, toggling, and deleting automation rules stored as structured JSON in PostgreSQL.
- Deterministic condition evaluation engine supporting all operators (`EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `LESS_THAN`, `CONTAINS`, `IS_EMPTY`, `IS_NOT_EMPTY`).
- Direct action execution logic for mutating tasks, reassigning, applying labels, and queuing notifications.
- Execution depth tracking (maximum depth = 3) to prevent infinite cascading trigger loops.

## Scope (Out)
- Redis queue producer and background worker process (handled in `FEAT-005-INT-queue-worker.md`).
- Visual block-based rule builder UI (handled in `FEAT-005-FE-rule-builder.md`).

## Tech / Files to Touch
- `lib/automation/evaluator.ts` — Condition evaluation engine.
- `lib/automation/executor.ts` — Action dispatcher and mutation logic.
- `server/actions/automation.ts` — Rule CRUD Server Actions.
- `lib/validations/automation.ts` — Zod schema validation for JSON rules.

## Tests to Write FIRST
1. `evaluateCondition`: Correctly evaluates `EQUALS`, `NOT_EQUALS`, `CONTAINS`, and numerical comparisons.
2. `evaluateRuleConditions`: Returns `true` only when all condition filters in the array pass (logical AND).
3. `executeRuleActions`: Successfully executes `MOVE_COLUMN` and `ASSIGN_USER` mutations on target task.
4. `Recursion guard`: Aborts execution and logs error when execution depth exceeds 3.

## Implementation Steps
1. Create strict Zod schemas for triggers, conditions, and actions in `lib/validations/automation.ts`.
2. Implement `evaluateCondition` and `evaluateRuleConditions` in `lib/automation/evaluator.ts`.
3. Implement `executeRuleActions` in `lib/automation/executor.ts` with depth incrementing and action dispatching.
4. Implement `createRuleAction`, `toggleRuleAction`, `getWorkspaceRulesAction`, and `deleteRuleAction` in `server/actions/automation.ts`.
5. Add execution log recording to `ExecutionLog` model upon action completion or failure.

## Acceptance Criteria
- [ ] Condition evaluator accurately tests string, number, and boolean equality and inequality.
- [ ] Action execution applies task mutations to PostgreSQL within a Prisma transaction.
- [ ] Attempting to trigger an action with `depth > 3` stops execution and records `"MAX_DEPTH_EXCEEDED"` in `ExecutionLog`.
- [ ] Users without `ADMIN` or `OWNER` role cannot create, toggle, or delete automation rules.
- [ ] Invalid JSON condition/action shapes are rejected at validation before saving.

## Definition of Done
- All 4 unit tests pass in Vitest.
- `tsc --noEmit` passes with 0 errors.
- No external AI API calls used anywhere in rule evaluation.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Missing or null fields on task when evaluating condition (gracefully treat as null/empty).
- Deleted assignee/column referenced in action payload (log error and skip step instead of crashing).
- Rapid rule toggling (idempotent boolean updates).

## Pre-flight Check
Confirm `FEAT-003-BE-tasks.md` is complete.

## What's Next
- `FEAT-005-INT-queue-worker.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-005-BE-rule-engine` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
