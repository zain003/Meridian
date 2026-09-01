import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import { getUserWorkspacesAction } from "@/server/actions/workspaces";
import { Button } from "@/components/ui/button";
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Kanban,
  Users,
} from "lucide-react";

export default async function Home() {
  const session = await getAuthSession();
  let firstWorkspaceId: string | null = null;

  if (session?.user) {
    const workspaces = await getUserWorkspacesAction();
    if (workspaces.success && workspaces.data.length > 0) {
      firstWorkspaceId = workspaces.data[0].id;
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-foreground px-6 py-20 selection:bg-primary/20 selection:text-primary overflow-hidden">
      {/* Dynamic ambient lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto text-center space-y-6">
        {/* Brand badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium backdrop-blur-md shadow-sm">
          <span className="size-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>Meridian — High Velocity Project Management</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
          The fixed point your team&apos;s work revolves around.
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          Engineered for fast-moving engineering teams. Multi-tenant workspaces, interactive Kanban boards, deterministic workflow automation, and real-time collaboration.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 w-full sm:w-auto">
          {session?.user ? (
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-11 px-7 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/25"
            >
              <Link href={firstWorkspaceId ? `/${firstWorkspaceId}` : "/onboarding"}>
                Go to Workspace <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-11 px-7 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/25"
              >
                <Link href="/register">
                  Get Started Free <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-11 px-7 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-200"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left w-full">
          <div className="rounded-xl border border-zinc-800/80 bg-[#121215]/80 p-4 backdrop-blur-sm">
            <Kanban className="size-5 text-indigo-400 mb-2" />
            <div className="text-sm font-semibold text-foreground">Interactive Kanban</div>
            <div className="text-xs text-muted-foreground mt-1">
              Ultra-responsive drag-and-drop boards with subtasks, labels, and optimistic updates.
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-[#121215]/80 p-4 backdrop-blur-sm">
            <Zap className="size-5 text-emerald-400 mb-2" />
            <div className="text-sm font-semibold text-foreground">Deterministic Automations</div>
            <div className="text-xs text-muted-foreground mt-1">
              Custom Trigger → Condition → Action workflow builder with complete execution audits.
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-[#121215]/80 p-4 backdrop-blur-sm">
            <ShieldCheck className="size-5 text-sky-400 mb-2" />
            <div className="text-sm font-semibold text-foreground">Isolated Multi-Tenancy</div>
            <div className="text-xs text-muted-foreground mt-1">
              Strict RBAC access controls, team invites, and enterprise-grade data scoping.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
