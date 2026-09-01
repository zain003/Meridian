# FEAT-008-FE-analytics-dashboard — P1

## Layer
Frontend

## Goal
Build the team analytics dashboard page featuring summary KPI metric cards, velocity bar charts, cycle time distributions, and member workload graphs using Recharts.

## Depends On
`FEAT-008-BE-analytics-metrics.md`

## Context Pack
```typescript
export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  velocity: VelocityMetric[];
  cycleTime: CycleTimeMetric;
  workload: MemberWorkloadMetric[];
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
export async function getWorkspaceAnalyticsAction(input: AnalyticsFilterInput): Promise<ActionResponse<AnalyticsSummary>>;
```

## Scope (In)
- Analytics dashboard page at `app/(dashboard)/[workspaceId]/analytics/page.tsx`.
- Top summary cards (Total Tasks, Completed Tasks, Completion Rate %, Avg Cycle Time).
- Team Velocity Chart: Bar / Area chart comparing created vs completed tasks over time intervals.
- Cycle Time Chart: Histogram / bar chart of task duration distribution.
- Member Workload Distribution Chart: Horizontal stacked bar chart showing task distribution across team members.
- Project filter dropdown and date range picker.

## Scope (Out)
- PDF/CSV data export (future roadmap).

## Tech / Files to Touch
- `app/(dashboard)/[workspaceId]/analytics/page.tsx` — Analytics page (Next.js 16 Server Component).
- `components/analytics/kpi-card-grid.tsx` — Summary metric cards (shadcn `Card`, Lucide `TrendingUp`, `CheckCircle2`, `Clock`, `AlertCircle`).
- `components/analytics/velocity-chart.tsx` — Velocity visualizer using Recharts and shadcn `Card`.
- `components/analytics/cycle-time-chart.tsx` — Cycle time distribution chart (shadcn `Card`, Recharts).
- `components/analytics/workload-chart.tsx` — Member workload chart (shadcn `Card`, Recharts).
- `components/analytics/analytics-filters.tsx` — Project and date range filter bar (shadcn `Select`, `Popover`, `Button`, Lucide `Filter`, `Calendar`).

## Tests to Write FIRST
1. `KPI Cards Render`: Renders total tasks, completion rate %, and average cycle time from summary props.
2. `Velocity Chart Render`: Renders Recharts responsive container with created and completed series.
3. `Filter Controls`: Selecting project or date range refetches data via `getWorkspaceAnalyticsAction`.
4. `Empty State`: Displays clean illustration when no tasks have been created in the selected range.

## Implementation Steps
1. Build `app/(dashboard)/[workspaceId]/analytics/page.tsx` as a Next.js 16 Server Component fetching initial metrics.
2. Build `KpiCardGrid` rendering KPI summary statistics with shadcn `Card` and Lucide trend icons.
3. Build `VelocityChart` using Recharts `BarChart` and `ResponsiveContainer` wrapped in a shadcn `Card`.
4. Build `CycleTimeChart` visualizing task turnaround times.
5. Build `WorkloadChart` using horizontal stacked bars per team member.
6. Build `AnalyticsFilters` with shadcn `Select`, `Popover`, and Lucide `Filter`/`Calendar` icons.

## Acceptance Criteria
- [ ] Top KPI cards display total tasks, completed tasks, and average turnaround time.
- [ ] Charts dynamically resize and respond smoothly to window resizing (`ResponsiveContainer`).
- [ ] Tooltip on charts displays formatted data values on hover.
- [ ] Changing project or date filter refreshes all charts without full page reload.
- [ ] Chart styling follows color tokens from `ui-context.md` (Indigo for completed, Amber for in-progress).

## Definition of Done
- Component tests pass in Vitest.
- Visual styling and chart gradients strictly follow `context/UI/UI-Rules.md` and `ui-context.md`.
- Recharts responsive containers render without console layout warnings.
- `tsc --noEmit` passes with 0 errors.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Zero data in date range (render empty state placeholder inside chart container).
- Extremely long member names in workload chart (truncate with tooltip).
- Mobile screen viewport (stack charts vertically with horizontal scroll where needed).

## Pre-flight Check
Confirm `FEAT-008-BE-analytics-metrics.md` is complete.

## What's Next
- `FEAT-008-VERIFY-analytics.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-008-FE-analytics-dashboard` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
