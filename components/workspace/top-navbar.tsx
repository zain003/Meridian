"use client";

import * as React from "react";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { NotificationBell } from "@/components/workspace/notification-bell";

export interface TopNavbarProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    inviteCode: string;
  };
}

export function TopNavbar({ workspace }: TopNavbarProps) {
  return (
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

        <NotificationBell workspaceId={workspace.id} />
      </div>
    </header>
  );
}
