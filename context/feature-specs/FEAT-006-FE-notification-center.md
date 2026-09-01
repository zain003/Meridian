# FEAT-006-FE-notification-center — P1

## Layer
Frontend

## Goal
Build the in-app notification center: top navbar bell icon with unread count badge, notification popover dropdown, and mark-as-read interactions.

## Depends On
`FEAT-006-BE-notifications.md`

## Context Pack
```typescript
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
```

## Consumes
```typescript
export async function getUserNotificationsAction(workspaceId: string): Promise<ActionResponse<Array<Notification>>>;
export async function markNotificationAsReadAction(notificationId: string): Promise<ActionResponse<void>>;
export async function markAllNotificationsAsReadAction(workspaceId: string): Promise<ActionResponse<void>>;
```

## Scope (In)
- Notification bell button in top navbar (`components/workspace/notification-bell.tsx`).
- Live unread counter badge on the bell (e.g. `3` or red dot).
- Notification popover dropdown (`NotificationPopover`) listing recent notifications with entity icon, title, timestamp, and unread dot indicator.
- Clicking a notification marks it as read and navigates to the associated entity (e.g., opens task modal).
- "Mark all as read" button in popover header.

## Scope (Out)
- User email preferences settings panel (future roadmap).

## Tech / Files to Touch
- `components/workspace/notification-bell.tsx` — Bell trigger with unread badge (shadcn `Button`, `Badge`, Lucide `Bell`).
- `components/notifications/notification-popover.tsx` — Dropdown notification list (shadcn `Popover`, `ScrollArea`, `Button`, Lucide `CheckCheck`).
- `components/notifications/notification-item.tsx` — Individual notification item row (shadcn `Avatar`, Lucide `MessageSquare`, `CheckSquare`, `Zap`).
- `components/workspace/top-navbar.tsx` — Integration into workspace navbar.

## Tests to Write FIRST
1. `Notification Bell Badge`: Renders unread badge count when unread notifications > 0.
2. `Notification Popover List`: Renders notification items with formatted relative timestamps (e.g. *"5m ago"*) and Lucide icons.
3. `Mark Single as Read`: Clicking an unread item dispatches `markNotificationAsReadAction` and removes unread dot.
4. `Mark All as Read`: Clicking header action clears all unread indicators.

## Implementation Steps
1. Create `NotificationItem` component with Lucide icons representing entity type (`Task`, `Comment`, `Rule`).
2. Build `NotificationPopover` using shadcn `Popover` and `ScrollArea` with fixed height, scrollable list, and header actions (`Mark all as read`).
3. Build `NotificationBell` managing unread count state and toggling popover.
4. Integrate `NotificationBell` into `components/workspace/top-navbar.tsx`.
5. Connect click handler to navigate to target entity URL upon clicking a notification row.

## Acceptance Criteria
- [ ] Bell icon displays an unread count badge when there are unread notifications.
- [ ] Clicking the bell opens a popover displaying recent notifications.
- [ ] Unread items have a distinct visual background and unread dot indicator.
- [ ] Clicking an item marks it as read and redirects the user to the relevant task/board.
- [ ] Clicking "Mark all as read" immediately updates local state and executes backend action.

## Definition of Done
- Component tests pass in Vitest.
- Design tokens and glassmorphic popover styling from `context/UI/UI-Rules.md` and `ui-context.md` applied (typography, colors, borders).
- `tsc --noEmit` passes with 0 errors.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Zero notifications (render clean empty state with checkmark illustration).
- Very large unread count (display `99+` badge).
- Rapid clicking of "Mark all as read" (debounce action).

## Pre-flight Check
Confirm `FEAT-006-BE-notifications.md` is complete.

## What's Next
- `FEAT-006-VERIFY-notifications.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-006-FE-notification-center` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
