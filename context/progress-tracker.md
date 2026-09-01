# Progress Tracker

*Update this file after every meaningful implementation change.*

## Current Phase

- **Phase 1: Project Setup, Multi-Tenant Architecture & Auth** (Roadmap Weeks 1–2)

## Current Goal

- Initialize Next.js 16 application, configure Tailwind CSS + shadcn/ui design system, set up Prisma ORM multi-tenant PostgreSQL schema, and implement Auth.js authentication with role-based access control, React Hook Form + Zod validation, and Lucide icons.

## Completed

- [x] Product specifications, technical architecture, UI tokens, code standards, and AI workflow rules synthesized into `context/` from `Project-overview.md`.
- [x] Initialized Next.js 16 project scaffolding with TypeScript and Tailwind CSS.

## In Progress

- [ ] Project configuration with shadcn/ui primitives, Lucide icons, React Hook Form, and Zod validation utilities.
- [ ] Prisma schema design covering multi-tenant models: `User`, `Account`, `Session`, `Workspace`, `WorkspaceMember`, `Project`, `Board`, `Column`, `Task`, `Subtask`, `Comment`, `Rule`, `ExecutionLog`, `Notification`, `Subscription`.

## Next Up

1. **Phase 1 (Weeks 1–2)**: Auth.js setup (OAuth + Credentials), multi-tenant middleware, workspace onboarding wizard (React Hook Form + Zod), member invites, and RBAC (`Owner`, `Admin`, `Member`, `Viewer`).
2. **Phase 2 (Weeks 3–4)**: Project/Task CRUD, drag-and-drop Kanban board (`@dnd-kit`), list view, calendar view, task detail dialogs (shadcn/ui), markdown comments, and file attachments.
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
