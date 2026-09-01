# Code Standards

## General Principles

- **Single Responsibility**: Keep modules, components, and actions focused on a single, well-defined responsibility.
- **Fix Root Causes**: Address problems at the data or architectural source; avoid layering fragile workarounds.
- **Strict Separation of Concerns**: Clearly separate UI presentation, data access, and domain business logic.
- **Zero External AI Dependencies**: Implement all features (automation rules, analytics, workload distribution) with custom, deterministic, and maintainable TypeScript logic.

## TypeScript

- **Strict Mode Required**: Ensure `strict: true`, `noImplicitAny: true`, and `strictNullChecks: true` in `tsconfig.json`.
- **No `any`**: Explicitly model domain objects using TypeScript interfaces, type aliases, and discriminated unions. Use `unknown` with runtime schema validation where input types are untrusted.
- **Runtime Schema Validation**: Validate all external inputs, Server Action payloads, form inputs, and webhook bodies using **Zod**.
- **Inferred Types**: Derive TypeScript types directly from Zod schemas (`z.infer<typeof schema>`) and Prisma generated models from `types/` to prevent duplication.

## Next.js 16 (App Router & Server Actions)

- **Next.js 16 Runtime**: Built on Next.js 16 with React 19 support, App Router conventions, and asynchronous request APIs (`params`, `searchParams`, `cookies`, `headers`).
- **Default to React Server Components (RSC)**: Perform data fetching, auth verification, and initial layout rendering on the server.
- **Restricted `"use client"`**: Add `"use client"` only to leaf components requiring DOM listeners, browser APIs, drag-and-drop (`@dnd-kit`), React Hook Form state, or real-time websocket hooks.
- **Server Actions for Mutations**: All user mutations (creating tasks, moving columns, updating rules) must use typed Server Actions.
- **Route Handlers**: Use `app/api/` exclusively for external webhooks (Stripe), real-time authentication handshakes (Pusher/Ably), and file streaming.
- **Resilient States**: Implement `loading.tsx` and `error.tsx` boundaries for all dashboard sub-routes.

## UI Components & shadcn/ui

- **Component Primitives**: Build all interactive and display elements using **shadcn/ui** primitives (Radix UI) located in `components/ui/` (e.g. `Button`, `Dialog`, `DropdownMenu`, `Popover`, `Select`, `Tabs`, `Avatar`, `Badge`, `Card`, `Tooltip`).
- **No Raw Unstyled Primitives**: Never create raw HTML buttons/inputs when an equivalent shadcn/ui primitive exists.
- **Accessibility (a11y)**: Ensure keyboard navigability, focus rings, and screen-reader ARIA attributes via Radix UI primitives.

## Forms & Validation (React Hook Form + Zod)

- **Form Management**: All user input forms (Auth, Workspace, Project, Task Creation/Edit, Automation Rule Builder) must use **React Hook Form** (`useForm`) with `@hookform/resolvers/zod`.
- **shadcn/ui Form Primitives**: Wrap forms using shadcn `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormDescription>`, and `<FormMessage>`.
- **Strict Client + Server Validation**:
  1. Client-side: Validate instantaneously using the Zod schema via React Hook Form.
  2. Server-side: Re-validate the input payload in the Server Action using the identical Zod schema (`schema.safeParse` or `schema.parse`).
- **Standardized Error Display**: Field-level validation errors must be rendered automatically via `<FormMessage />`.

## Icons (Lucide React)

- **Standard Library**: Use **Lucide Icons** (`lucide-react`) for all UI iconography (e.g. `Check`, `Plus`, `Search`, `Bell`, `ChevronDown`, `Layers`, `Settings`, `AlertCircle`, `Trash2`, `User`).
- **Consistent Sizing & Stroke**:
  - `size-3.5` / `size-4` (stroke width 1.5–2) for inline badges, table cells, and metadata.
  - `size-4` / `size-5` for buttons, navigation items, and dropdown triggers.
  - `size-6` for dialog headers and empty state callouts.

## Styling & Design System (Tailwind CSS)

- **UI Rules & Design Tokens**: Strictly follow the visual guidelines, morphism recipes, and tokens in `context/UI/UI-Rules.md` and `context/ui-context.md`.
- **No Arbitrary Hex Codes**: Never hardcode hex values in JSX (e.g. use `text-foreground`, `bg-card`, or `border-border`, not `text-[#f4f4f5]`).
- **Standardized Border Radius**: Adhere strictly to `rounded-md` (badges/inputs), `rounded-lg` (cards/menus), `rounded-xl` (dialogs/modals), and `rounded-full` (avatars/pills).
- **Theme Support**: Ensure all UI states render properly in both Dark mode (default) and Light mode.

## API Routes & Server Actions

- **Authentication & Workspace Authorization**: Every Server Action and API handler must:
  1. Retrieve and verify the user session.
  2. Verify the user has active membership and the required role (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) in the target `workspace_id`.
- **Input Validation**: Parse inputs using `zodSchema.parse(input)` before executing business logic.
- **Atomic Transactions**: Multi-entity mutations (e.g., creating a task + triggering automation + generating notifications) must execute within a `prisma.$transaction`.
- **Predictable Response Shape**: All Server Actions must return a standardized result envelope:
  ```typescript
  type ActionResponse<T> = 
    | { success: true; data: T }
    | { success: false; error: string; fieldErrors?: Record<string, string[]> };
  ```

## Data & Multi-Tenancy

- **Workspace Scoping**: Every Prisma query must include `where: { workspaceId }`. Enforce this across all repositories and via Prisma query middleware.
- **Automation Rule Storage**: Rules are stored with structured JSON schemas for triggers, condition trees, and action payloads. Validate rule JSON with Zod before writing to the database.
- **Asynchronous Execution**: Side-effects (sending transactional emails, dispatching automation actions, broadcasting webhooks) must be pushed to Upstash Redis queues rather than blocking HTTP responses.
- **Stripe Webhook Verification**: Always verify the `stripe-signature` header using `stripe.webhooks.constructEvent` before processing subscription updates.

## Real-Time Collaboration & Engine

- **Channel Scoping**: Real-time channels must be workspace- or board-scoped (e.g., `presence-workspace-${workspaceId}`, `private-board-${boardId}`).
- **Optimistic UI with Rollback**: When a user drags a task or edits a field, update local state immediately; roll back gracefully and show a toast error if the server action fails.
- **Automation Recursion Guards**: The custom automation engine must enforce an execution depth limit (maximum depth: 3) to prevent infinite trigger loops.

## File Organization

- `app/(auth)/` — Authentication routes (`login`, `register`, `forgot-password`).
- `app/(dashboard)/[workspaceId]/` — Multi-tenant protected workspace pages (`projects`, `boards`, `analytics`, `automation`, `settings`).
- `app/api/` — External API and webhook route handlers.
- `components/ui/` — Base shadcn/ui primitive components (`button.tsx`, `dialog.tsx`, `form.tsx`, `input.tsx`, etc.).
- `components/boards/` — Board views (Kanban, List, Calendar) and `@dnd-kit` column/card components.
- `components/tasks/` — Task dialogs, subtasks, comment feeds, priority selectors, and detail views.
- `components/automation/` — Visual rule builder canvas, trigger/action configuration forms, and execution logs.
- `components/analytics/` — Charts (velocity, burndown, cycle time, workload) powered by Recharts/Tremor.
- `components/workspace/` — Workspace switcher, invite dialog, member management tables.
- `lib/automation/` — Rule evaluator, event emitter, condition matcher, action dispatchers, and queue worker.
- `lib/validations/` — Zod validation schemas for forms, server actions, and domain models.
- `lib/` — Singleton clients (`prisma.ts`, `stripe.ts`, `redis.ts`, `pusher.ts`, `auth.ts`) and helper utilities.
- `server/actions/` — Server Actions organized by domain (`tasks.ts`, `projects.ts`, `workspaces.ts`, `automation.ts`).
- `prisma/` — `schema.prisma`, seed scripts, migrations, and middleware.
- `types/` — TypeScript declarations, Zod schemas, and automation rule definitions.
