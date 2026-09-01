---
name: automation-engine
description: >-
  Provides guidelines and implementation patterns for Meridian's deterministic custom workflow automation engine,
  condition evaluators, action dispatchers, execution loop guards, and Upstash Redis queue workers.
  Use when developing or debugging the Trigger-Condition-Action automation engine, queue worker, or execution logs.
---

# Automation Engine & Redis Queue Skill

## Overview

Meridian's automation engine is a 100% deterministic, custom TypeScript system. It processes events via a **Trigger ➔ Condition ➔ Action** pipeline with asynchronous execution backed by **Upstash Redis** and PostgreSQL.

## Architecture

- **Event Emitter**: `lib/automation/emitter.ts` emits lifecycle events (e.g. `TASK_STATUS_CHANGED`, `TASK_CREATED`).
- **Rule Evaluator**: `lib/automation/evaluator.ts` loads active rules for the workspace, checks trigger matching, and executes condition matching logic.
- **Action Dispatcher**: `lib/automation/dispatcher.ts` executes actions (e.g., auto-assign, move column, set priority, create notification).
- **Queue Producer/Consumer**: `lib/automation/queue.ts` pushes matched jobs to Upstash Redis and processes them asynchronously.
- **Audit Logger**: Writes an `ExecutionLog` record for every rule run (`SUCCESS`, `FAILED`, `SKIPPED`).

## Evaluation Logic Pattern

```typescript
import type { RuleCondition } from "@/types";

export function evaluateCondition(fieldValue: unknown, operator: RuleCondition["operator"], targetValue: unknown): boolean {
  switch (operator) {
    case "EQUALS":
      return String(fieldValue) === String(targetValue);
    case "NOT_EQUALS":
      return String(fieldValue) !== String(targetValue);
    case "CONTAINS":
      return String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());
    case "GREATER_THAN":
      return Number(fieldValue) > Number(targetValue);
    case "LESS_THAN":
      return Number(fieldValue) < Number(targetValue);
    case "IS_EMPTY":
      return fieldValue === null || fieldValue === undefined || fieldValue === "";
    case "IS_NOT_EMPTY":
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
    default:
      return false;
  }
}
```

## Loop Protection Guard

To prevent recursive loops (e.g. Rule A modifies Task ➔ triggers Rule B ➔ modifies Task ➔ triggers Rule A), the queue message payload carries a `depth` counter:
- If `depth > 3`, abort execution, log a `SKIPPED` status with message `"Execution depth limit exceeded (loop guard)"`.
