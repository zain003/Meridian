# FEAT-004-FE-presence-ui — P0

## Layer
Frontend

## Goal
Build the real-time presence UI components: collaborative avatar stack in the top navbar and live viewing indicators on active task cards.

## Depends On
`FEAT-004-INT-realtime-sync.md`

## Context Pack
```typescript
export interface RealtimePresenceUser {
  userId: string;
  name: string;
  image?: string | null;
  activeBoardId?: string;
  activeTaskId?: string;
  lastSeenAt: number;
}
```

## Consumes
```typescript
export function usePresenceChannel(workspaceId: string, currentBoardId?: string): {
  activeMembers: RealtimePresenceUser[];
  activeCardViewers: Record<string, RealtimePresenceUser[]>; // taskId -> viewers
};
```

## Scope (In)
- Top navbar avatar stack (`PresenceAvatarStack`) rendering overlapping collaborator avatars.
- Overflow badge (e.g. `+3`) when more than 4 users are active in the workspace/board.
- Hover tooltip on presence avatars displaying user name and current location (e.g., *"Viewing Backlog"*).
- Live viewing badge on task cards when another user opens or edits that specific task.
- Dynamic presence heartbeat and clean exit when user navigates away or closes tab.

## Scope (Out)
- Real-time task reordering mechanics (handled in `FEAT-004-INT-realtime-sync.md`).
- Video/audio chat presence (out of scope).

## Tech / Files to Touch
- `components/workspace/presence-avatar-stack.tsx` — Collaborative avatar stack in navbar (shadcn `Avatar`, `Tooltip`, `Badge`, Lucide `Users`).
- `components/tasks/task-card-viewers.tsx` — Viewer badge on task card (shadcn `Avatar`, `Tooltip`).
- `hooks/use-presence-channel.ts` — React hook managing Pusher presence subscription in TypeScript.
- `components/workspace/top-navbar.tsx` — Top navbar integration (Next.js 16 Client Component).

## Tests to Write FIRST
1. `Presence Avatar Stack`: Renders avatars for active members returned by `usePresenceChannel` using shadcn `Avatar`.
2. `Overflow Counter`: Displays `+N` badge when active member count exceeds maximum visible limit (4).
3. `Card Viewer Badge`: Renders mini-avatar on task card when `activeCardViewers[taskId]` contains active users.
4. `Member Leave Event`: Removes user avatar from stack when `pusher:member_removed` event fires.

## Implementation Steps
1. Build `hooks/use-presence-channel.ts` subscribing to `presence-workspace-[workspaceId]` in strict TypeScript.
2. Track `activeMembers` list and update local dictionary of `activeCardViewers` based on member client events.
3. Build `PresenceAvatarStack` with animated avatar entrance/exit using Tailwind CSS transitions, shadcn `Avatar`, and shadcn `Tooltip`.
4. Integrate `PresenceAvatarStack` into `components/workspace/top-navbar.tsx`.
5. Build `TaskCardViewers` component using shadcn `Avatar` and embed in `components/tasks/task-card.tsx`.

## Acceptance Criteria
- [ ] Active collaborators viewing the board appear in the top navbar avatar stack within <1 second of joining.
- [ ] Hovering over an avatar displays the user's name and status tooltip.
- [ ] If a collaborator opens a task modal, a colored ring/indicator appears on that task card for other users.
- [ ] Closing the browser tab removes the user from the presence stack for remaining collaborators.
- [ ] The UI gracefully collapses beyond 4 active users into an overflow pill.

## Definition of Done
- Component tests pass in Vitest.
- Visuals strictly follow design system (avatar sizes, border rings, tooltips, and glassmorphism from `context/UI/UI-Rules.md` and `ui-context.md`).
- `tsc --noEmit` passes with 0 errors.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- User with no avatar image (render fallback initials with deterministic background color).
- Rapid tab switching / backgrounding (maintain heartbeat or mark idle).
- Single user active (show subtle solo indicator).

## Pre-flight Check
Confirm `FEAT-004-INT-realtime-sync.md` is complete.

## What's Next
- `FEAT-004-VERIFY-realtime.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-004-FE-presence-ui` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
