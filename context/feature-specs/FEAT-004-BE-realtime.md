# FEAT-004-BE-realtime — P0

## Layer
Backend

## Goal
Implement secure authentication and authorization route handlers for Pusher/Ably presence channels and private workspace broadcast channels.

## Depends On
`000-shared-contracts.md`, `FEAT-001-VERIFY-auth-workspace.md`

## Context Pack
```typescript
export interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

export interface RealtimePresenceUser {
  userId: string;
  name: string;
  image?: string | null;
  activeBoardId?: string;
  activeTaskId?: string;
  lastSeenAt: number;
}
```

## Provides / Exposes
```typescript
export interface PusherAuthPayload {
  socket_id: string;
  channel_name: string;
}

export interface PusherAuthResponse {
  auth: string;
  channel_data?: string;
}

export async function authorizePusherChannel(
  user: SessionUser,
  socketId: string,
  channelName: string
): Promise<PusherAuthResponse>;
```

## Scope (In)
- Server-side Pusher SDK initialization singleton in `lib/pusher.ts`.
- HTTP Route Handler `app/api/realtime/auth/route.ts` for authorizing presence and private channels.
- Validation that the authenticated user is an active member of the `workspaceId` embedded in the channel name (`presence-workspace-[workspaceId]`, `private-board-[boardId]`).
- Minting presence channel user info payload (userId, name, avatar).

## Scope (Out)
- Emitting mutation events from task actions (handled in `FEAT-004-INT-realtime-sync.md`).
- Front-end presence avatar stack UI (handled in `FEAT-004-FE-presence-ui.md`).

## Tech / Files to Touch
- `lib/pusher.ts` — Server Pusher client singleton.
- `app/api/realtime/auth/route.ts` — Authentication route handler.
- `lib/validations/realtime.ts` — Channel naming regex and payload validators.

## Tests to Write FIRST
1. `authorizePusherChannel` for presence channel: Returns valid auth signature and channel user data for verified member.
2. `authorizePusherChannel` for unauthenticated request: Throws 401 Unauthorized.
3. `authorizePusherChannel` for non-member user: Rejects with 403 Forbidden.
4. Channel name format validation: Rejects malformed channel names.

## Implementation Steps
1. Configure server-side Pusher client in `lib/pusher.ts` reading environment variables (`PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`).
2. Create channel name parsing and verification helper in `lib/validations/realtime.ts`.
3. Implement `authorizePusherChannel` in `lib/pusher.ts` verifying workspace membership in Prisma before generating auth tokens.
4. Build `app/api/realtime/auth/route.ts` accepting form/JSON socket auth requests and returning the signed auth payload.

## Acceptance Criteria
- [ ] Requests to `/api/realtime/auth` without a valid session cookie return HTTP 401.
- [ ] Requests for a workspace where the user is not a member return HTTP 403.
- [ ] Authorized requests return valid `auth` signature and `channel_data` containing `user_id`, `name`, and `image`.
- [ ] Environment variables are loaded securely without exposing secrets to client bundles.

## Definition of Done
- All 4 route tests pass in Vitest.
- Strict TypeScript typecheck passes (`tsc --noEmit`).
- No sensitive keys committed to version control.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- User removed from workspace while socket is active (rejected on re-auth).
- Malformed `socket_id` or `channel_name` in request body.
- Missing Pusher environment variables in dev environment (fail gracefully with descriptive warning).

## Pre-flight Check
Confirm `FEAT-001-VERIFY-auth-workspace.md` passed.

## What's Next
- `FEAT-004-INT-realtime-sync.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-004-BE-realtime` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
