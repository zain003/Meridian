---
name: prisma-workflows
description: >-
  Provides runbooks and commands for managing Prisma schema migrations, client generation,
  multi-tenant workspace isolation queries, and database seeding in PostgreSQL.
  Use when modifying schema.prisma, running migrations, writing database queries, or setting up seed scripts.
---

# Prisma ORM & Database Workflows

## Overview

Meridian uses **Prisma ORM** connected to PostgreSQL. All relational tables and queries must enforce strict multi-tenant isolation scoped by `workspaceId`.

## Essential Commands

- **Generate Client**: `npx prisma generate`
- **Create & Apply Migration (Dev)**: `npx prisma migrate dev --name <migration_name>`
- **Deploy Migrations (Production/CI)**: `npx prisma migrate deploy`
- **Reset Database (Dev only)**: `npx prisma migrate reset`
- **Prisma Studio**: `npx prisma studio`
- **Run Seed Script**: `npx prisma db seed` (configured via `package.json` `"prisma": { "seed": "tsx prisma/seed.ts" }`)

## Multi-Tenant Query Rules

1. **Mandatory Workspace Scoping**: Every Prisma query against workspace-owned entities (`Project`, `Board`, `Column`, `Task`, `Comment`, `Rule`, `Notification`) must include `where: { workspaceId }` or enforce relationship hierarchy through a verified `workspaceId`.
2. **Atomic Transactions**: When creating tasks, triggering automations, or executing reorders across columns, wrap operations in `prisma.$transaction`:
   ```typescript
   await prisma.$transaction(async (tx) => {
     const updatedTask = await tx.task.update({
       where: { id: taskId, workspaceId },
       data: { columnId: targetColumnId, order: targetOrder },
     });
     // record history / queue event...
   });
   ```
3. **Singleton Client**: Import `prisma` exclusively from `@/lib/prisma` to prevent socket exhaustion during Next.js hot reload:
   ```typescript
   import { PrismaClient } from "@prisma/client";

   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

   export const prisma = globalForPrisma.prisma || new PrismaClient();

   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
   ```

## Schema Conventions

- IDs use `cuid()` default generators.
- Timestamps use `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- Use composite indexes `@@index([workspaceId])` on all tenant-partitioned models.
