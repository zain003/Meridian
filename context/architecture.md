# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| **Framework** | Next.js 16 (App Router, RSC, Server Actions, React 19) | Core full-stack application runtime, server-rendered views, and API routes |
| **Language** | TypeScript (Strict Mode) | End-to-end type safety, domain modeling, compile-time contract enforcement |
| **UI Components** | shadcn/ui (Radix UI Primitives) | Accessible, customizable UI component library (`@/components/ui/*`) |
| **Styling** | Tailwind CSS (v4 configuration) + CSS Variables | Theme tokens, responsive layout utilities, dark/light mode theming |
| **Forms & Validation** | React Hook Form + Zod (`@hookform/resolvers/zod`) | Client and server-side schema validation and reactive form state management |
| **Icons** | Lucide Icons (`lucide-react`) | Comprehensive SVG icon library across navigation, actions, and badges |
| **Drag & Drop** | `@dnd-kit/core` & `@dnd-kit/sortable` | Accessible, performant drag-and-drop for Kanban board columns and task cards |
| **Client State** | TanStack Query / Zustand | Client-side cache management, optimistic updates, and global UI state |
| **Charts & Analytics** | Recharts / Tremor | Data visualization for team velocity, burndown, cycle time, and workload distribution |
| **Auth** | Auth.js (NextAuth v5) | Email/Password credentials, OAuth (Google & GitHub), session/JWT tokens |
| **Database & ORM** | PostgreSQL (Supabase or Neon) + Prisma ORM | Relational persistence, schema migrations, and type-safe database queries |
| **Real-Time Transport** | Pusher / Ably (or Socket.io) | Live presence indicators and real-time task update pub/sub broadcasting |
| **Queue & Caching** | Upstash Redis | Job queue for asynchronous rule execution, rate limiting, and ephemeral caching |
| **Automation Engine** | Custom Event Emitter + JSON Rule Evaluator | In-house deterministic workflow engine (Trigger → Condition → Action) in pure TypeScript |
| **Billing & Subscriptions** | Stripe (Checkout, Customer Portal, Webhooks) | Multi-tier subscription billing (Free vs Pro) and webhook-driven plan syncing |
| **Transactional Email** | Resend / SendGrid | In-app alerts, @mention notifications, and automation action emails |
| **Monitoring & CI/CD** | Sentry, Vitest, Playwright, GitHub Actions, Vercel | Error tracking, unit/E2E testing, CI pipeline, and edge deployment |

## System Boundaries

- `app/(auth)/` — Public authentication flows: login, registration, password reset, OAuth callbacks.
- `app/(dashboard)/[workspaceId]/` — Multi-tenant protected workspace routes (Projects, Kanban Boards, Calendar, Analytics, Automation Builder, Workspace Settings, Billing).
- `app/api/` — Public and secure HTTP Route Handlers (Stripe webhooks with signature verification, Pusher auth endpoints, file upload handlers).
- `components/ui/` — Base design system UI primitives generated via shadcn/ui.
- `components/boards/` — Kanban, List, and Calendar view components with `@dnd-kit` drag-and-drop handlers.
- `components/tasks/` — Task cards, detail dialogs, subtasks, comment stream, label pickers, and assignee selectors.
- `components/automation/` — Visual rule builder (Trigger/Condition/Action nodes), rule execution audit logs, and status toggles.
- `components/analytics/` — Velocity charts, burndown visualizers, cycle time histograms, and workload distribution tables.
- `components/workspace/` — Workspace switcher dropdown, invite dialog, member management tables.
- `lib/automation/` — Custom automation engine: event emitter, rule parser, condition evaluator, action dispatchers, and queue worker logic.
- `lib/validations/` — Zod schemas used across React Hook Form and Server Actions.
- `lib/` — Shared singletons and utility modules: Prisma client, Stripe SDK, Pusher/Ably client, Redis client, Auth options, and formatting utils.
- `server/actions/` — Type-safe Next.js 16 Server Actions for workspace, project, task, board, rule, and membership mutations.
- `prisma/` — Schema definition (`schema.prisma`), database migrations, seed scripts, and multi-tenant middleware.
- `types/` — Global domain types, database entity shapes, automation rule JSON contracts, and API response envelopes.

## Storage Model

- **Relational Database (PostgreSQL via Prisma)**:
  - Users, Accounts, Sessions, and Verification Tokens.
  - Workspaces and Workspace Memberships (`role`: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).
  - Projects, Boards, Columns, Tasks, Subtasks, Labels, and Comments.
  - Automation Rules (stored as structured JSON: triggers, conditions, actions, enabled state).
  - Automation Execution Logs (audit trail of rule IDs, trigger events, execution timestamp, status, error logs).
  - In-App Notifications (recipient ID, event type, read/unread state, entity links).
  - Stripe Subscriptions (customer ID, subscription ID, price ID, status, current period end).
- **In-Memory Cache & Queue (Upstash Redis)**:
  - Asynchronous background worker queue for executing automation actions.
  - API rate-limiting buckets and temporary session/presence cache.
- **Blob / File Storage (Supabase Storage / Uploadthing / S3)**:
  - Task file attachments, user avatars, and workspace logo assets.

## Auth and Access Model

- **Session Management**: Auth.js manages JWT/session cookies. Edge middleware (`middleware.ts`) intercepts requests to validate authentication and redirect unauthenticated traffic.
- **Multi-Tenant Workspace Scoping**: All workspace resources (Projects, Tasks, Boards, Rules, Notifications) are partitioned strictly by `workspace_id`.
- **Role-Based Access Control (RBAC)**:
  - `OWNER`: Full ownership, workspace deletion, billing subscription management, role elevation.
  - `ADMIN`: Manage projects, boards, automation rules, invite/remove members, and workspace settings.
  - `MEMBER`: Create, edit, and move tasks, create projects and boards, post comments, and view analytics.
  - `VIEWER`: Read-only access to projects, boards, and tasks; can view assigned items and post comments.
- **Authorization Enforcement**: Enforced at the Server Action / API layer before any mutation runs, and systematically constrained at the database query layer via Prisma workspace scoping.

## Invariants

1. **Strict Multi-Tenant Isolation**: Every database query, mutation, and rule evaluation must be explicitly scoped by `workspace_id`. No cross-tenant data leakage is permitted under any circumstance.
2. **Zero External AI Dependencies**: All automation logic, workflow triggers, and analytics calculations are 100% deterministic and self-contained in custom TypeScript application code.
3. **Decoupled Asynchronous Execution**: Primary user mutations (e.g. moving a task) must remain snappy and optimistic. Heavy side-effects (automation actions, notifications, external webhooks) must be pushed to the Upstash Redis queue for background execution.
4. **Cryptographic Webhook Verification**: All Stripe webhook endpoints must verify raw signatures before parsing payloads or updating subscription state.
5. **Server Components by Default**: Data fetching occurs in React Server Components (`RSC`); `"use client"` is restricted to interactive leaf components (Kanban drag-and-drop, modals, live presence, React Hook Form forms, charts).
6. **Form Validation with React Hook Form & Zod**: Every form input is validated on the client with React Hook Form (`@hookform/resolvers/zod`) and re-validated on the server with Zod before mutation.
7. **Consistent shadcn/ui & Lucide UI**: All user interfaces use shadcn/ui primitives and Lucide icons configured with Tailwind CSS design tokens.
8. **Automation Loop Protection**: The rule engine enforces depth limits and loop detection to prevent runaway cascading automation triggers.
