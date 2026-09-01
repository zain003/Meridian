# FEAT-004-VERIFY-realtime — P0

## Files Being Verified
- `FEAT-004-BE-realtime.md`
- `FEAT-004-INT-realtime-sync.md`
- `FEAT-004-FE-presence-ui.md`

## 1. Automated Test Execution

Run the automated test suite and record outcomes:

- [ ] `vitest run tests/unit/realtime-auth.test.ts` — Pass / Fail
  - `authorizePusherChannel`: Authorizes workspace members, blocks non-members and unauthenticated requests.
  - Channel name validator rejects irregular formats.
- [ ] `vitest run tests/integration/realtime-sync.test.ts` — Pass / Fail
  - `broadcastTaskMutation`: Emits payload with correct channel and actor ID.
  - `useBoardRealtimeSync`: Subscribes, updates state, and cleans up on unmount.
- [ ] `vitest run tests/components/presence-ui.test.tsx` — Pass / Fail
  - `PresenceAvatarStack`: Renders member avatars and handles overflow `+N`.
  - `TaskCardViewers`: Displays viewer pill on task card.

## 2. Acceptance Criteria Verification

Individually verify each criterion against the live running environment:

- [ ] Requests to `/api/realtime/auth` without a valid session cookie return HTTP 401.
- [ ] Requests for a workspace where the user is not a member return HTTP 403.
- [ ] Mutating a task on Client A broadcasts an event received by Client B on the same board within <500ms.
- [ ] Client A does not re-apply its own optimistic action when receiving its own broadcast.
- [ ] Active collaborators viewing the board appear in the top navbar avatar stack within <1 second of joining.
- [ ] Hovering over an avatar displays the user's name and status tooltip.
- [ ] If a collaborator opens a task modal, a colored ring/indicator appears on that task card for other users.
- [ ] Closing the browser tab removes the user from the presence stack for remaining collaborators.

## 3. Definition of Done Confirmation

- [ ] All unit, integration, and component tests pass without errors.
- [ ] `tsc --noEmit` passes with zero type errors.
- [ ] `npm run lint` passes with no warnings.
- [ ] No unhandled socket disconnect exceptions or memory leaks.
- [ ] `DEVIATIONS.md` updated if applicable.

## 4. Verification Verdict
- [ ] **PASSED**: All criteria and tests verified. Update `INDEX.md` status to `Completed`.
- [ ] **FAILED**: Provide failure details below and return to the corresponding file for remediation.

*Failure Notes (if any):*
- None.
