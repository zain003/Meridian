"use server";

import { requireWorkspaceAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  updateMemberRoleSchema,
  type InviteMemberInput,
} from "@/lib/validations/workspace";
import type { ActionResponse, UserRole } from "@/types";

export type { InviteMemberInput };

export async function getWorkspaceMembersAction(
  workspaceId: string
): Promise<
  ActionResponse<
    Array<{ id: string; userId: string; name: string | null; email: string; role: UserRole }>
  >
> {
  try {
    await requireWorkspaceAccess(workspaceId, "VIEWER");

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const formattedMembers = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role as UserRole,
    }));

    return {
      success: true,
      data: formattedMembers,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to get workspace members:", error);
    return {
      success: false,
      error: "Failed to fetch workspace members",
    };
  }
}

export async function updateMemberRoleAction(
  workspaceId: string,
  targetUserId: string,
  newRole: UserRole
): Promise<ActionResponse<void>> {
  const parsed = updateMemberRoleSchema.safeParse({
    workspaceId,
    targetUserId,
    newRole,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input data",
    };
  }

  try {
    const { user: currentUser, role: currentRole } = await requireWorkspaceAccess(
      workspaceId,
      "ADMIN"
    );

    // Only OWNER can promote someone to OWNER or demote another OWNER
    if (newRole === "OWNER" && currentRole !== "OWNER") {
      return {
        success: false,
        error: "FORBIDDEN",
      };
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      return {
        success: false,
        error: "Target user is not a member of this workspace",
      };
    }

    // If target member is currently an OWNER and current user is not an OWNER, reject
    if (targetMember.role === "OWNER" && currentRole !== "OWNER") {
      return {
        success: false,
        error: "FORBIDDEN",
      };
    }

    // Prevent sole owner lockout if current owner demotes themselves
    if (targetMember.role === "OWNER" && newRole !== "OWNER") {
      const ownerCount = await prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: "OWNER",
        },
      });

      if (ownerCount <= 1) {
        return {
          success: false,
          error: "Cannot demote the sole owner of a workspace",
        };
      }
    }

    await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
      data: {
        role: newRole,
      },
    });

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to update member role:", error);
    return {
      success: false,
      error: "Failed to update member role",
    };
  }
}
