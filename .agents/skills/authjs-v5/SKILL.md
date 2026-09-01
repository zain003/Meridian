---
name: authjs-v5
description: >-
  Provides configuration guides and procedures for Auth.js (NextAuth v5) in Next.js 16 App Router,
  including credentials provider, OAuth providers (Google, GitHub), Prisma adapter, and Edge middleware route protection.
  Use when implementing authentication, user registration, session management, or role-based access checks.
---

# Auth.js (NextAuth v5) Skill

## Overview

Meridian uses **Auth.js (NextAuth v5)** with Prisma Adapter for session management, supporting both Credentials (email/password with bcrypt) and OAuth (Google & GitHub).

## Configuration Architecture

- **Auth Config & Handlers**: `auth.ts` exports `handlers`, `signIn`, `signOut`, `auth`.
- **API Route Handler**: `app/api/auth/[...nextauth]/route.ts` exports `{ GET, POST } = handlers`.
- **Edge Middleware**: `middleware.ts` intercepts requests, checks session token, and redirects unauthenticated traffic to `/login`.

## Role-Based Access Control (RBAC) Pattern

```typescript
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, SessionUser } from "@/types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export async function requireWorkspaceAccess(
  workspaceId: string,
  requiredRole: UserRole = "MEMBER"
): Promise<{ user: SessionUser; role: UserRole }> {
  const session = await auth();
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

  return { user: session.user as SessionUser, role: member.role as UserRole };
}
```

## Middleware Protection

```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
  
  if (isAuthPage) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/onboarding", req.nextUrl));
    return NextResponse.next();
  }

  if (!isLoggedIn && !req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```
