"use client";

import * as React from "react";
import { Filter, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  RuleCondition,
  RuleConditionOperator,
} from "@/lib/validations/automation";

interface ConditionNodeProps {
  conditions: RuleCondition[];
  onChange: (conditions: RuleCondition[]) => void;
}

const FIELD_OPTIONS = [
  { value: "priority", label: "Priority (LOW, MEDIUM, HIGH, URGENT)" },
  { value: "status", label: "Status / Column" },
  { value: "title", label: "Task Title" },
  { value: "assigneeId", label: "Assignee" },
  { value: "dueDate", label: "Due Date" },
];

const OPERATOR_OPTIONS: Array<{
  value: RuleConditionOperator;
  label: string;
}> = [
  { value: "EQUALS", label: "Equals (==)" },
  { value: "NOT_EQUALS", label: "Does not equal (!=)" },
  { value: "CONTAINS", label: "Contains text" },
  { value: "GREATER_THAN", label: "Greater than (>)" },
  { value: "LESS_THAN", label: "Less than (<)" },
  { value: "IS_EMPTY", label: "Is empty / Unassigned" },
  { value: "IS_NOT_EMPTY", label: "Is not empty / Assigned" },
];

export function ConditionNode({ conditions, onChange }: ConditionNodeProps) {
  const handleAddCondition = () => {
    onChange([
      ...conditions,
      { field: "priority", operator: "EQUALS", value: "HIGH" },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (
    index: number,
    updates: Partial<RuleCondition>
  ) => {
    const updated = conditions.map((cond, i) =>
      i === index ? { ...cond, ...updates } : cond
    );
    onChange(updated);
  };

  return (
    <div className="relative rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-4 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
            <Filter className="size-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Step 2: Conditions (Optional)
            </span>
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Only if all these criteria match (AND)...
            </h4>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddCondition}
          className="h-8 gap-1.5 text-xs rounded-lg"
        >
          <Plus className="size-3.5" />
          Add Filter
        </Button>
      </div>

      {conditions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-3.5 text-center">
          <p className="text-xs text-muted-foreground">
            No condition filters. This rule will execute for <strong>all</strong> triggered tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {conditions.map((condition, index) => {
            const isNullOperator =
              condition.operator === "IS_EMPTY" ||
              condition.operator === "IS_NOT_EMPTY";

            return (
              <div
                key={index}
                className="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 p-2.5"
              >
                {/* Field Selector */}
                <div className="w-[140px]">
                  <Select
                    value={condition.field}
                    onValueChange={(field) =>
                      handleUpdateCondition(index, { field })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          <span className="text-xs">{field.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Operator Selector */}
                <div className="w-[150px]">
                  <Select
                    value={condition.operator}
                    onValueChange={(operator) =>
                      handleUpdateCondition(index, {
                        operator: operator as RuleConditionOperator,
                        value:
                          operator === "IS_EMPTY" || operator === "IS_NOT_EMPTY"
                            ? null
                            : condition.value || "",
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATOR_OPTIONS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          <span className="text-xs">{op.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Value Input (if not null operator) */}
                {!isNullOperator && (
                  <div className="flex-1 min-w-[120px]">
                    <Input
                      value={String(condition.value ?? "")}
                      onChange={(e) =>
                        handleUpdateCondition(index, { value: e.target.value })
                      }
                      placeholder="Target value (e.g. HIGH, Bug)"
                      className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                )}

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCondition(index)}
                  className="size-8 text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
