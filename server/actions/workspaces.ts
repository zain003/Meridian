"use server";

import crypto from "crypto";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createWorkspaceSchema,
  joinWorkspaceSchema,
  type CreateWorkspaceInput,
} from "@/lib/validations/workspace";
import type { ActionResponse, UserRole } from "@/types";

export type { CreateWorkspaceInput };

function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return baseSlug || "workspace";
}

async function findUniqueSlug(baseSlug: string): Promise<string> {
  let candidateSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.workspace.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    });

    if (!existing) {
      return candidateSlug;
    }

    const suffix = crypto.randomBytes(3).toString("hex");
    candidateSlug = `${baseSlug}-${suffix}`;
    counter++;
    if (counter > 10) {
      candidateSlug = `${baseSlug}-${Date.now()}`;
      return candidateSlug;
    }
  }
}

export async function createWorkspaceAction(
  input: CreateWorkspaceInput
): Promise<ActionResponse<{ workspaceId: string; slug: string }>> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: "UNAUTHORIZED" };
  }

  const parsed = createWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: "Invalid input",
      fieldErrors,
    };
  }

  const { name, slug } = parsed.data;
  const initialSlug = slug ? generateSlug(slug) : generateSlug(name);
  const finalSlug = await findUniqueSlug(initialSlug);

  try {
    const workspace = await prisma.$transaction(async (tx) => {
      const createdWorkspace = await tx.workspace.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          members: {
            create: {
              userId: session.user.id,
              role: "OWNER",
            },
          },
        },
      });

      return createdWorkspace;
    });

    return {
      success: true,
      data: {
        workspaceId: workspace.id,
        slug: workspace.slug,
      },
    };
  } catch (error) {
    console.error("Failed to create workspace:", error);
    return {
      success: false,
      error: "Failed to create workspace. Please try again.",
    };
  }
}

export async function getUserWorkspacesAction(): Promise<
  ActionResponse<Array<{ id: string; name: string; slug: string; role: UserRole }>>
> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: "UNAUTHORIZED" };
  }

  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const workspaces = memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      role: membership.role as UserRole,
    }));

    return {
      success: true,
      data: workspaces,
    };
  } catch (error) {
    console.error("Failed to get user workspaces:", error);
    return {
      success: false,
      error: "Failed to retrieve workspaces",
    };
  }
}

export async function joinWorkspaceByInviteCodeAction(
  inviteCode: string
): Promise<ActionResponse<{ workspaceId: string; slug: string }>> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: "UNAUTHORIZED" };
  }

  const parsed = joinWorkspaceSchema.safeParse({ inviteCode });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid invite code format",
    };
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { inviteCode: parsed.data.inviteCode.trim() },
      select: { id: true, slug: true },
    });

    if (!workspace) {
      return {
        success: false,
        error: "Workspace not found or invalid invite code",
      };
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: session.user.id,
        },
      },
    });

    if (existingMember) {
      return {
        success: true,
        data: {
          workspaceId: workspace.id,
          slug: workspace.slug,
        },
      };
    }

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: session.user.id,
        role: "MEMBER",
      },
    });

    return {
      success: true,
      data: {
        workspaceId: workspace.id,
        slug: workspace.slug,
      },
    };
  } catch (error) {
    console.error("Failed to join workspace:", error);
    return {
      success: false,
      error: "Failed to join workspace",
    };
  }
}
