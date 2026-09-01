# Meridian

> *The fixed point your team's work revolves around.*

Meridian is a modern, high-velocity SaaS project management and deterministic workflow automation platform built for high-performance engineering and product teams.

---

## Features

- **Multi-Tenant Workspaces & RBAC**: Secure, isolated workspaces with role-based access control (Owner, Admin, Member, Viewer).
- **Interactive Project Boards**: Dynamic Kanban (drag-and-drop with `@dnd-kit`), List, and Calendar views with rich task metadata.
- **Deterministic Automation Engine**: Visual rule builder (**Trigger → Condition → Action**) running asynchronous background workflows with complete audit trails.
- **Real-Time Collaboration**: Live presence avatars, optimistic UI updates, and instant task mutation broadcasts.
- **Analytics & Insights**: Actionable burndown, cycle time, workload distribution, and sprint velocity tracking.
- **SaaS Lifecycle Integration**: Stripe subscription billing (Free & Pro tiers) and multi-channel in-app and email notifications.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Actions, React Server Components)
- **Frontend**: React 19, TypeScript (Strict Mode)
- **Styling**: Tailwind CSS & shadcn/ui ("Quiet Luxury" design system)
- **Forms & Validation**: React Hook Form + Zod
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Auth**: Auth.js (NextAuth v5)
- **Real-Time / Cache**: Pusher / Upstash Redis
- **Billing**: Stripe API & Webhooks

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm / pnpm / yarn
- PostgreSQL instance

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/zain003/Meridian.git
   cd Meridian
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License

MIT
