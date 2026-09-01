# FEAT-005-FE-rule-builder — P0

## Layer
Frontend

## Goal
Build the visual block-based automation rule builder interface (Trigger Node ➔ Condition Filter ➔ Action Dispatch) and the execution audit log viewer.

## Depends On
`FEAT-005-BE-rule-engine.md`, `FEAT-005-INT-queue-worker.md`

## Context Pack
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

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
```

## Consumes
```typescript
export async function createRuleAction(input: CreateRuleInput): Promise<ActionResponse<{ ruleId: string }>>;
export async function toggleRuleAction(ruleId: string, isActive: boolean): Promise<ActionResponse<void>>;
export async function getWorkspaceRulesAction(workspaceId: string): Promise<ActionResponse<Array<AutomationRule & { logs: ExecutionLog[] }>>>;
```

## Scope (In)
- Automation rules overview page (`app/(dashboard)/[workspaceId]/automation/page.tsx`).
- Active rule list with on/off switch toggles and recent execution badge.
- Visual block-based Rule Builder modal/canvas:
  - **Trigger Block**: Selector for event type (e.g. "When task status changes to...").
  - **Condition Block**: Dynamic filter builder (Field + Operator + Target Value) with "+ Add Condition" button.
  - **Action Block**: Action selector (e.g. "Assign to User", "Move to Column", "Send Notification") with target picker.
- Execution Audit Log drawer displaying timestamp, status pill (SUCCESS/FAILED/SKIPPED), trigger event details, and error output.

## Scope (Out)
- Complex multi-branch DAG workflow canvas (linear Trigger ➔ Conditions ➔ Actions is strictly in scope).

## Tech / Files to Touch
- `app/(dashboard)/[workspaceId]/automation/page.tsx` — Automation dashboard page (Next.js 16 Server Component).
- `components/automation/rule-list.tsx` — Active rules list table (shadcn `Table`, `Switch`, `Badge`, Lucide `Zap`, `History`).
- `components/automation/rule-builder-dialog.tsx` — Visual rule builder dialog with React Hook Form + Zod (shadcn `Dialog`, `Button`, Lucide `Plus`, `ArrowDown`).
- `components/automation/trigger-node.tsx` — Trigger selector card (shadcn `Card`, `Select`, Lucide `Zap`).
- `components/automation/condition-node.tsx` — Condition filter card (shadcn `Card`, `Select`, `Input`, `Button`, Lucide `Filter`, `Trash2`).
- `components/automation/action-node.tsx` — Action config card (shadcn `Card`, `Select`, `Input`, Lucide `Play`, `Bell`, `Send`).
- `components/automation/execution-log-drawer.tsx` — Audit log drawer (shadcn `Sheet`, `Badge`, Lucide `CheckCircle2`, `XCircle`, `Clock`).

## Tests to Write FIRST
1. `Rule List Render`: Displays all workspace automation rules and their active status toggles.
2. `Rule Builder Form`: Configures Trigger, Condition, and Action blocks using React Hook Form + Zod and calls `createRuleAction`.
3. `Rule Toggle Switch`: Toggling rule switch immediately updates status and calls `toggleRuleAction`.
4. `Audit Log Drawer`: Opens when clicking "View Logs" and lists past execution runs with status pills.

## Implementation Steps
1. Build `app/(dashboard)/[workspaceId]/automation/page.tsx` fetching rules via `getWorkspaceRulesAction`.
2. Build `RuleList` component with active switch toggle and trigger/action summary pills using shadcn `Table` and `Switch`.
3. Build `RuleBuilderDialog` using React Hook Form, Zod schema (`createRuleSchema`), and shadcn `<Form>` with 3-step visual block cards connected by vertical Lucide `ArrowDown` indicators.
4. Implement `TriggerNode` with dropdown of `RuleTriggerType` options using shadcn `Select`.
5. Implement `ConditionNode` allowing multiple criteria with AND conjunctions using React Hook Form `useFieldArray`.
6. Implement `ActionNode` with dynamic inputs based on selected `RuleAction` type.
7. Build `ExecutionLogDrawer` with shadcn `Sheet` rendering detailed JSON payload inspection and execution timing with Lucide status icons.

## Acceptance Criteria
- [ ] Admins can view all workspace automation rules and see their enabled/disabled states.
- [ ] Users can construct a rule (Trigger ➔ Condition ➔ Action) and save it without page reload.
- [ ] Toggling a rule switch toggles `isActive` state in the database.
- [ ] Opening the Execution Log displays verifiable audit history with formatted timestamps and status pills.
- [ ] Visual styling adheres to design tokens in `ui-context.md` (rounded-xl dialogs, mono font for rule expressions).

## Definition of Done
- Component tests pass in Vitest.
- Visual styling adheres to design tokens in `context/UI/UI-Rules.md` and `ui-context.md` (rounded-xl dialogs, mono font for rule expressions, status pills, node connectors).
- Strict TypeScript typecheck passes (`tsc --noEmit`).
- Error toast appears if rule creation validation fails.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Submitting rule with no actions configured (validate and require at least one action).
- Rule execution log with large JSON payload (collapsible JSON tree).
- Workspace with zero rules (render illustrated empty state with "+ Create First Automation" button).

## Pre-flight Check
Confirm `FEAT-005-INT-queue-worker.md` is complete.

## What's Next
- `FEAT-005-VERIFY-automation.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-005-FE-rule-builder` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
