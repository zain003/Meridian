# Progress Tracker

*Update this file after every meaningful implementation change.*

## Current Phase

- **Phase 1: Project Setup, Multi-Tenant Architecture & Auth** (Roadmap Weeks 1–2)

## Current Goal

- Initialize Next.js 16 application, configure Tailwind CSS + shadcn/ui design system, set up Prisma ORM multi-tenant PostgreSQL schema, and implement Auth.js authentication with role-based access control, React Hook Form + Zod validation, and Lucide icons.

## Completed

- [x] Product specifications, technical architecture, UI tokens, code standards, and AI workflow rules synthesized into `context/` from `Project-overview.md`.
- [x] Initialized Next.js 16 project scaffolding with TypeScript and Tailwind CSS.
- [x] **FEAT-001-BE-auth-workspace**: Complete Prisma schema (`User`, `Account`, `Session`, `Workspace`, `WorkspaceMember`, `Project`, `Board`, `Column`, `Task`, `Subtask`, `Label`, `TaskLabel`, `Comment`, `AutomationRule`, `ExecutionLog`, `Notification`, `Subscription`).
- [x] **FEAT-001-BE-auth-workspace**: Auth.js v5 setup (Credentials + OAuth), password hashing with bcrypt, session helpers, route handlers, and edge route protection middleware.
- [x] **FEAT-001-BE-auth-workspace**: Multi-tenant RBAC engine (`hasMinimumRole`, `requireWorkspaceAccess`, role hierarchy), workspace CRUD, slug generation, invite code joining, member role management actions, and Vitest test suite (18/18 passing tests).

- [x] **FEAT-001-FE-auth-workspace**: Base shadcn/ui primitives (`Button`, `Input`, `Label`, `Form`, `Card`, `Dialog`, `DropdownMenu`, `Select`, `Avatar`, `Badge`) and "Quiet Luxury" styling tokens.
- [x] **FEAT-001-FE-auth-workspace**: Sign-in & sign-up pages (`app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`) with React Hook Form + Zod and OAuth providers.
- [x] **FEAT-001-FE-auth-workspace**: Workspace onboarding wizard (`app/onboarding/page.tsx`) with automatic slug suggestion and workspace creation.
- [x] **FEAT-001-FE-auth-workspace**: Sidebar `WorkspaceSwitcher` dropdown, `InviteMemberDialog` with copy-to-clipboard feedback, `MemberTable` with RBAC role updates, and dashboard shell.
- [x] **FEAT-001-VERIFY-auth-workspace**: Complete test verification pass with 42/42 passing unit, server action, validation, and component tests; 0 TypeScript errors; 0 ESLint warnings.
- [x] **FEAT-002-BE-projects-boards**: Project & Board CRUD Server Actions (`server/actions/projects.ts`, `server/actions/boards.ts`), automatic default board & 5 column provisioning (Backlog, Todo, In Progress, Review, Done), key uniqueness per workspace, column reordering atomic transaction, delete column task migration, Zod validations (`lib/validations/project.ts`), and Vitest test suite (33/33 passing tests, 75/75 global).
- [x] **FEAT-002-FE-projects-boards**: Project navigation tree & active state highlighting in `Sidebar` (`components/workspace/sidebar.tsx`), `CreateProjectDialog` with auto-key generator (`components/projects/create-project-dialog.tsx`), `BoardHeader` with view switcher tabs syncing `?view=` URL search params (`components/boards/board-header.tsx`), `BoardColumnHeader` with task counts and delete confirmation (`components/boards/board-column-header.tsx`), `AddColumnButton` with inline form (`components/boards/add-column-button.tsx`), Next.js 16 App Router Project Board page (`app/(dashboard)/[workspaceId]/projects/[projectId]/page.tsx`), and component test suite (15/15 passing tests, 90/90 global).
- [x] **FEAT-002-VERIFY-projects-boards**: Complete verification pass for Projects & Boards with 101/101 passing tests across 12 test suites, 0 TypeScript errors, 0 ESLint warnings, and 100% acceptance criteria verified.

## In Progress

- [ ] **Phase 3 (Weeks 3–4)**: `FEAT-003-BE-tasks` (Task CRUD, column movement, subtasks, labels, and comments).

## Next Up

1. **Phase 3 (Weeks 3–4)**: `FEAT-003-BE-tasks` (Task CRUD, column movement, subtasks, labels, and comments).
2. **Phase 3 (Weeks 3–4)**: `FEAT-003-FE-kanban-dnd` (Drag-and-drop Kanban board with `@dnd-kit` and optimistic updates).
3. **Phase 3 (Weeks 3–4)**: `FEAT-003-FE-task-views` (List view, Calendar view, and Task detail modal drawer).
4. **Phase 3 (Weeks 3–4)**: `FEAT-003-VERIFY-tasks` (Verification pass for Tasks & Multi-View UI).
3. **Phase 3 (Week 5)**: Real-time collaboration layer (live presence indicators, instant task broadcast synchronization via Pusher/Ably).
4. **Phase 4 (Week 6)**: Rules-based automation engine (visual trigger/condition/action rule builder with React Hook Form, custom JSON rule evaluator, Upstash Redis queue worker, audit execution logs).
5. **Phase 5 (Week 7)**: Stripe subscription billing (Free vs Pro tiers, Checkout, Customer Portal, Webhook sync) and notification center (in-app + Resend email).
6. **Phase 6 (Week 8)**: Team analytics dashboard (velocity, burndown, cycle time, workload charts via Recharts), Vitest & Playwright testing, deployment to Vercel.

## Open Questions

- **Real-Time Transport**: Managed Pusher / Ably channels vs self-hosted Socket.io. *(Recommendation: Pusher/Ably for zero infra operational overhead).*
- **Database Provider**: Supabase PostgreSQL vs Neon Serverless PostgreSQL.

## Architecture Decisions

- **Framework**: Next.js 16 with React 19, App Router, and Server Actions.
- **Component Primitives**: shadcn/ui (Radix UI) styled with Tailwind CSS tokens and Lucide React icons.
- **Form Handling & Validation**: React Hook Form with Zod schemas on client and server.
- **Multi-Tenant Isolation**: Enforced at the Prisma middleware/query layer scoping all records by `workspace_id`.
- **Zero External AI Dependencies**: Core value differentiator (automation engine + analytics) built with custom, deterministic TypeScript logic for 100% demo stability and zero API bill shock.
- **Asynchronous Side-Effects**: Primary task mutations emit events; matching rules evaluate against JSON definitions in PostgreSQL and push actions to an Upstash Redis background worker queue.
- **Server-First Architecture**: Default to React Server Components (RSC) for initial page loads; use Next.js 16 Server Actions with Zod validation for typed state mutations.

## Session Notes

- Project initialized on Next.js 16. Context files updated to mandate Next.js 16, TypeScript, shadcn/ui, React Hook Form, Zod, Lucide icons, and Tailwind CSS.
