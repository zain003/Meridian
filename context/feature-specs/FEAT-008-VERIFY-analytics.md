# FEAT-008-VERIFY-analytics — P1

## Files Being Verified
- `FEAT-008-BE-analytics-metrics.md`
- `FEAT-008-FE-analytics-dashboard.md`

## 1. Automated Test Execution

Run the automated test suite and record outcomes:

- [ ] `vitest run tests/unit/analytics.test.ts` — Pass / Fail
  - Velocity calculation accurately groups created and completed tasks.
  - Cycle time average and median exclude uncompleted tasks.
  - Member workload summarizes task counts per member.
  - Workspace scoping enforced on all aggregation queries.
- [ ] `vitest run tests/components/analytics-dashboard.test.tsx` — Pass / Fail
  - `KpiCardGrid`: Renders metrics and percentages.
  - `VelocityChart`: Mounts Recharts components without errors.
  - Filter changes trigger refetch action.

## 2. Acceptance Criteria Verification

Individually verify each criterion against the live running environment:

- [ ] Analytics queries filter strictly by `workspaceId` and optional `projectId`.
- [ ] Tasks without a `completedAt` timestamp are excluded from cycle time averages.
- [ ] Top KPI cards display total tasks, completed tasks, and average turnaround time.
- [ ] Charts dynamically resize and respond smoothly to window resizing (`ResponsiveContainer`).
- [ ] Tooltip on charts displays formatted data values on hover.
- [ ] Changing project or date filter refreshes all charts without full page reload.

## 3. Definition of Done Confirmation

- [ ] All unit and component tests pass without errors.
- [ ] `tsc --noEmit` passes with zero type errors.
- [ ] `npm run lint` passes with no warnings.
- [ ] Recharts responsive containers verified across mobile and desktop viewports.
- [ ] `DEVIATIONS.md` updated if applicable.

## 4. Verification Verdict
- [ ] **PASSED**: All criteria and tests verified. Update `INDEX.md` status to `Completed`.
- [ ] **FAILED**: Provide failure details below and return to the corresponding file for remediation.

*Failure Notes (if any):*
- None.
