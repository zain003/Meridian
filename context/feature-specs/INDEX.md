# Feature Specifications Index

Running tracker of all feature specifications, layers, priorities, dependencies, and implementation statuses for Meridian.

---

## Specification Catalog

| File ID | Layer | Priority | Feature Module | Depends On | Status | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `000-shared-contracts.md` | Core | P0 | Global | None | Completed | Shared data models, types, RBAC patterns, and conventions |
| `FEAT-001-BE-auth-workspace.md` | BE | P0 | Auth & Workspace | `000-shared-contracts.md` | Completed | Auth.js handlers, workspace CRUD, invite codes, and RBAC actions |
| `FEAT-001-FE-auth-workspace.md` | FE | P0 | Auth & Workspace | `FEAT-001-BE-auth-workspace.md` | Completed | Auth forms, workspace onboarding wizard, switcher, and invite dialog |
| `FEAT-001-VERIFY-auth-workspace.md` | VERIFY | P0 | Auth & Workspace | `FEAT-001-FE-auth-workspace.md` | Completed | Verification pass for Auth & Multi-Tenancy |
| `FEAT-002-BE-projects-boards.md` | BE | P0 | Projects & Boards | `FEAT-001-VERIFY-auth-workspace.md` | Not Started | Project CRUD, board column management, and workspace scoping |
| `FEAT-002-FE-projects-boards.md` | FE | P0 | Projects & Boards | `FEAT-002-BE-projects-boards.md` | Not Started | Project navigation tree, project settings, and board view scaffolding |
| `FEAT-002-VERIFY-projects-boards.md` | VERIFY | P0 | Projects & Boards | `FEAT-002-FE-projects-boards.md` | Not Started | Verification pass for Projects & Boards |
| `FEAT-003-BE-tasks.md` | BE | P0 | Tasks & Views | `FEAT-002-VERIFY-projects-boards.md` | Not Started | Task CRUD, column movement, subtasks, labels, and comments |
| `FEAT-003-FE-kanban-dnd.md` | FE | P0 | Tasks & Views | `FEAT-003-BE-tasks.md` | Not Started | Drag-and-drop Kanban board with `@dnd-kit` and optimistic updates |
| `FEAT-003-FE-task-views.md` | FE | P0 | Tasks & Views | `FEAT-003-BE-tasks.md` | Not Started | List view, Calendar view, and Task detail modal drawer |
| `FEAT-003-VERIFY-tasks.md` | VERIFY | P0 | Tasks & Views | `FEAT-003-FE-task-views.md` | Not Started | Verification pass for Tasks & Multi-View UI |
| `FEAT-004-BE-realtime.md` | BE | P0 | Real-Time Sync | `FEAT-001-VERIFY-auth-workspace.md` | Not Started | Real-time channel auth route handler and token minting |
| `FEAT-004-INT-realtime-sync.md` | INT | P0 | Real-Time Sync | `FEAT-004-BE-realtime.md`, `FEAT-003-BE-tasks.md` | Not Started | Task mutation event broadcast dispatchers and client sync hooks |
| `FEAT-004-FE-presence-ui.md` | FE | P0 | Real-Time Sync | `FEAT-004-INT-realtime-sync.md` | Not Started | Live presence avatar stack and active card viewer badges |
| `FEAT-004-VERIFY-realtime.md` | VERIFY | P0 | Real-Time Sync | `FEAT-004-FE-presence-ui.md` | Not Started | Verification pass for Real-Time & Live Presence |
| `FEAT-005-BE-rule-engine.md` | BE | P0 | Automation Engine | `FEAT-003-BE-tasks.md` | Not Started | JSON rule parser, condition evaluator, action executor, loop guard |
| `FEAT-005-INT-queue-worker.md` | INT | P0 | Automation Engine | `FEAT-005-BE-rule-engine.md` | Not Started | Upstash Redis queue producer/consumer and execution audit logger |
| `FEAT-005-FE-rule-builder.md` | FE | P0 | Automation Engine | `FEAT-005-BE-rule-engine.md` | Not Started | Visual block-based rule builder canvas and audit execution log list |
| `FEAT-005-VERIFY-automation.md` | VERIFY | P0 | Automation Engine | `FEAT-005-FE-rule-builder.md` | Not Started | Verification pass for Automation Engine |
| `FEAT-006-BE-notifications.md` | BE | P1 | Notifications | `FEAT-001-VERIFY-auth-workspace.md` | Not Started | In-app notification CRUD and Resend transactional email dispatcher |
| `FEAT-006-FE-notification-center.md` | FE | P1 | Notifications | `FEAT-006-BE-notifications.md` | Not Started | Notification bell, unread badge, and notification popover drawer |
| `FEAT-006-VERIFY-notifications.md` | VERIFY | P1 | Notifications | `FEAT-006-FE-notification-center.md` | Not Started | Verification pass for Notifications |
| `FEAT-007-BE-stripe-billing.md` | BE | P1 | Billing & Stripe | `FEAT-001-VERIFY-auth-workspace.md` | Not Started | Stripe Customer creation, Checkout session, and Customer Portal generator |
| `FEAT-007-INT-stripe-webhooks.md` | INT | P1 | Billing & Stripe | `FEAT-007-BE-stripe-billing.md` | Not Started | Stripe webhook route handler with signature verification and tier sync |
| `FEAT-007-FE-billing-portal.md` | FE | P1 | Billing & Stripe | `FEAT-007-BE-stripe-billing.md` | Not Started | Billing settings view with tier comparison card and upgrade triggers |
| `FEAT-007-VERIFY-billing.md` | VERIFY | P1 | Billing & Stripe | `FEAT-007-FE-billing-portal.md` | Not Started | Verification pass for Stripe Billing |
| `FEAT-008-BE-analytics-metrics.md` | BE | P1 | Analytics Dashboard | `FEAT-003-VERIFY-tasks.md` | Not Started | Database aggregation queries for velocity, burndown, cycle time, workload |
| `FEAT-008-FE-analytics-dashboard.md` | FE | P1 | Analytics Dashboard | `FEAT-008-BE-analytics-metrics.md` | Not Started | Analytics dashboard page with Recharts charts and date filter controls |
| `FEAT-008-VERIFY-analytics.md` | VERIFY | P1 | Analytics Dashboard | `FEAT-008-FE-analytics-dashboard.md` | Not Started | Verification pass for Analytics Dashboard |
