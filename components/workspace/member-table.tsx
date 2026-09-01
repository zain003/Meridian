"use client";

import * as React from "react";
import { updateMemberRoleAction } from "@/server/actions/members";
import type { UserRole } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, ShieldAlert, UserCheck, Eye, Loader2 } from "lucide-react";

export interface WorkspaceMemberRow {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: UserRole;
  image?: string | null;
}

interface MemberTableProps {
  workspaceId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  initialMembers: WorkspaceMemberRow[];
}

export function MemberTable({
  workspaceId,
  currentUserId,
  currentUserRole,
  initialMembers,
}: MemberTableProps) {
  const [members, setMembers] = React.useState<WorkspaceMemberRow[]>(initialMembers);
  const [loadingUserId, setLoadingUserId] = React.useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const canManageRoles = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    setFeedbackMessage(null);
    setLoadingUserId(targetUserId);

    // Optimistic update
    const prevMembers = [...members];
    setMembers((prev) =>
      prev.map((m) => (m.userId === targetUserId ? { ...m, role: newRole } : m))
    );

    try {
      const res = await updateMemberRoleAction(workspaceId, targetUserId, newRole);

      if (!res.success) {
        // Rollback on error
        setMembers(prevMembers);
        setFeedbackMessage({
          type: "error",
          text: res.error || "Failed to update role",
        });
        return;
      }

      setFeedbackMessage({
        type: "success",
        text: "Role updated successfully",
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMembers(prevMembers);
      setFeedbackMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setLoadingUserId(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "OWNER":
        return <ShieldAlert className="size-3.5 text-amber-400" />;
      case "ADMIN":
        return <Shield className="size-3.5 text-indigo-400" />;
      case "MEMBER":
        return <UserCheck className="size-3.5 text-emerald-400" />;
      case "VIEWER":
        return <Eye className="size-3.5 text-zinc-400" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "OWNER":
        return "warning";
      case "ADMIN":
        return "default";
      case "MEMBER":
        return "success";
      case "VIEWER":
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      {feedbackMessage && (
        <div
          className={`rounded-lg border p-3 text-xs font-medium animate-in fade-in duration-150 ${
            feedbackMessage.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/20 bg-rose-500/10 text-rose-400"
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      <div className="rounded-xl border border-zinc-800/80 bg-[#121215] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/40 text-muted-foreground uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {members.map((member) => {
                const isSelf = member.userId === currentUserId;
                const isTargetOwner = member.role === "OWNER";
                const isOwner = currentUserRole === "OWNER";
                // Only Owner can edit other Owners; Admins cannot edit Owners or grant Owner
                const canEditThisMember =
                  canManageRoles &&
                  (!isTargetOwner || isOwner) &&
                  (!isSelf || isOwner);

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-zinc-900/30 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {member.image && <AvatarImage src={member.image} />}
                          <AvatarFallback>
                            {(member.name || member.email)
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                            {member.name || "Anonymous Member"}
                            {isSelf && (
                              <span className="text-[10px] text-zinc-500 font-normal">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-muted-foreground font-mono">
                      {member.email}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={getRoleBadgeVariant(member.role)}
                        className="gap-1 font-mono text-[10px]"
                      >
                        {getRoleIcon(member.role)}
                        {member.role}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {canEditThisMember ? (
                        <div className="flex items-center justify-end gap-2">
                          {loadingUserId === member.userId && (
                            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                          )}
                          <Select
                            disabled={loadingUserId === member.userId}
                            value={member.role}
                            onValueChange={(val) =>
                              handleRoleChange(member.userId, val as UserRole)
                            }
                          >
                            <SelectTrigger className="h-8 w-28 text-xs bg-zinc-900/60 border-zinc-800">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                              {isOwner && <SelectItem value="OWNER">Owner</SelectItem>}
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
