import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/rbac";
import { WorkspaceCalendarView, type CalendarTaskItem } from "@/components/calendar/workspace-calendar-view";

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function WorkspaceCalendarPage({ params }: CalendarPageProps) {
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

  const [workspace, rawTasks, workspaceMembers] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        projects: {
          select: { id: true, name: true, key: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.task.findMany({
      where: {
        column: {
          board: {
            project: {
              workspaceId,
            },
          },
        },
      },
      include: {
        column: {
          select: {
            id: true,
            name: true,
            board: {
              select: {
                project: {
                  select: {
                    id: true,
                    name: true,
                    key: true,
                  },
                },
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            isDone: true,
            order: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        labels: {
          include: {
            label: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
  ]);

  if (!workspace) {
    notFound();
  }

  const tasks: CalendarTaskItem[] = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    order: t.order,
    dueDate: t.dueDate,
    columnId: t.columnId,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    projectId: t.column.board.project.id,
    projectName: t.column.board.project.name,
    projectKey: t.column.board.project.key,
    columnName: t.column.name,
    assignee: t.assignee,
    subtasks: t.subtasks,
    comments: t.comments,
    labels: t.labels,
  }));

  const members = workspaceMembers.map((m) => m.user);
  const canManage = accessContext.role !== "VIEWER";

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
      <WorkspaceCalendarView
        workspaceId={workspaceId}
        tasks={tasks}
        projects={workspace.projects}
        members={members}
        currentUserId={session.user.id}
        canManage={canManage}
      />
    </div>
  );
}
