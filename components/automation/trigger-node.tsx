"use client";

import * as React from "react";
import { Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RuleTriggerType } from "@/lib/validations/automation";

interface TriggerNodeProps {
  value: RuleTriggerType;
  onChange: (value: RuleTriggerType) => void;
}

const TRIGGER_OPTIONS: Array<{
  value: RuleTriggerType;
  label: string;
  description: string;
}> = [
  {
    value: "TASK_CREATED",
    label: "When a Task is Created",
    description: "Fires immediately when any new task is created in this workspace",
  },
  {
    value: "TASK_STATUS_CHANGED",
    label: "When Task Status / Column Changes",
    description: "Fires when a task is moved to a different column or status",
  },
  {
    value: "TASK_PRIORITY_CHANGED",
    label: "When Task Priority Changes",
    description: "Fires when a task's priority level is adjusted",
  },
  {
    value: "TASK_ASSIGNEE_CHANGED",
    label: "When Task Assignee Changes",
    description: "Fires when a task is assigned or reassigned to a team member",
  },
  {
    value: "TASK_DUE_DATE_PASSED",
    label: "When Task Due Date Passes",
    description: "Fires when a task's scheduled deadline is reached",
  },
];

export function TriggerNode({ value, onChange }: TriggerNodeProps) {
  const selected = TRIGGER_OPTIONS.find((opt) => opt.value === value) || TRIGGER_OPTIONS[0];

  return (
    <div className="relative rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-4 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
          <Zap className="size-4" />
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Step 1: Trigger
          </span>
          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            When this event occurs...
          </h4>
        </div>
      </div>

      <Select value={value} onValueChange={(val) => onChange(val as RuleTriggerType)}>
        <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700">
          <SelectValue placeholder="Select trigger event" />
        </SelectTrigger>
        <SelectContent>
          {TRIGGER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="py-0.5">
                <p className="font-medium text-xs">{option.label}</p>
                <p className="text-[11px] text-muted-foreground">{option.description}</p>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="mt-2 text-xs text-muted-foreground">
        {selected.description}
      </p>
    </div>
  );
}
