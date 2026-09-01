# 000 — Shared Contracts & Global Architecture

Single source of truth for domain data models, shared types, naming conventions, permissions, and cross-cutting contracts for Meridian.

---

## 1. Core Data Models (Prisma Schema Reference)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum RuleTriggerType {
  TASK_CREATED
  TASK_STATUS_CHANGED
  TASK_ASSIGNEE_CHANGED
  TASK_PRIORITY_CHANGED
  TASK_DUE_DATE_PASSED
}

enum SubscriptionTier {
  FREE
  PRO
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  CANCELED
  INCOMPLETE
  PAST_DUE
  UNPAID
}

model User {
  id            String            @id @default(cuid())
  name          String?
  email         String            @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  memberships   WorkspaceMember[]
  assignedTasks Task[]            @relation("TaskAssignee")
  comments      Comment[]
  notifications Notification[]
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Workspace {
  id           String            @id @default(cuid())
  name         String
  slug         String            @unique
  inviteCode   String            @unique @default(cuid())
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  members      WorkspaceMember[]
  projects     Project[]
  rules        AutomationRule[]
  subscription Subscription?
}

model WorkspaceMember {
  id          String    @id @default(cuid())
  workspaceId String
  userId      String
  role        Role      @default(MEMBER)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@index([workspaceId])
  @@index([userId])
}

model Project {
  id          String    @id @default(cuid())
  workspaceId String
  name        String
  description String?
  key         String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  boards      Board[]
  tasks       Task[]

  @@unique([workspaceId, key])
  @@index([workspaceId])
}

model Board {
  id        String   @id @default(cuid())
  projectId String
  name      String
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  columns   Column[]

  @@index([projectId])
}

model Column {
  id        String   @id @default(cuid())
  boardId   String
  name      String
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  tasks     Task[]

  @@index([boardId])
}

model Task {
  id          String       @id @default(cuid())
  workspaceId String
  projectId   String
  columnId    String
  title       String
  description String?      @db.Text
  priority    TaskPriority @default(MEDIUM)
  order       Int          @default(0)
  dueDate     DateTime?
  assigneeId  String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  completedAt DateTime?
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  column      Column       @relation(fields: [columnId], references: [id], onDelete: Cascade)
  assignee    User?        @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  subtasks    Subtask[]
  comments    Comment[]
  labels      TaskLabel[]

  @@index([workspaceId])
  @@index([projectId])
  @@index([columnId])
  @@index([assigneeId])
}

model Subtask {
  id        String   @id @default(cuid())
  taskId    String
  title     String
  isDone    Boolean  @default(false)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
}

model Label {
  id          String      @id @default(cuid())
  workspaceId String
  name        String
  color       String
  tasks       TaskLabel[]

  @@unique([workspaceId, name])
  @@index([workspaceId])
}

model TaskLabel {
  taskId  String
  labelId String
  task    Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  label   Label  @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([taskId, labelId])
}

model Comment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([userId])
}

model AutomationRule {
  id          String          @id @default(cuid())
  workspaceId String
  name        String
  description String?
  triggerType RuleTriggerType
  triggerData Json
  conditions  Json            // Array of condition objects
  actions     Json            // Array of action objects
  isActive    Boolean         @default(true)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  workspace   Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  logs        ExecutionLog[]

  @@index([workspaceId])
}

model ExecutionLog {
  id        String         @id @default(cuid())
  ruleId    String
  status    String         // "SUCCESS" | "FAILED" | "SKIPPED"
  eventData Json
  result    Json
  error     String?
  firedAt   DateTime       @default(now())
  rule      AutomationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)

  @@index([ruleId])
  @@index([firedAt])
}

model Notification {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  title       String
  message     String
  entityType  String   // "TASK" | "COMMENT" | "RULE"
  entityId    String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([workspaceId])
}

model Subscription {
  id                   String             @id @default(cuid())
  workspaceId          String             @unique
  stripeCustomerId     String             @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?
  tier                 SubscriptionTier   @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  currentPeriodEnd     DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  workspace            Workspace          @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}
```

---

## 2. Global Shared TypeScript Interfaces & Enums

```typescript
export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  role: UserRole;
}

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export interface RuleCondition {
  field: "status" | "priority" | "assigneeId" | "columnId" | "dueDate";
  operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GREATER_THAN" | "LESS_THAN" | "IS_EMPTY" | "IS_NOT_EMPTY";
  value: string | number | boolean | null;
}

export interface RuleAction {
  type: "ASSIGN_USER" | "MOVE_COLUMN" | "SET_PRIORITY" | "ADD_LABEL" | "SEND_NOTIFICATION" | "SEND_EMAIL";
  payload: Record<string, unknown>;
}

export interface RealtimePresenceUser {
  userId: string;
  name: string;
  image?: string | null;
  activeBoardId?: string;
  activeTaskId?: string;
  lastSeenAt: number;
}
```

---

## 3. Auth & Role-Based Access Control (RBAC) Pattern

```typescript
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Server Action access check pattern:
export async function requireWorkspaceAccess(
  workspaceId: string,
  requiredRole: UserRole = "MEMBER"
): Promise<{ user: SessionUser; role: UserRole }> {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
  });

  if (!member || !hasMinimumRole(member.role as UserRole, requiredRole)) {
    throw new Error("FORBIDDEN");
  }

  return { user: session.user, role: member.role as UserRole };
}
```

---

## 4. Naming Conventions

- **Files & Folders**: `kebab-case` (e.g. `task-card.tsx`, `rule-builder.tsx`, `server/actions/task-actions.ts`).
- **React Components**: `PascalCase` (e.g. `TaskCard`, `KanbanBoard`, `RuleBuilder`).
- **Server Actions & Helpers**: `camelCase` (e.g. `createTaskAction`, `evaluateRule`, `getWorkspaceMembers`).
- **Database Tables/Models**: `PascalCase` singular in Prisma (e.g. `WorkspaceMember`, `ExecutionLog`).
- **Zod Schemas**: `camelCase` with `Schema` suffix (e.g. `createTaskSchema`, `updateRuleSchema`).

---

## 5. Cross-Cutting Standards & Response Envelopes

- **Framework**: Next.js 16 App Router with React 19 and Server Actions.
- **No `any`**: Explicit types or `unknown` with Zod validation.
- **Server Actions**: Always return `ActionResponse<T>` with server-side Zod parsing.
- **Forms**: React Hook Form with `@hookform/resolvers/zod` and shadcn/ui `<Form />` primitives.
- **Icons**: Lucide Icons (`lucide-react`) exclusively.
- **Styling**: Tailwind CSS configuration conforming to `context/UI/UI-Rules.md` and CSS variable tokens.
- **Database Scoping**: Every query must filter by `workspaceId`.
- **Side-Effects**: Trigger internal events asynchronously via Redis queue.
- **Testing**: Unit tests in Vitest, End-to-End browser tests in Playwright.

---

## 6. Form & Zod Schema Validation Pattern

```typescript
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Shared Zod Schema
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters").max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens").optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

// Form Hook usage pattern:
export function useWorkspaceForm(defaultValues?: Partial<CreateWorkspaceInput>) {
  return useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      ...defaultValues,
    },
  });
}
```

