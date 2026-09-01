"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Copy, Link as LinkIcon, UserPlus } from "lucide-react";

interface InviteMemberDialogProps {
  workspaceId: string;
  workspaceName: string;
  inviteCode: string;
  trigger?: React.ReactNode;
}

export function InviteMemberDialog({
  workspaceName,
  inviteCode,
  trigger,
}: InviteMemberDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const [role, setRole] = React.useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");

  const [origin, setOrigin] = React.useState("");
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const inviteLink = `${origin}/join?code=${inviteCode}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for non-secure contexts
        const textarea = document.createElement("textarea");
        textarea.value = inviteLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy invite link:", err);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <UserPlus className="size-3.5" />
            Invite Members
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md border-zinc-800 bg-[#121215] text-foreground">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            Invite to {workspaceName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Share this link with your teammates. Anyone with this link can join this workspace as a member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Default Member Role</Label>
            <Select
              value={role}
              onValueChange={(val) => setRole(val as "ADMIN" | "MEMBER" | "VIEWER")}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member (Can create, edit tasks & boards)</SelectItem>
                <SelectItem value="ADMIN">Admin (Can manage settings, members & rules)</SelectItem>
                <SelectItem value="VIEWER">Viewer (Read-only access)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Invite Link</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  value={inviteLink}
                  className="h-9 pr-8 text-xs font-mono bg-zinc-900/60 border-zinc-800 text-zinc-300 select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <LinkIcon className="absolute right-2.5 top-2.5 size-4 text-zinc-500 pointer-events-none" />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleCopy}
                className={`h-9 px-3 text-xs font-medium transition-all ${
                  copied
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
