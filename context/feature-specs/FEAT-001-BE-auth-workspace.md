# FEAT-001-BE-auth-workspace — P0

## Layer
Backend

## Goal
Implement Auth.js authentication (credentials + OAuth), multi-tenant workspace management, invite code generation, and role-based access control (RBAC) helpers.

## Depends On
`000-shared-contracts.md`

## Provides / Exposes
```typescript
export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
}

export interface InviteMemberInput {
  workspaceId: string;
  email: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
}

export async function createWorkspaceAction(
  input: CreateWorkspaceInput
): Promise<ActionResponse<{ workspaceId: string; slug: string }>>;

export async function getUserWorkspacesAction(): Promise<
  ActionResponse<Array<{ id: string; name: string; slug: string; role: UserRole }>>
>;

export async function joinWorkspaceByInviteCodeAction(
  inviteCode: string
): Promise<ActionResponse<{ workspaceId: string; slug: string }>>;

export async function getWorkspaceMembersAction(
  workspaceId: string
): Promise<ActionResponse<Array<{ id: string; userId: string; name: string | null; email: string; role: UserRole }>>>;

export async function updateMemberRoleAction(
  workspaceId: string,
  targetUserId: string,
  newRole: UserRole
): Promise<ActionResponse<void>>;
```

## Scope (In)
- Auth.js configuration with Google, GitHub, and Credentials providers.
- Workspace creation with automatic `OWNER` membership assignment.
- Unique slug generation and invite code generation.
- Joining a workspace using an invite code (defaults to `MEMBER` role).
- Listing user workspaces and fetching workspace member directory.
- Updating workspace member roles with permission checks.

## Scope (Out)
- Authentication and workspace UI components (handled in `FEAT-001-FE-auth-workspace.md`).
- Stripe subscription checks (handled in `FEAT-007-BE-stripe-billing.md`).

## Tech / Files to Touch
- `lib/auth.ts` — Auth.js options, callbacks, and session helper.
- `server/actions/workspaces.ts` — Workspace CRUD and invite Server Actions.
- `server/actions/members.ts` — Membership management and role promotion Server Actions.
- `lib/rbac.ts` — `requireWorkspaceAccess` and role hierarchy helpers.
- `lib/validations/workspace.ts` — Zod schemas for workspace inputs.

## Tests to Write FIRST
1. `createWorkspaceAction`: Creates a workspace, assigns current user as `OWNER`, and returns `{ success: true }`.
2. `getUserWorkspacesAction`: Returns only workspaces where the authenticated user has a membership.
3. `joinWorkspaceByInviteCodeAction`: Successfully adds user to workspace with `MEMBER` role; fails with invalid code.
4. `updateMemberRoleAction`: Allows `OWNER` to change `MEMBER` to `ADMIN`; forbids non-admin from changing roles.

## Implementation Steps
1. Create Zod validation schemas in `lib/validations/workspace.ts` for workspace creation and member invitation.
2. Implement Auth.js configuration in `lib/auth.ts` supporting session cookies, Prisma adapter, and OAuth callbacks.
3. Implement `createWorkspaceAction` in `server/actions/workspaces.ts` using a Prisma transaction to create workspace and owner membership.
4. Implement `getUserWorkspacesAction` filtering by current session user ID.
5. Implement `joinWorkspaceByInviteCodeAction` validating the invite code and creating `WorkspaceMember`.
6. Implement `getWorkspaceMembersAction` and `updateMemberRoleAction` in `server/actions/members.ts` with `requireWorkspaceAccess` RBAC validation.

## Acceptance Criteria
- [ ] Attempting workspace creation while unauthenticated returns `{ success: false, error: "UNAUTHORIZED" }`.
- [ ] Creating a workspace creates both a `Workspace` record and a `WorkspaceMember` record with `role: "OWNER"`.
- [ ] Non-unique slugs are automatically suffixed or rejected with validation error.
- [ ] `joinWorkspaceByInviteCodeAction` adds authenticated user as `MEMBER` and rejects nonexistent invite codes.
- [ ] Users with `MEMBER` or `VIEWER` role attempting `updateMemberRoleAction` receive `{ success: false, error: "FORBIDDEN" }`.

## Definition of Done
- All 4 unit tests pass in Vitest.
- TypeScript compiles cleanly with zero errors (`tsc --noEmit`).
- No hardcoded secrets or environment variables in repository files.
- `DEVIATIONS.md` updated if any assumptions were made.

## Edge Cases to Handle
- User attempts to join a workspace they are already a member of (return existing workspace ID gracefully).
- Owner attempts to demote themselves when they are the sole owner (prevent workspace lockout).
- Slug collision handling for duplicate workspace names.

## Pre-flight Check
Confirm `000-shared-contracts.md` is present and Prisma schema has been generated.

## What's Next
- `FEAT-001-FE-auth-workspace.md` (Workspace & Auth UI)

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-001-BE-auth-workspace` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
