import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/rbac";
import { BoardHeader } from "@/components/boards/board-header";
import { ProjectBoardViews } from "@/components/boards/project-board-views";

interface ProjectBoardPageProps {
  params: Promise<{
    workspaceId: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    view?: string;
  }>;
}

export default async function ProjectBoardPage({
  params,
  searchParams,
}: ProjectBoardPageProps) {
  const { workspaceId, projectId } = await params;
  const { view = "kanban" } = await searchParams;

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

  const [project, workspaceMembers] = await Promise.all([
    prisma.project.findUnique({
      where: {
        id: projectId,
        workspaceId,
      },
      include: {
        boards: {
          include: {
            columns: {
              orderBy: {
                order: "asc",
              },
              include: {
                tasks: {
                  orderBy: {
                    order: "asc",
                  },
                  include: {
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
                },
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
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

  if (!project) {
    notFound();
  }

  const board = project.boards[0] ?? null;
  const columns = board?.columns ?? [];
  const canManage = accessContext.role !== "VIEWER";
  const members = workspaceMembers.map((m) => m.user);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
      {/* Board Header & Viewport Controls */}
      <BoardHeader
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        projectDescription={project.description}
        workspaceId={workspaceId}
        currentView={view}
        canManage={canManage}
      />

      {/* Main View Area */}
      <div className="flex-1 min-h-0">
        <ProjectBoardViews
          workspaceId={workspaceId}
          projectId={project.id}
          boardId={board?.id}
          currentView={view}
          initialColumns={columns}
          members={members}
          currentUserId={session.user.id}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
