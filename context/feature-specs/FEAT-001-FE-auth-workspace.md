# FEAT-001-FE-auth-workspace — P0

## Layer
Frontend

## Goal
Build the authentication screens, workspace onboarding wizard, workspace switcher dropdown in the sidebar, and team member invite modal.

## Depends On
`FEAT-001-BE-auth-workspace.md`

## Context Pack
```typescript
export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
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
export async function createWorkspaceAction(input: CreateWorkspaceInput): Promise<ActionResponse<{ workspaceId: string; slug: string }>>;
export async function getUserWorkspacesAction(): Promise<ActionResponse<Array<{ id: string; name: string; slug: string; role: UserRole }>>>;
export async function joinWorkspaceByInviteCodeAction(inviteCode: string): Promise<ActionResponse<{ workspaceId: string; slug: string }>>;
export async function getWorkspaceMembersAction(workspaceId: string): Promise<ActionResponse<Array<{ id: string; userId: string; name: string | null; email: string; role: UserRole }>>>;
export async function updateMemberRoleAction(workspaceId: string, targetUserId: string, newRole: UserRole): Promise<ActionResponse<void>>;
```

## Scope (In)
- Sign-in and sign-up pages (`app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`).
- Workspace onboarding creation wizard (`app/onboarding/page.tsx`).
- Workspace switcher dropdown component in the sidebar with active workspace indicator.
- Invite member dialog with copyable invite link and role selector.
- Members settings page (`app/(dashboard)/[workspaceId]/settings/members/page.tsx`) with role modification dropdown.

## Scope (Out)
- Project creation forms (handled in `FEAT-002-FE-projects-boards.md`).
- Stripe subscription billing UI (handled in `FEAT-007-FE-billing-portal.md`).

## Tech / Files to Touch
- `app/(auth)/login/page.tsx` — Login form with React Hook Form + Zod and OAuth buttons.
- `app/(auth)/register/page.tsx` — Registration form with React Hook Form + Zod.
- `app/onboarding/page.tsx` — Workspace creation wizard with React Hook Form + Zod.
- `components/workspace/workspace-switcher.tsx` — Sidebar workspace switcher component (shadcn `DropdownMenu`, Lucide `Building`, `Check`, `Plus`).
- `components/workspace/invite-member-dialog.tsx` — Modal to generate/copy invite links (shadcn `Dialog`, Lucide `Copy`, `Check`, `UserPlus`).
- `components/workspace/member-table.tsx` — Workspace member management table (shadcn `Avatar`, `Select`, `Badge`).

## Tests to Write FIRST
1. `Login Page`: Renders email/password inputs, Google button, and GitHub button; displays Zod validation error on empty submit.
2. `Workspace Onboarding Form`: Validates schema with React Hook Form + Zod, calls `createWorkspaceAction` on submit, redirects to `/[workspaceId]` on success.
3. `Workspace Switcher`: Renders current workspace name, lists user workspaces, and triggers route change on selection.
4. `Invite Member Dialog`: Generates correct URL containing `inviteCode` and provides copy-to-clipboard feedback with Lucide icons.

## Implementation Steps
1. Build authentication UI in `app/(auth)/login/page.tsx` and `register/page.tsx` using React Hook Form, Zod schemas, shadcn `<Form>`, `<Input>`, and `<Button>`.
2. Build `app/onboarding/page.tsx` with React Hook Form + Zod prompting new users to create their first workspace using `createWorkspaceAction`.
3. Create `components/workspace/workspace-switcher.tsx` using shadcn `DropdownMenu`, Lucide icons, and `getUserWorkspacesAction`.
4. Create `components/workspace/invite-member-dialog.tsx` with shadcn `Dialog`, Lucide `Copy`/`Check` button, and role selector.
5. Create `components/workspace/member-table.tsx` rendering member avatars, names, emails, and role change combobox.
6. Connect `updateMemberRoleAction` to the member table role selector with optimistic feedback and toast notifications.

## Acceptance Criteria
- [ ] Submitting valid credentials or clicking OAuth button initiates Auth.js session.
- [ ] First-time users without a workspace are redirected to `/onboarding`.
- [ ] Creating a workspace in `/onboarding` redirects user directly to `/[workspaceId]`.
- [ ] Selecting another workspace from the workspace switcher navigates to that workspace dashboard.
- [ ] Clicking copy button on invite dialog writes invite link to clipboard and displays confirmation toast.
- [ ] Non-owner users cannot see or interact with role alteration controls in member table.

## Definition of Done
- Component tests pass in Vitest with React Testing Library.
- UI styling, tokens, glassmorphism, and animations strictly adhere to `context/UI/UI-Rules.md` and `ui-context.md`.
- No TypeScript compiler warnings or errors.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- User with zero workspaces trying to access dashboard directly (redirect to `/onboarding`).
- Clipboard API unavailable/blocked by browser (fallback to selecting input text).
- Displaying loading spinner while Server Action executes to prevent duplicate submissions.

## Pre-flight Check
Confirm `FEAT-001-BE-auth-workspace.md` tests pass and `000-shared-contracts.md` types are imported.

## What's Next
- `FEAT-001-VERIFY-auth-workspace.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-001-FE-auth-workspace` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
