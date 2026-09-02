import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/rbac";
import { BoardHeader } from "@/components/boards/board-header";
import { BoardColumnHeader } from "@/components/boards/board-column-header";
import { AddColumnButton } from "@/components/boards/add-column-button";
import { Plus, ListTodo, CalendarDays, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const project = await prisma.project.findUnique({
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
              _count: {
                select: {
                  tasks: true,
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
  });

  if (!project) {
    notFound();
  }

  const board = project.boards[0] ?? null;
  const columns = board?.columns ?? [];
  const canManage = accessContext.role !== "VIEWER";

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
        {view === "kanban" && (
          <div className="h-full flex items-start gap-4 overflow-x-auto pb-4 pt-1">
            {columns.map((col) => (
              <div
                key={col.id}
                className="w-80 shrink-0 flex flex-col max-h-full rounded-xl border border-zinc-800/80 bg-[#121215]/80 backdrop-blur-sm p-3 shadow-sm transition-all"
                data-testid={`column-${col.id}`}
              >
                {/* Column Header */}
                <BoardColumnHeader
                  columnId={col.id}
                  columnName={col.name}
                  taskCount={col._count.tasks}
                  canManage={canManage}
                />

                {/* Task Cards Container / Placeholder */}
                <div className="flex-1 overflow-y-auto space-y-2 py-2 min-h-[140px]">
                  {col._count.tasks === 0 && (
                    <div className="flex flex-col items-center justify-center h-28 rounded-lg border border-dashed border-zinc-800/60 text-center p-3 text-zinc-500">
                      <Inbox className="size-5 mb-1 text-zinc-600" />
                      <span className="text-[11px] font-medium">No tasks in {col.name}</span>
                    </div>
                  )}
                </div>

                {/* Quick Add Task Button */}
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800/80 rounded-lg h-8"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Task</span>
                  </Button>
                )}
              </div>
            ))}

            {/* Inline Add Column Button */}
            {board && (
              <AddColumnButton
                boardId={board.id}
                canManage={canManage}
              />
            )}
          </div>
        )}

        {view === "list" && (
          <div className="rounded-xl border border-zinc-800 bg-[#121215] p-6 text-center shadow-sm">
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="size-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-primary">
                <ListTodo className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">List View</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Dense structured tabular view of all tasks in <strong>{project.name}</strong> grouped by column status.
              </p>
            </div>
          </div>
        )}

        {view === "calendar" && (
          <div className="rounded-xl border border-zinc-800 bg-[#121215] p-6 text-center shadow-sm">
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="size-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-primary">
                <CalendarDays className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Calendar View</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Timeline and milestone schedule based on task due dates for <strong>{project.name}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
