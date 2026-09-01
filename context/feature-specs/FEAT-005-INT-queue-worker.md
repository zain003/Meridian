# FEAT-005-INT-queue-worker — P0

## Layer
Integration

## Goal
Connect task mutation events to an Upstash Redis background job queue, evaluating matching automation rules and executing actions asynchronously with full audit logging.

## Depends On
`FEAT-005-BE-rule-engine.md`, `FEAT-003-BE-tasks.md`

## Context Pack
```typescript
export interface RuleJobPayload {
  workspaceId: string;
  triggerType: RuleTriggerType;
  taskId: string;
  previousData?: Record<string, unknown>;
  newData: Record<string, unknown>;
  depth?: number;
}
```

## Consumes
```typescript
export function evaluateRuleConditions(conditions: RuleCondition[], taskData: Record<string, unknown>): boolean;
export async function executeRuleActions(ruleId: string, actions: RuleAction[], context: { workspaceId: string; taskId: string; depth?: number }): Promise<{ success: boolean; error?: string }>;
```

## Provides / Exposes
```typescript
export async function enqueueAutomationJob(payload: RuleJobPayload): Promise<void>;

export async function processAutomationJob(payload: RuleJobPayload): Promise<{
  rulesEvaluated: number;
  rulesFired: number;
}>;

export async function runQueueWorkerStep(): Promise<number>;
```

## Scope (In)
- Enqueuing rule evaluation jobs to Upstash Redis upon task mutations (`enqueueAutomationJob`).
- Worker execution function `processAutomationJob` that queries active rules matching `triggerType`, evaluates conditions, and invokes `executeRuleActions`.
- Creating `ExecutionLog` records for every rule evaluated (Status: `SUCCESS`, `FAILED`, `SKIPPED`).
- API Route Handler `app/api/cron/automations/route.ts` or edge queue consumer trigger.

## Scope (Out)
- Front-end visual rule builder UI (handled in `FEAT-005-FE-rule-builder.md`).
- Real-time client broadcasts (handled in `FEAT-004-INT-realtime-sync.md`).

## Tech / Files to Touch
- `lib/redis.ts` — Upstash Redis client singleton.
- `lib/automation/queue.ts` — Redis queue push and pop operations.
- `lib/automation/worker.ts` — Job processor and rule matcher.
- `app/api/cron/automations/route.ts` — Scheduled cron / webhook endpoint for queue draining.
- `server/actions/tasks.ts` — Dispatch `enqueueAutomationJob` on task changes.

## Tests to Write FIRST
1. `enqueueAutomationJob`: Pushes serialized job payload to Redis list/stream.
2. `processAutomationJob`: Finds matching active rule, passes conditions, executes action, and writes `ExecutionLog` with status `SUCCESS`.
3. `Condition Mismatch`: If conditions fail, records `ExecutionLog` with status `SKIPPED`.
4. `Queue draining`: `runQueueWorkerStep` pops jobs and processes them sequentially.

## Implementation Steps
1. Configure Upstash Redis client in `lib/redis.ts`.
2. Implement `enqueueAutomationJob` in `lib/automation/queue.ts`.
3. Implement `processAutomationJob` in `lib/automation/worker.ts` fetching workspace rules from Prisma, running `evaluateRuleConditions`, and calling `executeRuleActions`.
4. Create `ExecutionLog` records saving `ruleId`, `eventData`, `result`, and `firedAt`.
5. Integrate `enqueueAutomationJob` into `createTaskAction`, `moveTaskAction`, and `updateTaskAction`.
6. Implement `app/api/cron/automations/route.ts` with secret token authorization to process queued jobs.

## Acceptance Criteria
- [ ] Mutating a task pushes a job to Redis without adding perceptible latency to the user's action (<50ms).
- [ ] Queued jobs match all active rules in the workspace with the corresponding `triggerType`.
- [ ] Rules whose conditions evaluate to `true` execute their defined actions.
- [ ] Every evaluation generates an `ExecutionLog` entry with full payload and timestamp.
- [ ] The queue worker handles errors gracefully without dropping subsequent jobs.

## Definition of Done
- Integration tests pass in Vitest.
- `tsc --noEmit` passes with zero type errors.
- Redis client handles network reconnection without crashing the server process.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Redis service timeout / offline (log error and fall back to direct synchronous execution or retry queue).
- Workspace deleted while jobs are in queue (discard orphaned jobs).
- Multiple rules matching the same trigger (evaluate in deterministic creation order).

## Pre-flight Check
Confirm `FEAT-005-BE-rule-engine.md` is complete.

## What's Next
- `FEAT-005-FE-rule-builder.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-005-INT-queue-worker` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
