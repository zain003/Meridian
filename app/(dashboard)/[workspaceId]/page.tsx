import * as React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/rbac";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Kanban,
  Zap,
  Users,
  ArrowRight,
  Compass,
} from "lucide-react";

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceOverviewPage({
  params,
}: WorkspacePageProps) {
  const { workspaceId } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    await requireWorkspaceAccess(workspaceId, "VIEWER");
  } catch {
    redirect("/onboarding");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      projects: {
        select: { id: true, name: true, key: true },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900 via-[#121215] to-[#121215] p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 size-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Compass className="size-3.5" />
            <span>Workspace Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome to {workspace.name}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Your centralized command center for high-velocity project management, deterministic workflow automations, and live team collaboration.
          </p>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-zinc-800/80 bg-[#121215] hover:border-zinc-700/80 transition-all hover:shadow-lg">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="size-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-primary mb-2">
              <Kanban className="size-4" />
            </div>
            <CardTitle className="text-base font-semibold">Boards & Kanban</CardTitle>
            <CardDescription className="text-xs">
              Manage sprints, tasks, and issues with drag-and-drop velocity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5 border-zinc-800 hover:bg-zinc-800"
            >
              <Link
                href={
                  workspace.projects[0]
                    ? `/${workspaceId}/projects/${workspace.projects[0].id}`
                    : `/${workspaceId}`
                }
              >
                Open Boards <ArrowRight className="size-3.5 ml-auto" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-[#121215] hover:border-zinc-700/80 transition-all hover:shadow-lg">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
              <Zap className="size-4" />
            </div>
            <CardTitle className="text-base font-semibold">Automation Engine</CardTitle>
            <CardDescription className="text-xs">
              Configure deterministic Trigger → Condition → Action workflows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5 border-zinc-800 hover:bg-zinc-800"
            >
              <Link href={`/${workspaceId}/automation`}>
                Configure Rules <ArrowRight className="size-3.5 ml-auto" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-[#121215] hover:border-zinc-700/80 transition-all hover:shadow-lg">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="size-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-2">
              <Users className="size-4" />
            </div>
            <CardTitle className="text-base font-semibold">Team & Access</CardTitle>
            <CardDescription className="text-xs">
              {workspace.members.length} team member(s) actively collaborating.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5 border-zinc-800 hover:bg-zinc-800"
            >
              <Link href={`/${workspaceId}/settings/members`}>
                Manage Team <ArrowRight className="size-3.5 ml-auto" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
