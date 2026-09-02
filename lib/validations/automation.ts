import { z } from "zod";

export const RULE_TRIGGER_TYPES = [
  "TASK_CREATED",
  "TASK_STATUS_CHANGED",
  "TASK_ASSIGNEE_CHANGED",
  "TASK_PRIORITY_CHANGED",
  "TASK_DUE_DATE_PASSED",
] as const;

export type RuleTriggerType = (typeof RULE_TRIGGER_TYPES)[number];

export const RULE_CONDITION_OPERATORS = [
  "EQUALS",
  "NOT_EQUALS",
  "CONTAINS",
  "GREATER_THAN",
  "LESS_THAN",
  "IS_EMPTY",
  "IS_NOT_EMPTY",
] as const;

export type RuleConditionOperator = (typeof RULE_CONDITION_OPERATORS)[number];

export const RULE_ACTION_TYPES = [
  "ASSIGN_USER",
  "MOVE_COLUMN",
  "SET_PRIORITY",
  "ADD_LABEL",
  "SEND_NOTIFICATION",
  "SEND_EMAIL",
] as const;

export type RuleActionType = (typeof RULE_ACTION_TYPES)[number];

export const ruleConditionSchema = z.object({
  field: z.string().min(1, "Field name is required"),
  operator: z.enum(RULE_CONDITION_OPERATORS),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});

export type RuleCondition = z.infer<typeof ruleConditionSchema>;

export const ruleActionSchema = z.object({
  type: z.enum(RULE_ACTION_TYPES),
  payload: z.record(z.string(), z.unknown()),
});

export type RuleAction = z.infer<typeof ruleActionSchema>;

export const createRuleSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  name: z.string().min(1, "Rule name is required").max(100, "Rule name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  triggerType: z.enum(RULE_TRIGGER_TYPES),
  triggerData: z.record(z.string(), z.unknown()).optional(),
  conditions: z.array(ruleConditionSchema).optional().default([]),
  actions: z.array(ruleActionSchema).min(1, "At least one action is required"),
});

export type CreateRuleInput = z.input<typeof createRuleSchema>;

export const updateRuleSchema = z.object({
  ruleId: z.string().min(1, "Rule ID is required"),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  triggerType: z.enum(RULE_TRIGGER_TYPES).optional(),
  triggerData: z.record(z.string(), z.unknown()).optional(),
  conditions: z.array(ruleConditionSchema).optional(),
  actions: z.array(ruleActionSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateRuleInput = z.input<typeof updateRuleSchema>;

export const toggleRuleSchema = z.object({
  ruleId: z.string().min(1, "Rule ID is required"),
  isActive: z.boolean(),
});

export type ToggleRuleInput = z.infer<typeof toggleRuleSchema>;

export const deleteRuleSchema = z.object({
  ruleId: z.string().min(1, "Rule ID is required"),
});

export type DeleteRuleInput = z.infer<typeof deleteRuleSchema>;
