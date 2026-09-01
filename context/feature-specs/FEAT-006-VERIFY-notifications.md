# FEAT-006-VERIFY-notifications — P1

## Files Being Verified
- `FEAT-006-BE-notifications.md`
- `FEAT-006-FE-notification-center.md`

## 1. Automated Test Execution

Run the automated test suite and record outcomes:

- [ ] `vitest run tests/unit/notifications.test.ts` — Pass / Fail
  - `createNotification`: Inserts notification record in DB.
  - `getUserNotificationsAction`: Filters by user and workspace.
  - `markNotificationAsReadAction`: Sets `isRead: true`.
  - `markAllNotificationsAsReadAction`: Updates all user records.
  - `sendTransactionalEmail`: Invokes Resend API and handles error gracefully.
- [ ] `vitest run tests/components/notification-center.test.tsx` — Pass / Fail
  - `NotificationBell`: Shows unread badge count.
  - `NotificationPopover`: Lists notifications with relative timestamps.
  - Click interaction marks item as read.

## 2. Acceptance Criteria Verification

Individually verify each criterion against the live running environment:

- [ ] Notifications created for a user appear in their unread notification list.
- [ ] Calling `markNotificationAsReadAction` toggles `isRead` to `true`.
- [ ] Calling `markAllNotificationsAsReadAction` updates all unread notifications for that user in the workspace.
- [ ] Bell icon displays an unread count badge when there are unread notifications.
- [ ] Clicking the bell opens a popover displaying recent notifications.
- [ ] Unread items have a distinct visual background and unread dot indicator.
- [ ] Clicking an item marks it as read and redirects the user to the relevant task/board.
- [ ] Clicking "Mark all as read" immediately updates local state and executes backend action.

## 3. Definition of Done Confirmation

- [ ] All unit and component tests pass without errors.
- [ ] `tsc --noEmit` passes with zero type errors.
- [ ] `npm run lint` passes with no warnings.
- [ ] Resend API credentials loaded securely via environment variables.
- [ ] `DEVIATIONS.md` updated if applicable.

## 4. Verification Verdict
- [ ] **PASSED**: All criteria and tests verified. Update `INDEX.md` status to `Completed`.
- [ ] **FAILED**: Provide failure details below and return to the corresponding file for remediation.

*Failure Notes (if any):*
- None.
