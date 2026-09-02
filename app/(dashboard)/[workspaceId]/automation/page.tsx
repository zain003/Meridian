import { getWorkspaceRulesAction } from "@/server/actions/automation";
import { RuleList } from "@/components/automation/rule-list";
import { RuleBuilderDialog } from "@/components/automation/rule-builder-dialog";
import { Zap } from "lucide-react";

export const dynamic = "force-dynamic";

interface AutomationPageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function AutomationPage({ params }: AutomationPageProps) {
  const { workspaceId } = await params;
  const res = await getWorkspaceRulesAction(workspaceId);
  const rules = res.success && res.data ? res.data : [];

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Workflow Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-heading">
            Automation Rules
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure automated triggers, condition filters, and action dispatchers for this workspace.
          </p>
        </div>

        <div className="shrink-0">
          <RuleBuilderDialog workspaceId={workspaceId} />
        </div>
      </div>

      {/* Rules List Table & Manager */}
      <RuleList workspaceId={workspaceId} initialRules={rules} />
    </div>
  );
}
