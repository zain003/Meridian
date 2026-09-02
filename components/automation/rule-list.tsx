"use client";

import * as React from "react";
import {
  History,
  Play,
  Trash2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ExecutionLogDrawer } from "@/components/automation/execution-log-drawer";
import { RuleBuilderDialog } from "@/components/automation/rule-builder-dialog";
import { toggleRuleAction, deleteRuleAction } from "@/server/actions/automation";
import type { AutomationRule, ExecutionLog } from "@prisma/client";

interface RuleListProps {
  workspaceId: string;
  initialRules: Array<AutomationRule & { logs: ExecutionLog[] }>;
}

export function RuleList({ workspaceId, initialRules }: RuleListProps) {
  const [rules, setRules] = React.useState(initialRules);
  const [selectedRuleForLogs, setSelectedRuleForLogs] = React.useState<
    (AutomationRule & { logs: ExecutionLog[] }) | null
  >(null);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = React.useState(false);

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    // Optimistic UI update
    const nextStatus = !currentStatus;
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: nextStatus } : r))
    );

    try {
      const res = await toggleRuleAction(ruleId, nextStatus);
      if (!res.success) {
        // Rollback on failure
        setRules((prev) =>
          prev.map((r) =>
            r.id === ruleId ? { ...r, isActive: currentStatus } : r
          )
        );
      }
    } catch {
      // Rollback
      setRules((prev) =>
        prev.map((r) =>
          r.id === ruleId ? { ...r, isActive: currentStatus } : r
        )
      );
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this automation rule?")) {
      return;
    }

    setRules((prev) => prev.filter((r) => r.id !== ruleId));

    try {
      await deleteRuleAction(ruleId);
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  if (rules.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-12 text-center backdrop-blur-md space-y-4">
        <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
          <Zap className="size-6" />
        </div>
        <div className="space-y-1.5 max-w-sm mx-auto">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No Automations Configured
          </h3>
          <p className="text-xs text-muted-foreground">
            Create automated workflows to assign tasks, adjust priorities, send alerts, and move columns automatically.
          </p>
        </div>

        <RuleBuilderDialog
          workspaceId={workspaceId}
          onRuleCreated={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-sm backdrop-blur-md overflow-hidden">
        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
          {rules.map((rule) => {
            const conditionsCount = Array.isArray(rule.conditions)
              ? rule.conditions.length
              : 0;
            const actionsCount = Array.isArray(rule.actions)
              ? rule.actions.length
              : 0;
            const latestLog = rule.logs[0];

            return (
              <div
                key={rule.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                {/* Left Rule Details */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {rule.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] gap-1 py-0.5"
                    >
                      <Zap className="size-3" />
                      {rule.triggerType.replace(/_/g, " ")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1 py-0.5"
                    >
                      <Play className="size-3" />
                      {actionsCount} {actionsCount === 1 ? "Action" : "Actions"}
                    </Badge>
                  </div>

                  {rule.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {rule.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>
                      {conditionsCount > 0
                        ? `${conditionsCount} filter ${conditionsCount === 1 ? "condition" : "conditions"}`
                        : "No condition filters"}
                    </span>
                    <span>•</span>
                    {latestLog ? (
                      <span className="flex items-center gap-1 font-mono">
                        Last ran:{" "}
                        <span
                          className={
                            latestLog.status === "SUCCESS"
                              ? "text-emerald-500"
                              : latestLog.status === "FAILED"
                              ? "text-rose-500"
                              : "text-amber-500"
                          }
                        >
                          {latestLog.status}
                        </span>
                      </span>
                    ) : (
                      <span>Never fired</span>
                    )}
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="flex items-center gap-2 pr-2 border-r border-zinc-200 dark:border-zinc-800">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => handleToggle(rule.id, rule.isActive)}
                      aria-label={`Toggle ${rule.name}`}
                    />
                    <span className="text-xs font-medium text-muted-foreground w-12">
                      {rule.isActive ? "Active" : "Paused"}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRuleForLogs(rule);
                      setIsLogDrawerOpen(true);
                    }}
                    className="h-8 gap-1.5 text-xs rounded-lg"
                  >
                    <History className="size-3.5" />
                    Audit Logs
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(rule.id)}
                    className="size-8 text-zinc-400 hover:text-red-500 rounded-lg"
                    aria-label={`Delete ${rule.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ExecutionLogDrawer
        rule={selectedRuleForLogs}
        open={isLogDrawerOpen}
        onOpenChange={setIsLogDrawerOpen}
      />
    </>
  );
}
