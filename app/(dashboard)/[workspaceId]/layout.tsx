import * as React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/rbac";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  Zap,
  BarChart3,
  Users,
  Settings,
  Bell,
  Search,
  LogOut,
  Compass,
} from "lucide-react";
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

  if (!session?.user) {
    redirect("/login");
  }

  let accessContext;
  try {
    accessContext = await requireWorkspaceAccess(workspaceId, "VIEWER");
  } catch (err) {
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

  const navItems = [
    {
      label: "Overview",
      href: `/${workspaceId}`,
      icon: LayoutDashboard,
    },
    {
      label: "Boards & Kanban",
      href: `/${workspaceId}/boards`,
      icon: Kanban,
    },
    {
      label: "Calendar",
      href: `/${workspaceId}/calendar`,
      icon: Calendar,
    },
    {
      label: "Automations",
      href: `/${workspaceId}/automations`,
      icon: Zap,
    },
    {
      label: "Analytics",
      href: `/${workspaceId}/analytics`,
      icon: BarChart3,
    },
    {
      label: "Members & Team",
      href: `/${workspaceId}/settings/members`,
      icon: Users,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#09090b] text-foreground selection:bg-primary/20 selection:text-primary">
      {/* 240px Fixed Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-zinc-800/80 bg-[#121215]">
        {/* Workspace Switcher Header */}
        <div className="p-3 border-b border-zinc-800/60">
          <WorkspaceSwitcher
            currentWorkspaceId={workspace.id}
            currentWorkspaceName={workspace.name}
            currentWorkspaceRole={accessContext.role}
          />
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            <div className="px-2 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-zinc-800/80 hover:text-foreground transition-all group"
                >
                  <Icon className="size-4 text-zinc-400 group-hover:text-primary transition-colors" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Account Footer */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#101013] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="size-7">
              {session.user.image && <AvatarImage src={session.user.image} />}
              <AvatarFallback className="text-[10px]">
                {(session.user.name || session.user.email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-medium text-foreground">
                {session.user.name || "User"}
              </span>
              <span className="truncate text-[10px] text-muted-foreground font-mono">
                {session.user.email}
              </span>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground hover:bg-zinc-800"
              title="Sign Out"
            >
              <LogOut className="size-3.5" />
            </Button>
          </form>
        </div>
      </aside>

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
