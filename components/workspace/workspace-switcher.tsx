"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getUserWorkspacesAction } from "@/server/actions/workspaces";
import type { UserRole } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

interface WorkspaceSwitcherProps {
  currentWorkspaceId: string;
  currentWorkspaceName?: string;
  currentWorkspaceRole?: UserRole;
}

export function WorkspaceSwitcher({
  currentWorkspaceId,
  currentWorkspaceName = "Select Workspace",
  currentWorkspaceRole = "MEMBER",
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = React.useState<
    Array<{ id: string; name: string; slug: string; role: UserRole }>
  >([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchWorkspaces() {
      try {
        const res = await getUserWorkspacesAction();
        if (res.success) {
          setWorkspaces(res.data);
        }
      } catch (err) {
        console.error("Failed to load workspaces:", err);
      }
    }
    if (isOpen) {
      fetchWorkspaces();
    }
  }, [isOpen]);

  const activeWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) ?? {
    id: currentWorkspaceId,
    name: currentWorkspaceName,
    role: currentWorkspaceRole,
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2 text-left text-sm hover:bg-zinc-800/80 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-7 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
            {activeWorkspace.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-xs font-semibold text-foreground leading-tight">
              {activeWorkspace.name}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono leading-tight">
              {activeWorkspace.role}
            </span>
          </div>
        </div>
        <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-56 rounded-xl border border-zinc-800 bg-[#18181b] p-1.5 shadow-2xl text-foreground"
      >
        <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
          Workspaces
        </DropdownMenuLabel>

        <DropdownMenuGroup className="space-y-0.5">
          {workspaces.map((ws) => {
            const isSelected = ws.id === currentWorkspaceId;
            return (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => {
                  router.push(`/${ws.id}`);
                }}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-6 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                    {ws.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate text-foreground">{ws.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                    {ws.role}
                  </Badge>
                  {isSelected && <Check className="size-3.5 text-primary" />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 bg-zinc-800" />

        <DropdownMenuItem
          onClick={() => router.push("/onboarding")}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-primary font-medium cursor-pointer hover:bg-primary/10 transition-colors"
        >
          <Plus className="size-3.5" />
          <span>Create Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
