"use client";

import * as React from "react";
import { CheckCircle2, Clock, History, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { AutomationRule, ExecutionLog } from "@prisma/client";

interface ExecutionLogDrawerProps {
  rule: (AutomationRule & { logs: ExecutionLog[] }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExecutionLogDrawer({
  rule,
  open,
  onOpenChange,
}: ExecutionLogDrawerProps) {
  if (!rule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 sm:p-7 border-zinc-200/80 dark:border-zinc-800 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <History className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Execution Audit Trail
            </span>
          </div>
          <DialogTitle className="text-xl font-semibold">
            {rule.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Review the 10 most recent automated execution runs and their payload outcomes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-3">
          {rule.logs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-2">
              <Clock className="size-8 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm font-medium">No execution history yet</p>
              <p className="text-xs text-muted-foreground">
                This rule has not been triggered by any task mutations since creation.
              </p>
            </div>
          ) : (
            rule.logs.map((log) => {
              const firedDate = new Date(log.firedAt);
              const formattedDate = firedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = firedDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <div
                  key={log.id}
                  className="rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 space-y-2.5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.status === "SUCCESS" && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] gap-1 py-0.5"
                        >
                          <CheckCircle2 className="size-3" />
                          SUCCESS
                        </Badge>
                      )}
                      {log.status === "FAILED" && (
                        <Badge
                          variant="outline"
                          className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[11px] gap-1 py-0.5"
                        >
                          <XCircle className="size-3" />
                          FAILED
                        </Badge>
                      )}
                      {log.status === "SKIPPED" && (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] gap-1 py-0.5"
                        >
                          <Clock className="size-3" />
                          SKIPPED
                        </Badge>
                      )}

                      <span className="text-xs text-muted-foreground font-mono">
                        {formattedDate} at {formattedTime}
                      </span>
                    </div>

                    <span className="text-[11px] text-zinc-400 font-mono">
                      ID: {log.id.slice(0, 8)}
                    </span>
                  </div>

                  {log.error && (
                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-600 dark:text-rose-400 font-mono">
                      Error: {log.error}
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Event Payload & Result
                    </span>
                    <pre className="rounded-lg bg-zinc-950 text-zinc-300 p-3 text-[11px] font-mono overflow-x-auto max-h-40 border border-zinc-800">
                      {JSON.stringify(
                        {
                          eventData: log.eventData,
                          result: log.result,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
