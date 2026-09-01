"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { joinWorkspaceByInviteCodeAction } from "@/server/actions/workspaces";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Compass, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

function JoinWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [status, setStatus] = React.useState<"idle" | "joining" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleJoin = async () => {
    if (!code) {
      setStatus("error");
      setErrorMessage("No invite code provided");
      return;
    }

    setStatus("joining");
    setErrorMessage(null);

    try {
      const res = await joinWorkspaceByInviteCodeAction(code);

      if (!res.success) {
        setStatus("error");
        setErrorMessage(res.error || "Failed to join workspace");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        router.push(`/${res.data.workspaceId}`);
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage("An unexpected error occurred");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-foreground px-4 py-12">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mb-8 flex flex-col items-center gap-2">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
          <Compass className="size-6 text-white stroke-[2]" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white mt-1">
          Workspace Invitation
        </h1>
      </div>

      <Card className="relative z-10 w-full max-w-md border-zinc-800/80 bg-[#121215]/90 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg font-semibold">
            You&apos;ve Been Invited!
          </CardTitle>
          <CardDescription className="text-xs">
            Join your team on Meridian to collaborate on projects and automated workflows.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {status === "success" && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Successfully joined! Redirecting to workspace...</span>
            </div>
          )}

          {!code ? (
            <div className="text-center text-xs text-muted-foreground py-2">
              Invalid or missing invite link. Please request a new invite link from your workspace admin.
            </div>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={status === "joining" || status === "success"}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/20"
            >
              {status === "joining" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining Workspace...
                </>
              ) : (
                <>
                  Accept Invite & Join
                  <ArrowRight className="ml-1.5 size-4" />
                </>
              )}
            </Button>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t border-zinc-800/60 pt-4">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Signed in with the wrong account? Switch account
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function JoinWorkspacePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      }
    >
      <JoinWorkspaceContent />
    </React.Suspense>
  );
}
