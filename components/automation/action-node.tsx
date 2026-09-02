"use client";

import * as React from "react";
import { Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RuleAction, RuleActionType } from "@/lib/validations/automation";

interface ActionNodeProps {
  actions: RuleAction[];
  onChange: (actions: RuleAction[]) => void;
}

const ACTION_TYPES: Array<{
  value: RuleActionType;
  label: string;
  description: string;
}> = [
  {
    value: "SET_PRIORITY",
    label: "Set Task Priority",
    description: "Update the priority badge of the task",
  },
  {
    value: "MOVE_COLUMN",
    label: "Move to Column / Status",
    description: "Transfer task to a destination column",
  },
  {
    value: "ASSIGN_USER",
    label: "Assign Team Member",
    description: "Assign the task to a specific workspace user",
  },
  {
    value: "ADD_LABEL",
    label: "Attach Label",
    description: "Attach a project or workspace label",
  },
  {
    value: "SEND_NOTIFICATION",
    label: "Send In-App Notification",
    description: "Send an alert to a team member's notification center",
  },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low Priority" },
  { value: "MEDIUM", label: "Medium Priority" },
  { value: "HIGH", label: "High Priority" },
  { value: "URGENT", label: "Urgent Priority" },
];

export function ActionNode({ actions, onChange }: ActionNodeProps) {
  const handleAddAction = () => {
    onChange([
      ...actions,
      { type: "SET_PRIORITY", payload: { priority: "HIGH" } },
    ]);
  };

  const handleRemoveAction = (index: number) => {
    if (actions.length <= 1) {
      return; // Keep at least one action
    }
    onChange(actions.filter((_, i) => i !== index));
  };

  const handleUpdateAction = (
    index: number,
    updates: Partial<RuleAction>
  ) => {
    const updated = actions.map((act, i) =>
      i === index ? { ...act, ...updates } : act
    );
    onChange(updated);
  };

  const handleUpdatePayload = (
    index: number,
    key: string,
    val: unknown
  ) => {
    const currentAction = actions[index];
    const updatedPayload = { ...currentAction.payload, [key]: val };
    handleUpdateAction(index, { payload: updatedPayload });
  };

  return (
    <div className="relative rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-4 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <Play className="size-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Step 3: Actions (Required)
            </span>
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Automatically perform these actions...
            </h4>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddAction}
          className="h-8 gap-1.5 text-xs rounded-lg"
        >
          <Plus className="size-3.5" />
          Add Action
        </Button>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <div
            key={index}
            className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 p-3 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <Select
                  value={action.type}
                  onValueChange={(type) =>
                    handleUpdateAction(index, {
                      type: type as RuleActionType,
                      payload:
                        type === "SET_PRIORITY"
                          ? { priority: "HIGH" }
                          : type === "MOVE_COLUMN"
                          ? { columnId: "" }
                          : type === "ASSIGN_USER"
                          ? { userId: "" }
                          : type === "ADD_LABEL"
                          ? { labelId: "" }
                          : { userId: "", title: "Automation Notice", message: "Rule triggered" },
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="text-xs font-medium">{type.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {actions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveAction(index)}
                  className="size-8 text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>

            {/* Dynamic Payload Configuration */}
            {action.type === "SET_PRIORITY" && (
              <div>
                <Select
                  value={String(action.payload.priority || "HIGH")}
                  onValueChange={(priority) =>
                    handleUpdatePayload(index, "priority", priority)
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                    <SelectValue placeholder="Select target priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="text-xs">{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {action.type === "MOVE_COLUMN" && (
              <div>
                <Input
                  value={String(action.payload.columnId || "")}
                  onChange={(e) =>
                    handleUpdatePayload(index, "columnId", e.target.value)
                  }
                  placeholder="Destination Column ID or Name (e.g. Done)"
                  className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                />
              </div>
            )}

            {action.type === "ASSIGN_USER" && (
              <div>
                <Input
                  value={String(action.payload.userId || action.payload.assigneeId || "")}
                  onChange={(e) =>
                    handleUpdatePayload(index, "userId", e.target.value)
                  }
                  placeholder="Target User ID to assign"
                  className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                />
              </div>
            )}

            {action.type === "ADD_LABEL" && (
              <div>
                <Input
                  value={String(action.payload.labelId || "")}
                  onChange={(e) =>
                    handleUpdatePayload(index, "labelId", e.target.value)
                  }
                  placeholder="Label ID to attach"
                  className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                />
              </div>
            )}

            {action.type === "SEND_NOTIFICATION" && (
              <div className="space-y-2">
                <Input
                  value={String(action.payload.userId || "")}
                  onChange={(e) =>
                    handleUpdatePayload(index, "userId", e.target.value)
                  }
                  placeholder="Target User ID for alert"
                  className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                />
                <Input
                  value={String(action.payload.title || "")}
                  onChange={(e) =>
                    handleUpdatePayload(index, "title", e.target.value)
                  }
                  placeholder="Notification title"
                  className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                />
                <Input
                  value={String(action.payload.message || "")}
                  onChange={(e) =>
                    handleUpdatePayload(index, "message", e.target.value)
                  }
                  placeholder="Notification message body"
                  className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
