import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/rbac";
import { Sidebar } from "@/components/workspace/sidebar";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { signOut } from "@/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { workspaceId } = await params;
  const session = await getAuthSession();

  if (!session?.user?.id) {
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
      slug: true,
      inviteCode: true,
    },
  });

  if (!workspace) {
    notFound();
  }

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      key: true,
      description: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-[#09090b] text-foreground selection:bg-primary/20 selection:text-primary">
      {/* 240px Left Sidebar */}
      <Sidebar
        workspace={workspace}
        role={accessContext.role}
        projects={projects}
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        signOutAction={handleSignOut}
      />

      {/* Main Content Viewport with Sticky Glass Topbar */}
      <div className="flex flex-1 flex-col pl-60">
        {/* Sticky 56px Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-800/60 bg-[#09090b]/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{workspace.name}</span>
              <span>/</span>
              <span className="text-zinc-500 font-mono">/{workspace.slug}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <InviteMemberDialog
              workspaceId={workspace.id}
              workspaceName={workspace.name}
              inviteCode={workspace.inviteCode}
            />

            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-800"
            >
              <Bell className="size-4" />
            </Button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
