import * as React from "react";
import { redirect, notFound } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/rbac";
import { MemberTable } from "@/components/workspace/member-table";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import type { UserRole } from "@/types";
import { Users } from "lucide-react";

interface MembersPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { workspaceId } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  let accessContext;
  try {
    accessContext = await requireWorkspaceAccess(workspaceId, "VIEWER");
  } catch {
    redirect("/onboarding");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      inviteCode: true,
    },
  });

  if (!workspace) {
    notFound();
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
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
    image: m.user.image,
  }));

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Team Members
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage who has access to {workspace.name} and configure their permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <InviteMemberDialog
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            inviteCode={workspace.inviteCode}
          />
        </div>
      </div>

      {/* Member Management Table */}
      <MemberTable
        workspaceId={workspace.id}
        currentUserId={session.user.id}
        currentUserRole={accessContext.role}
        initialMembers={formattedMembers}
      />
    </div>
  );
}
