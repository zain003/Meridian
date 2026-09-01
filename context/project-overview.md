# Meridian — Project Management & Automation Platform

> *"Meridian — the fixed point your team's work revolves around."*

## Overview

Meridian is a multi-tenant SaaS project management platform (Linear/Asana-style) engineered for high-velocity teams. Teams create isolated workspaces, manage projects across interactive Kanban, list, and calendar views, collaborate in real time with live presence, and streamline operations using a custom rules-based automation engine and comprehensive analytics dashboard.

Meridian is built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **shadcn/ui**, **Tailwind CSS**, **React Hook Form**, **Zod**, and **Lucide Icons**. It relies entirely on self-contained, deterministic logic with zero external AI dependencies—ensuring 100% demo reliability, predictable performance, and total cost control. It solves the friction of manual status updates, task administration, and fragmented project tracking by automating routine workflows and providing immediate visibility into team velocity.

## Goals

1. **Robust Multi-Tenancy & Access Control**: Provide secure, isolated workspaces with role-based access control (Owner, Admin, Member, Viewer) and seamless onboarding.
2. **Dynamic Project & Task Management**: Deliver ultra-responsive Kanban (drag-and-drop powered by `@dnd-kit`), list, and calendar views with rich task metadata (subtasks, priorities, labels, due dates, attachments).
3. **Custom Event-Driven Automation Engine**: Empower users to build "Trigger → Condition → Action" workflows with asynchronous execution and audit trails without relying on third-party AI APIs.
4. **Live Real-Time Collaboration**: Broadcast instant task updates, optimistic UI reconciliation, and live presence indicators across all connected clients.
5. **Actionable Velocity & Workload Analytics**: Provide interactive charts for burndown, cycle time, team velocity, and workload distribution.
6. **Full SaaS Lifecycle Integration**: Support multi-tier subscriptions via Stripe (Checkout, Customer Portal, Webhooks) and multi-channel notifications (in-app + transactional email).

## Core Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components, Server Actions)
- **Language**: TypeScript (Strict Mode)
- **UI Primitives**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS (CSS variables and theme configuration)
- **Forms & Validation**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Iconography**: Lucide React (`lucide-react`)
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Authentication**: Auth.js (NextAuth v5)
- **Real-Time Layer**: Pusher / Ably
- **Queue / Caching**: Upstash Redis
- **Billing**: Stripe API & Webhooks

## Core User Flow

1. **Authentication & Workspace Onboarding**: User signs up via Email/Password or OAuth (Google, GitHub), creates a workspace, and invites team members via role-scoped invite links.
2. **Project & Board Setup**: User creates projects, configures board columns (Backlog, Todo, In Progress, Review, Done), and populates tasks.
3. **Daily Workflow & Collaboration**: Team members drag-and-drop tasks across boards, view real-time presence avatars, leave comments, upload attachments, and receive @mention notifications.
4. **Automation Rule Configuration**: Admins configure custom automated workflows using a visual rule builder (e.g., *"When task is moved to Done → notify manager"* or *"When due date passes → flag as overdue and reassign"*).
5. **Background Execution & Audit Logging**: System emits task events, evaluates matching rules, executes actions asynchronously via Redis-backed queue, and logs execution records.
6. **Analytics & Performance Tracking**: Managers track project health through team velocity charts, task cycle time distributions, burndown graphs, and member workload metrics.
7. **Billing & Workspace Administration**: Workspace Owners upgrade to Pro via Stripe Checkout, manage seats via Stripe Customer Portal, and configure workspace-level settings.

## Features

### Multi-Tenant Auth & Workspaces
- Email/Password and OAuth (Google, GitHub) via Auth.js (NextAuth).
- Multi-tenant workspace isolation scoped by `workspace_id`.
- Role-based access control: Owner, Admin, Member, Viewer.
- Invite links, member management, and streamlined onboarding flow with React Hook Form and Zod validation.

### Project & Task Management
- Projects, boards, and tasks with subtasks, labels, priorities (Low, Medium, High, Urgent), and due dates.
- Interactive drag-and-drop Kanban board powered by `@dnd-kit`.
- Multi-view support: Kanban view, List view, and Calendar view.
- Task detail modals with markdown description, comment stream, @mentions, and file attachments built with shadcn/ui components.

### Real-Time Collaboration
- Live presence indicators showing active collaborators per board and task.
- Instant task mutation broadcasts to all connected workspace members.
- Optimistic UI updates with conflict resolution and smooth state reconciliation.
- Real-time transport powered by Pusher / Ably (or self-hosted WebSockets).

### Rules-Based Automation Engine
- Visual rule builder: **Trigger** → **Condition** → **Action**.
- **Triggers**: Task created, status changed, due date passed, assignee changed, priority updated.
- **Conditions**: Field matches, value comparisons, label checks, assignee filters.
- **Actions**: Auto-assign user, send in-app/email notification, move board/status, apply label, escalate priority.
- Execution audit log displaying timestamped rule execution history and status.
- Event-driven architecture with PostgreSQL JSON rule storage and Upstash Redis queue.

### Notifications & Communication
- In-app notification center with real-time badges and read/unread states.
- Transactional emails via Resend/SendGrid for mentions, due date reminders, and automation actions.

### Subscription Billing
- Tiered pricing: Free Tier vs. Pro Tier.
- Stripe integration: Stripe Checkout, Stripe Customer Portal, and secure webhook-driven plan synchronization.

### Analytics Dashboard
- Team velocity tracking across sprints and time intervals.
- Burndown charts, task cycle time metrics, and member workload distribution.
- Filterable by project, assignee, and custom date ranges (using Recharts / Tremor).

### Workspace Settings & Customization
- Workspace profile settings, member role administration, and billing management.
- Dark/Light mode theme switching with responsive desktop and mobile-optimized layouts.

## Scope

### In Scope
- Multi-tenant workspaces with role-based access control (Owner, Admin, Member, Viewer).
- Project management with Kanban (dnd-kit), List, and Calendar views.
- Real-time presence and live task synchronization.
- Custom event-driven rules automation engine with execution logs.
- In-app notification center and transactional email delivery.
- Stripe subscription billing (Free & Pro tiers with webhooks).
- Team analytics dashboard (velocity, burndown, cycle time, workload).
- Full dark/light mode responsive web application built with Next.js 16, shadcn/ui, Tailwind CSS, React Hook Form, Zod, and Lucide icons.

### Out of Scope
- Native mobile applications (iOS/Android) — responsive web only.
- Third-party integrations (Slack, Jira, GitHub sync) — scheduled for future roadmap.
- External AI/LLM API dependencies — explicitly excluded by design for deterministic reliability, zero cost overhead, and demo stability.

## Success Criteria

1. **Isolated Multi-Tenancy**: Zero data leakage across workspaces, strictly enforced at the database and middleware layers.
2. **Sub-100ms Perceived Interaction**: Fluid drag-and-drop Kanban with optimistic UI updates and immediate real-time sync.
3. **Deterministic Workflow Automation**: Custom automation engine reliably triggers, evaluates conditions, and executes actions within <1 second with complete audit trail logging.
4. **End-to-End Billing & Webhooks**: Seamless Stripe Checkout flow and webhook-driven tier entitlement updates.
5. **Comprehensive Analytics**: Accurate visualization of team velocity, burndown, task cycle times, and member workloads.
6. **Production-Ready Quality**: 100% type safety in TypeScript strict mode, clean component architecture, and passing automated test suite (Vitest + Playwright).
