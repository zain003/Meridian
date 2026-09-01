# AI Workflow Rules

## Approach

Meridian is developed using a strict spec-driven incremental workflow. The context files in `context/` (`project-overview.md`, `architecture.md`, `ui-context.md`, `code-standards.md`, `progress-tracker.md`) define the definitive system requirements, design tokens, system boundaries, and code conventions.

All features must be implemented against these specifications using **Next.js 16**, **TypeScript (Strict Mode)**, **shadcn/ui primitives**, **Tailwind CSS**, **React Hook Form + Zod**, and **Lucide Icons**. Do not infer, invent speculative behavior, or introduce third-party AI dependencies.

## Scoping Rules

- **One Unit at a Time**: Work on a single, well-defined feature unit per step aligned with the roadmap phases in `progress-tracker.md`.
- **Small & Verifiable**: Prefer small, type-safe, verifiable increments over large speculative changes.
- **Respect System Boundaries**: Do not combine unrelated layers (e.g. database schema migrations, UI components, and webhook handlers) into a single implementation step.

## When to Split Work

Split an implementation task if it combines:

1. **Database & Schema Changes** with **Complex Front-End UI** (e.g. create and migrate Prisma models first before building UI views).
2. **Core Domain Logic / Evaluator** with **Background Queues / Workers** (e.g. build and test the JSON rule evaluator before connecting Upstash Redis queues).
3. **Billing / Webhook Infrastructure** with **User-Facing UI Settings**.
4. **Behavior not yet clearly specified** in `architecture.md` or `ui-context.md`.

If a change cannot be compiled and verified end-to-end quickly, the scope is too broad—split it into smaller sub-tasks.

## Handling Missing Requirements

- **No Speculative Features**: Do not add unrequested features or external AI API calls.
- **Clarify & Document**: If a requirement is ambiguous, resolve and document the intended behavior in the relevant context file before writing code.
- **Record Open Questions**: Log unresolved architectural or product questions in `progress-tracker.md`.

## Protected Files

Do not modify the following files or directories without explicit instruction:

- `components/ui/*` — Base shadcn/ui primitive components (install/update via shadcn CLI or official templates).
- `prisma/migrations/*` — Database migration history files (always use Prisma migration commands).
- `app/api/webhooks/stripe/route.ts` — Stripe signature verification and webhook security routines.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- **Architecture / System Boundaries**: Update `context/architecture.md` when adding models, queue workflows, or third-party integrations.
- **UI & Design Tokens**: Update `context/ui-context.md` when introducing new visual tokens or layout patterns.
- **Code Standards**: Update `context/code-standards.md` when adopting new conventions or patterns.
- **Roadmap & Progress**: Update `context/progress-tracker.md` upon completing any meaningful implementation milestone.

## Before Moving to the Next Unit

1. **Functional Verification**: The current unit functions end-to-end within its defined scope.
2. **Invariant Compliance**: No architectural invariant from `context/architecture.md` (e.g., workspace isolation, zero external AI dependencies, strict form validation with React Hook Form + Zod, shadcn/ui and Lucide compliance) is violated.
3. **Type Safety**: TypeScript compiles cleanly with zero errors (`tsc --noEmit`).
4. **Progress Tracking**: `context/progress-tracker.md` is updated with completed tasks and the next immediate focus.
