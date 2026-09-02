# Meridian Workspace Context & Rules

Before proposing, planning, or writing any code in this repository, you MUST automatically read and verify against the following context files:

1. `context/project-overview.md` — Product scope, user flows, and core invariants.
2. `context/architecture.md` — Architecture, system boundaries, Next.js 16 stack, and multi-tenant scoping.
3. `context/UI/UI-Rules.md` (and `context/ui-context.md`) — The "Quiet Luxury" design system, dark/light theme tokens, glassmorphism recipes, typography, border radius tokens, and component styling.
4. `context/code-standards.md` — TypeScript strict mode (no `any`), shadcn/ui, React Hook Form + Zod form validation, Lucide icons, and `ActionResponse<T>` conventions.
5. `context/testing-standards.md` — Test architecture, quality gates, and mandatory `/test-reports/` generation protocol.
6. `context/progress-tracker.md` — Current implementation phase, completed tasks, and active roadmap focus.
7. `context/ai-workflow-rules.md` — Spec-driven incremental workflow, task splitting boundaries, and DoD checklist.
8. `context/feature-specs/000-shared-contracts.md` — Single source of truth for Prisma models, global TypeScript types, RBAC patterns, and shared Zod schemas.
9. The active feature spec under `context/feature-specs/` matching the user's task.
10. `test-reports/INDEX.md` — Master test execution registry in root directory.
