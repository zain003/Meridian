# FEAT-006-BE-notifications — P1

## Layer
Backend

## Goal
Implement in-app notification persistence, unread status tracking, and transactional email dispatch via Resend for task assignments, mentions, and automation triggers.

## Depends On
`000-shared-contracts.md`, `FEAT-001-VERIFY-auth-workspace.md`

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
export interface CreateNotificationInput {
  workspaceId: string;
  userId: string;
  title: string;
  message: string;
  entityType: "TASK" | "COMMENT" | "RULE";
  entityId: string;
  sendEmail?: boolean;
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<{ notificationId: string }>;

export async function getUserNotificationsAction(
  workspaceId: string
): Promise<ActionResponse<Array<Notification>>>;

export async function markNotificationAsReadAction(
  notificationId: string
): Promise<ActionResponse<void>>;

export async function markAllNotificationsAsReadAction(
  workspaceId: string
): Promise<ActionResponse<void>>;

export async function sendTransactionalEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string }>;
```

## Scope (In)
- Creating in-app notification records scoped to specific workspace users.
- Fetching unread and recent notifications for the authenticated user.
- Marking individual or all notifications as read.
- Transactional email delivery service in `lib/email/resend.ts` using Resend SDK.
- Non-blocking email dispatch so email provider downtime never fails UI requests.

## Scope (Out)
- Front-end notification center popover and badges (handled in `FEAT-006-FE-notification-center.md`).
- Real-time socket broadcast of notifications (handled via Pusher in `FEAT-004-INT-realtime-sync.md`).

## Tech / Files to Touch
- `lib/email/resend.ts` — Resend email client singleton and email sender.
- `server/actions/notifications.ts` — Notification Server Actions.
- `lib/notifications/service.ts` — Core notification persistence service.

## Tests to Write FIRST
1. `createNotification`: Inserts `Notification` record in database with `isRead: false`.
2. `getUserNotificationsAction`: Returns notifications filtered strictly by current session user and workspace.
3. `markNotificationAsReadAction`: Updates `isRead: true` for target notification.
4. `sendTransactionalEmail`: Invokes Resend API with subject and HTML body; handles API error without throwing.

## Implementation Steps
1. Configure Resend client in `lib/email/resend.ts` reading `RESEND_API_KEY`.
2. Build `createNotification` in `lib/notifications/service.ts` creating `Notification` record in Prisma.
3. Implement `sendTransactionalEmail` in `lib/email/resend.ts` with error handling and fallback logging.
4. Implement `getUserNotificationsAction`, `markNotificationAsReadAction`, and `markAllNotificationsAsReadAction` in `server/actions/notifications.ts`.
5. Integrate `createNotification` into task assignment actions and mention parser.

## Acceptance Criteria
- [ ] Notifications created for a user appear in their unread notification list.
- [ ] Calling `markNotificationAsReadAction` toggles `isRead` to `true`.
- [ ] Calling `markAllNotificationsAsReadAction` updates all unread notifications for that user in the workspace.
- [ ] Users cannot read or mark another user's notifications.
- [ ] If `RESEND_API_KEY` is missing or fails, email errors are logged and in-app notification is still saved.

## Definition of Done
- All 4 unit tests pass in Vitest.
- Strict TypeScript typecheck passes (`tsc --noEmit`).
- No plain-text email templates in server code; use structured React Email or clean HTML.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- User notifying themselves (e.g. assigning self to task — skip notification creation).
- Missing recipient email address (log warning and skip email).
- High volume of notifications (limit fetch to 50 most recent records).

## Pre-flight Check
Confirm `FEAT-001-VERIFY-auth-workspace.md` passed.

## What's Next
- `FEAT-006-FE-notification-center.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-006-BE-notifications` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
