# FEAT-008-BE-analytics-metrics — P1

## Layer
Backend

## Goal
Implement database aggregation queries and Server Actions for calculating team velocity, cycle time, burndown curves, and member workload distribution.

## Depends On
`000-shared-contracts.md`, `FEAT-003-VERIFY-tasks.md`

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
export interface AnalyticsFilterInput {
  workspaceId: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface VelocityMetric {
  interval: string; // e.g. "Week 1", "Sprint 4"
  completedTasks: number;
  createdTasks: number;
}

export interface CycleTimeMetric {
  averageHours: number;
  medianHours: number;
  distribution: Array<{ range: string; count: number }>;
}

export interface MemberWorkloadMetric {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
}

export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  velocity: VelocityMetric[];
  cycleTime: CycleTimeMetric;
  workload: MemberWorkloadMetric[];
}

export async function getWorkspaceAnalyticsAction(
  input: AnalyticsFilterInput
): Promise<ActionResponse<AnalyticsSummary>>;
```

## Scope (In)
- SQL/Prisma aggregation queries computing completed vs created task velocities grouped by week/month.
- Calculating cycle time per task (`completedAt` minus `createdAt` in hours/days).
- Aggregating workload counts per member (assigned, in-progress, completed).
- Optional filtering by project and custom date range.
- Scoping all metric calculations strictly to the authenticated `workspaceId`.

## Scope (Out)
- Front-end chart rendering (handled in `FEAT-008-FE-analytics-dashboard.md`).
- Third-party analytics tracking (e.g. Google Analytics).

## Tech / Files to Touch
- `server/actions/analytics.ts` — Analytics query Server Actions.
- `lib/analytics/metrics.ts` — SQL aggregation and data transform functions.
- `lib/validations/analytics.ts` — Zod filter validator.

## Tests to Write FIRST
1. `Velocity Calculation`: Correctly counts tasks completed within date intervals.
2. `Cycle Time Calculation`: Computes accurate average and median hours for completed tasks.
3. `Workload Distribution`: Summarizes active tasks per user accurately.
4. `Workspace Scoping`: Verifies metrics ignore tasks from other workspaces.

## Implementation Steps
1. Create Zod validation schema for `AnalyticsFilterInput` in `lib/validations/analytics.ts`.
2. Implement SQL aggregation helpers in `lib/analytics/metrics.ts` using Prisma raw query or aggregate operations.
3. Implement cycle time median/average calculation helper.
4. Build `getWorkspaceAnalyticsAction` in `server/actions/analytics.ts` enforcing `requireWorkspaceAccess`.
5. Format aggregation output into clean data structures matching `AnalyticsSummary`.

## Acceptance Criteria
- [ ] Analytics queries filter strictly by `workspaceId` and optional `projectId`.
- [ ] Tasks without a `completedAt` timestamp are excluded from cycle time averages.
- [ ] Workload metrics summarize active task counts for each member with assigned tasks.
- [ ] Query executes efficiently within <300ms for workspaces with up to 10,000 tasks.

## Definition of Done
- All 4 unit tests pass in Vitest.
- Strict TypeScript typecheck passes (`tsc --noEmit`).
- No arbitrary client-side heavy metric calculations (all computed server-side).
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Workspace with zero completed tasks (return 0 hours cycle time without dividing by zero).
- Workspaces with unassigned tasks (aggregate under "Unassigned" bucket).
- Date range with no activity (fill missing date buckets with 0).

## Pre-flight Check
Confirm `FEAT-003-VERIFY-tasks.md` passed.

## What's Next
- `FEAT-008-FE-analytics-dashboard.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-008-BE-analytics-metrics` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
