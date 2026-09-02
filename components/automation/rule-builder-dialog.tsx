"use client";

import * as React from "react";
import { ArrowDown, Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TriggerNode } from "@/components/automation/trigger-node";
import { ConditionNode } from "@/components/automation/condition-node";
import { ActionNode } from "@/components/automation/action-node";
import { createRuleAction } from "@/server/actions/automation";
import type {
  RuleTriggerType,
  RuleCondition,
  RuleAction,
} from "@/lib/validations/automation";

interface RuleBuilderDialogProps {
  workspaceId: string;
  onRuleCreated?: () => void;
  trigger?: React.ReactNode;
}

export function RuleBuilderDialog({
  workspaceId,
  onRuleCreated,
  trigger,
}: RuleBuilderDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form State
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [triggerType, setTriggerType] = React.useState<RuleTriggerType>("TASK_STATUS_CHANGED");
  const [conditions, setConditions] = React.useState<RuleCondition[]>([]);
  const [actions, setActions] = React.useState<RuleAction[]>([
    { type: "SET_PRIORITY", payload: { priority: "HIGH" } },
  ]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setTriggerType("TASK_STATUS_CHANGED");
    setConditions([]);
    setActions([{ type: "SET_PRIORITY", payload: { priority: "HIGH" } }]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Rule name is required");
      return;
    }
    if (actions.length === 0) {
      setError("At least one action is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createRuleAction({
        workspaceId,
        name: name.trim(),
        description: description.trim() || undefined,
        triggerType,
        conditions,
        actions,
      });

      if (res.success) {
        setOpen(false);
        resetForm();
        onRuleCreated?.();
      } else {
        setError(res.error || "Failed to create rule");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-1.5 shadow-sm rounded-xl">
            <Plus className="size-4" />
            New Automation Rule
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-7 border-zinc-200/80 dark:border-zinc-800 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Visual Workflow Builder
            </span>
          </div>
          <DialogTitle className="text-xl font-semibold">
            Create Custom Automation Rule
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure a deterministic Trigger ➔ Condition ➔ Action pipeline to automate repetitive tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 my-2">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Rule Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name" className="text-xs font-medium">
                Rule Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Auto-escalate urgent bugs"
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-desc" className="text-xs font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="rule-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly explain what this rule does..."
                className="h-9 min-h-[36px] text-xs resize-none"
              />
            </div>
          </div>

          {/* Connected Visual Pipeline */}
          <div className="space-y-3 pt-2">
            {/* 1. Trigger Block */}
            <TriggerNode value={triggerType} onChange={setTriggerType} />

            {/* Vertical Flow Connector */}
            <div className="flex items-center justify-center -my-1">
              <div className="flex items-center justify-center size-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 shadow-xs">
                <ArrowDown className="size-3.5" />
              </div>
            </div>

            {/* 2. Condition Block */}
            <ConditionNode conditions={conditions} onChange={setConditions} />

            {/* Vertical Flow Connector */}
            <div className="flex items-center justify-center -my-1">
              <div className="flex items-center justify-center size-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 shadow-xs">
                <ArrowDown className="size-3.5" />
              </div>
            </div>

            {/* 3. Action Block */}
            <ActionNode actions={actions} onChange={setActions} />
          </div>

          <DialogFooter className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs rounded-xl gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving Rule...
                </>
              ) : (
                "Save Automation Rule"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
