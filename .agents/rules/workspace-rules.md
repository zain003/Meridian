# Meridian Workspace Agent Rules

## MANDATORY PRE-FLIGHT READING (EVERY SESSION & EVERY FEATURE)

Before proposing, planning, or writing any code in this repository, you MUST read and comply with the following context files:

1. `context/project-overview.md` — Product scope, user flows, and core invariants.
2. `context/architecture.md` — Technical stack (Next.js 16, React 19, TypeScript strict mode, Prisma, Auth.js v5, Upstash Redis), system boundaries, and multi-tenant scoping.
3. `context/UI/UI-Rules.md` (and `context/ui-context.md`) — The "Quiet Luxury" design system, dark/light theme tokens, glassmorphism recipes, typography, border radius tokens, and shadcn/ui component styling.
4. `context/code-standards.md` — Code conventions, TypeScript strict mode (no `any`), React Hook Form + Zod form validation, Lucide icons, and `ActionResponse<T>` envelope standards.
5. `context/progress-tracker.md` — Current implementation phase, completed tasks, and active goals.
6. `context/ai-workflow-rules.md` — Strict spec-driven incremental workflow, protected files, and DoD validation checklist.
7. `context/feature-specs/000-shared-contracts.md` — Shared Prisma models, global TypeScript types, RBAC patterns, and Zod schemas.
8. The specific feature specification file under `context/feature-specs/` matching the user's active request.

## EXECUTION RULES

- **Zero External AI Dependencies**: All automation logic, workflow triggers, and analytics calculations must be 100% deterministic custom TypeScript logic.
- **Strict Multi-Tenancy**: Every database query must explicitly filter by `workspaceId`.
- **Form Handling**: Always use React Hook Form with `@hookform/resolvers/zod` and shadcn `<Form />` primitives on the frontend, and re-validate with Zod in Server Actions.
- **No Arbitrary Hex Styling**: Use Tailwind CSS design tokens and CSS variables mapped in `context/UI/UI-Rules.md`.
- **Progress Tracking**: Update `context/progress-tracker.md` after completing any feature unit.
