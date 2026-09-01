import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, SessionUser } from "@/types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

export async function requireWorkspaceAccess(
  workspaceId: string,
  requiredRole: UserRole = "MEMBER"
): Promise<{ user: SessionUser; role: UserRole }> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

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

  return {
    user: session.user,
    role: member.role as UserRole,
  };
}
