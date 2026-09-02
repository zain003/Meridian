import type { RuleCondition } from "@/lib/validations/automation";

/**
 * Evaluates a single rule condition against task data deterministically.
 */
export function evaluateCondition(
  condition: RuleCondition,
  taskData: Record<string, unknown>
): boolean {
  const fieldValue = taskData[condition.field];
  const targetValue = condition.value;

  switch (condition.operator) {
    case "EQUALS": {
      if (targetValue === null) {
        return fieldValue === null || fieldValue === undefined;
      }
      if (typeof fieldValue === "boolean" || typeof targetValue === "boolean") {
        return Boolean(fieldValue) === Boolean(targetValue);
      }
      if (typeof fieldValue === "number" || typeof targetValue === "number") {
        return Number(fieldValue) === Number(targetValue);
      }
      return (
        String(fieldValue ?? "")
          .trim()
          .toLowerCase() ===
        String(targetValue ?? "")
          .trim()
          .toLowerCase()
      );
    }

    case "NOT_EQUALS": {
      if (targetValue === null) {
        return fieldValue !== null && fieldValue !== undefined;
      }
      if (typeof fieldValue === "boolean" || typeof targetValue === "boolean") {
        return Boolean(fieldValue) !== Boolean(targetValue);
      }
      if (typeof fieldValue === "number" || typeof targetValue === "number") {
        return Number(fieldValue) !== Number(targetValue);
      }
      return (
        String(fieldValue ?? "")
          .trim()
          .toLowerCase() !==
        String(targetValue ?? "")
          .trim()
          .toLowerCase()
      );
    }

    case "CONTAINS": {
      const sourceStr = String(fieldValue ?? "").toLowerCase();
      const searchStr = String(targetValue ?? "").toLowerCase();
      return sourceStr.includes(searchStr);
    }

    case "GREATER_THAN": {
      if (
        fieldValue instanceof Date ||
        (typeof fieldValue === "string" && !isNaN(Date.parse(fieldValue)))
      ) {
        const fieldTime = new Date(fieldValue as string | Date).getTime();
        const targetTime = new Date(targetValue as string | Date).getTime();
        return fieldTime > targetTime;
      }
      return Number(fieldValue) > Number(targetValue);
    }

    case "LESS_THAN": {
      if (
        fieldValue instanceof Date ||
        (typeof fieldValue === "string" && !isNaN(Date.parse(fieldValue)))
      ) {
        const fieldTime = new Date(fieldValue as string | Date).getTime();
        const targetTime = new Date(targetValue as string | Date).getTime();
        return fieldTime < targetTime;
      }
      return Number(fieldValue) < Number(targetValue);
    }

    case "IS_EMPTY": {
      return (
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );
    }

    case "IS_NOT_EMPTY": {
      return (
        fieldValue !== null &&
        fieldValue !== undefined &&
        fieldValue !== "" &&
        (!Array.isArray(fieldValue) || fieldValue.length > 0)
      );
    }

    default:
      return false;
  }
}

/**
 * Evaluates an array of rule conditions using strict logical AND.
 * Returns true if all conditions evaluate to true (or if conditions array is empty).
 */
export function evaluateRuleConditions(
  conditions: RuleCondition[],
  taskData: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) =>
    evaluateCondition(condition, taskData)
  );
}
