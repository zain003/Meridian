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
- [x] **FEAT-003-BE-tasks**: Task CRUD and movement Server Actions (`server/actions/tasks.ts`), subtasks management (`server/actions/subtasks.ts`), comments stream with RBAC (`server/actions/comments.ts`), workspace labels (`server/actions/labels.ts`), atomic column movement and sequential order reindexing transactions, Zod validations (`lib/validations/task.ts`), and Vitest test suite (47/47 passing tests, 148/148 global).
- [x] **FEAT-003-FE-kanban-dnd**: Drag-and-drop Kanban board interface (`components/boards/kanban-board.tsx`) powered by `@dnd-kit/core` and `@dnd-kit/sortable`, SortableContext column wrapper (`components/boards/kanban-column.tsx`), draggable task card with priority badges and Lucide icons (`components/tasks/task-card.tsx`), drag overlay preview (`components/tasks/task-drag-overlay.tsx`), inline quick task creation with React Hook Form + Zod (`components/tasks/quick-add-task.tsx`), optimistic reordering with error rollback, and Vitest component test suite (8/8 passing tests, 156/156 global).
- [x] **FEAT-003-FE-task-views**: Dense structured list view table (`components/tasks/task-list-view.tsx`) with search filtering and sortable column headers, monthly calendar grid (`components/tasks/task-calendar-view.tsx`) with month navigation and unscheduled task drawer, 65/35 split Task Detail Modal (`components/tasks/task-detail-modal.tsx`) with tabbed markdown description editor, subtasks progress checklist (`components/tasks/task-subtasks.tsx`), real-time comments stream (`components/tasks/task-comments.tsx`), and Vitest component test suite (14/14 passing tests, 170/170 global).
- [x] **FEAT-003-VERIFY-tasks**: Complete verification pass for Tasks & Multi-View UI with 69/69 passing tests across 7 feature test suites (170/170 global passing), 0 TypeScript errors, 0 ESLint warnings, and 100% acceptance criteria verified.
- [x] **FEAT-004-BE-realtime**: Server-side Pusher client singleton (`lib/pusher.ts`), presence and private channel authorization logic with PostgreSQL workspace membership enforcement, channel parsing schemas (`lib/validations/realtime.ts`), HTTP route handler (`app/api/realtime/auth/route.ts`), and Vitest unit test suite (16/16 passing tests, 186/186 global).
- [x] **FEAT-004-INT-realtime-sync**: Task mutation event broadcasting dispatchers in `server/actions/tasks.ts` (`broadcastTaskMutation`), client-side board subscription hook `useBoardRealtimeSync`, and non-blocking event handling.
- [x] **FEAT-004-FE-presence-ui**: Collaborative `PresenceAvatarStack` with overflow badge (`+N`) and tooltips, `TaskCardViewers` on task cards, `usePresenceChannel` hook tracking active workspace collaborators and card viewers, shadcn `Tooltip` primitive (`components/ui/tooltip.tsx`), and Vitest component test suite (9/9 passing tests, 195/195 global).
- [x] **FEAT-005-BE-rule-engine**: Deterministic JSON condition evaluator (`lib/automation/evaluator.ts`), action dispatcher with loop protection guard (`lib/automation/executor.ts`, max depth = 3), ExecutionLog recording, Rule CRUD Server Actions with RBAC (`server/actions/automation.ts`), and Vitest unit test suite (17/17 passing tests, 218/218 global).
- [x] **FEAT-005-INT-queue-worker**: Upstash Redis client singleton (`lib/redis.ts`), background queue producer (`lib/automation/queue.ts`), worker rule matcher (`lib/automation/worker.ts`), task mutation enqueue triggers (`server/actions/tasks.ts`), and cron queue worker API route (`app/api/cron/automations/route.ts`).
- [x] **FEAT-005-FE-rule-builder**: Visual block-based rule builder dialog (`components/automation/rule-builder-dialog.tsx`) with 3-step connected pipeline (TriggerNode, ConditionNode with dynamic filters, ActionNode), `RuleList` table with optimistic active switch toggles, `ExecutionLogDrawer` with status badges and formatted JSON payloads, `Switch` primitive (`components/ui/switch.tsx`), Next.js 16 App Router automation page (`app/(dashboard)/[workspaceId]/automation/page.tsx`), and Vitest component test suite (9/9 passing tests, 227/227 global).
- [x] **FEAT-005-VERIFY-automation**: Complete verification pass for Automation Engine with 30/30 passing tests across 3 feature test suites (231/231 global passing), 0 TypeScript errors, 0 ESLint warnings, and 100% acceptance criteria verified.
- [x] **FEAT-006-BE-notifications**: In-app notification persistence service (`lib/notifications/service.ts`), Resend SDK transactional email client (`lib/email/resend.ts`) with Quiet Luxury HTML templates and resilient error handling, notification Server Actions with RBAC (`server/actions/notifications.ts`), task assignment and comment mention dispatch integrations, and Vitest test suite (27/27 passing tests, 258/258 global).
- [x] **FEAT-006-FE-notification-center**: Top navbar notification bell (`components/workspace/notification-bell.tsx`) with live unread badge counter (`3`, `99+`), dropdown popover (`components/notifications/notification-popover.tsx`) with scrollable list (`components/ui/scroll-area.tsx`), entity icon badges (`components/notifications/notification-item.tsx`), relative time formatter, "Mark all as read" optimistic execution, empty state illustration, and Vitest component test suite (10/10 passing tests, 268/268 global).
- [x] **FEAT-006-VERIFY-notifications**: Complete verification pass for In-App & Email Notifications with 37/37 passing tests across 3 feature test suites (268/268 global passing), 0 TypeScript errors, 0 ESLint warnings, and 100% acceptance criteria verified.

## In Progress

- [ ] **Phase 5 (Week 7)**: `FEAT-007-BE-stripe-billing` (Stripe Customer creation, Checkout sessions, and Customer Portal generator).

## Next Up

1. **Phase 5 (Week 7)**: `FEAT-007-BE-stripe-billing` (Stripe Customer creation, Checkout sessions, and Customer Portal generator).
2. **Phase 5 (Week 7)**: `FEAT-007-INT-stripe-webhooks` (Stripe webhook route handler with signature verification and tier sync).
3. **Phase 5 (Week 7)**: `FEAT-007-FE-billing-portal` (Billing settings view with tier comparison card and upgrade triggers).
4. **Phase 5 (Week 7)**: `FEAT-007-VERIFY-billing` (Verification pass for Stripe Billing).
5. **Phase 6 (Week 8)**: Team analytics dashboard (velocity, burndown, cycle time, workload charts via Recharts), Vitest & Playwright testing, deployment to Vercel.

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
