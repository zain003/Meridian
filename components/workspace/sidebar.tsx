"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Zap,
  BarChart3,
  Users,
  FolderKanban,
  Plus,
  LogOut,
  CreditCard,
} from "lucide-react";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface ProjectItem {
  id: string;
  name: string;
  key: string;
  description: string | null;
}

interface SidebarProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    inviteCode: string;
  };
  role: UserRole;
  projects: ProjectItem[];
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  signOutAction: () => Promise<void>;
}

export function Sidebar({
  workspace,
  role,
  projects,
  user,
  signOutAction,
}: SidebarProps) {
  const pathname = usePathname();
  const canManageProjects = role !== "VIEWER";

  const navItems = [
    {
      label: "Overview",
      href: `/${workspace.id}`,
      icon: LayoutDashboard,
      active: pathname === `/${workspace.id}`,
    },
    {
      label: "Calendar",
      href: `/${workspace.id}/calendar`,
      icon: Calendar,
      active: pathname.startsWith(`/${workspace.id}/calendar`),
    },
    {
      label: "Automations",
      href: `/${workspace.id}/automations`,
      icon: Zap,
      active: pathname.startsWith(`/${workspace.id}/automations`),
    },
    {
      label: "Analytics",
      href: `/${workspace.id}/analytics`,
      icon: BarChart3,
      active: pathname.startsWith(`/${workspace.id}/analytics`),
    },
    {
      label: "Members & Team",
      href: `/${workspace.id}/settings/members`,
      icon: Users,
      active: pathname.startsWith(`/${workspace.id}/settings/members`),
    },
    {
      label: "Billing & Plans",
      href: `/${workspace.id}/settings/billing`,
      icon: CreditCard,
      active: pathname.startsWith(`/${workspace.id}/settings/billing`),
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-zinc-800/80 bg-[#121215]">
      {/* Workspace Switcher Header */}
      <div className="p-3 border-b border-zinc-800/60">
        <WorkspaceSwitcher
          currentWorkspaceId={workspace.id}
          currentWorkspaceName={workspace.name}
          currentWorkspaceRole={role}
        />
      </div>

      {/* Navigation & Projects Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Workspace Primary Navigation */}
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
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all group",
                  item.active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-zinc-800/80 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 transition-colors",
                    item.active
                      ? "text-primary"
                      : "text-zinc-400 group-hover:text-primary"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Projects Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2 pb-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Projects</span>
              <Badge
                variant="outline"
                className="px-1.5 py-0 text-[10px] border-zinc-800 bg-zinc-900/50 text-zinc-400"
              >
                {projects.length}
              </Badge>
            </div>

            {canManageProjects && (
              <CreateProjectDialog
                workspaceId={workspace.id}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 rounded text-zinc-400 hover:text-foreground hover:bg-zinc-800"
                    title="Create Project"
                  >
                    <Plus className="size-3.5" />
                    <span className="sr-only">Create Project</span>
                  </Button>
                }
              />
            )}
          </div>

          {projects.length === 0 ? (
            <div className="px-2 py-3 text-center rounded-lg border border-dashed border-zinc-800/80 bg-zinc-900/30">
              <p className="text-[11px] text-zinc-500 mb-2">No projects yet</p>
              {canManageProjects && (
                <CreateProjectDialog
                  workspaceId={workspace.id}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] w-full gap-1 border-zinc-800 hover:border-primary/50 text-zinc-300"
                    >
                      <Plus className="size-3" />
                      <span>Create first project</span>
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <div className="space-y-0.5" data-testid="sidebar-projects-list">
              {projects.map((project) => {
                const projectHref = `/${workspace.id}/projects/${project.id}`;
                const isActive = pathname.startsWith(projectHref);

                return (
                  <Link
                    key={project.id}
                    href={projectHref}
                    title={project.name}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all group",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                        : "text-muted-foreground hover:bg-zinc-800/80 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderKanban
                        className={cn(
                          "size-3.5 shrink-0 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-zinc-500 group-hover:text-primary"
                        )}
                      />
                      <span className="truncate">{project.name}</span>
                    </div>

                    <span
                      className={cn(
                        "shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded border uppercase",
                        isActive
                          ? "bg-primary/20 border-primary/30 text-primary font-semibold"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:text-zinc-300"
                      )}
                    >
                      {project.key}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Account Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#101013] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="size-7">
            {user.image && <AvatarImage src={user.image} />}
            <AvatarFallback className="text-[10px]">
              {(user.name || user.email).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-xs font-medium text-foreground">
              {user.name || "User"}
            </span>
            <span className="truncate text-[10px] text-muted-foreground font-mono">
              {user.email}
            </span>
          </div>
        </div>

        <form action={signOutAction}>
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
  );
}
