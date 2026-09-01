# FEAT-004-INT-realtime-sync — P0

## Layer
Integration

## Goal
Integrate Pusher real-time event broadcasting into task and board mutations, and provide client-side subscription hooks for multi-user state synchronization.

## Depends On
`FEAT-004-BE-realtime.md`, `FEAT-003-BE-tasks.md`

## Context Pack
```typescript
export interface TaskMutationEvent {
  eventType: "TASK_CREATED" | "TASK_UPDATED" | "TASK_MOVED" | "TASK_DELETED";
  workspaceId: string;
  projectId: string;
  boardId: string;
  taskId: string;
  data: Record<string, unknown>;
  actorId: string;
}
```

## Consumes
```typescript
export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: unknown
): Promise<void>;
```

## Provides / Exposes
```typescript
export async function broadcastTaskMutation(event: TaskMutationEvent): Promise<void>;

export function useBoardRealtimeSync(params: {
  boardId: string;
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskMoved?: (payload: { taskId: string; columnId: string; order: number }) => void;
  onTaskDeleted?: (payload: { taskId: string }) => void;
}): { isConnected: boolean };
```

## Scope (In)
- Server-side event broadcast helper `broadcastTaskMutation` called inside `server/actions/tasks.ts`.
- Non-blocking async event dispatch (errors in socket emission do not roll back database transactions).
- Client-side React hook `useBoardRealtimeSync` managing Pusher channel subscriptions, event listeners, and cleanup on unmount.
- Deduplication of events so the initiating actor does not process their own optimistic action twice.

## Scope (Out)
- Live presence avatar rendering (handled in `FEAT-004-FE-presence-ui.md`).
- Rule engine event triggers (handled in `FEAT-005-INT-queue-worker.md`).

## Tech / Files to Touch
- `lib/realtime/broadcast.ts` — Server event broadcaster.
- `hooks/use-board-realtime.ts` — Client React hook for board events.
- `server/actions/tasks.ts` — Inject `broadcastTaskMutation` calls into CRUD actions.
- `lib/pusher-client.ts` — Browser Pusher JS client instance.

## Tests to Write FIRST
1. `broadcastTaskMutation`: Dispatches event to `private-board-[boardId]` channel with actor ID.
2. `broadcastTaskMutation failure`: Database mutation still succeeds if Pusher API is unreachable.
3. `useBoardRealtimeSync`: Subscribes to channel on mount, calls callbacks on message, unsubscribes on unmount.
4. `Actor event filtering`: Ignores incoming events where `actorId === currentUserId`.

## Implementation Steps
1. Create client-side Pusher singleton in `lib/pusher-client.ts` pointing to `/api/realtime/auth`.
2. Implement `broadcastTaskMutation` in `lib/realtime/broadcast.ts` wrapped in a try/catch block.
3. Integrate `broadcastTaskMutation` calls into `createTaskAction`, `moveTaskAction`, `updateTaskAction`, and `deleteTaskAction`.
4. Build `useBoardRealtimeSync` hook in `hooks/use-board-realtime.ts` binding Pusher channel events to local state dispatcher callbacks.
5. Add connection state indicator (`isConnected`) to the hook.

## Acceptance Criteria
- [ ] Mutating a task on Client A broadcasts an event received by Client B on the same board within <500ms.
- [ ] Client A does not re-apply its own optimistic action when receiving its own broadcast.
- [ ] If Pusher service is temporarily down, Server Actions complete successfully without throwing unhandled exceptions.
- [ ] Leaving the board page unbinds listeners and unsubscribes from the Pusher channel.

## Definition of Done
- Integration tests pass in Vitest.
- Strict TypeScript typecheck passes (`tsc --noEmit`).
- No memory leaks or dangling event listeners on route change.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- WebSocket disconnection and reconnection (auto-resubscribe and trigger light state refresh).
- Multiple tabs open by the same user on the same board.
- Event arrival after component has unmounted.

## Pre-flight Check
Confirm `FEAT-004-BE-realtime.md` and `FEAT-003-BE-tasks.md` are complete.

## What's Next
- `FEAT-004-FE-presence-ui.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-004-INT-realtime-sync` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
