"use server";

import { requireWorkspaceAccess } from "@/lib/rbac";
import { getWorkspaceAnalytics } from "@/lib/analytics/metrics";
import {
  analyticsFilterSchema,
  type AnalyticsFilterInput,
  type AnalyticsSummary,
} from "@/lib/validations/analytics";
import type { ActionResponse } from "@/types";

export type { AnalyticsFilterInput, AnalyticsSummary };

/**
 * Retrieves team analytics, velocity, cycle time, and workload distribution metrics for a workspace.
 * Requires VIEWER or higher workspace membership role.
 */
export async function getWorkspaceAnalyticsAction(
  input: AnalyticsFilterInput
): Promise<ActionResponse<AnalyticsSummary>> {
  const parsed = analyticsFilterSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: "Invalid analytics filter parameters",
      fieldErrors,
    };
  }

  const { workspaceId } = parsed.data;

  try {
    await requireWorkspaceAccess(workspaceId, "VIEWER");

    const summary = await getWorkspaceAnalytics(parsed.data);

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to retrieve workspace analytics:", error);
    return {
      success: false,
      error: "Failed to retrieve analytics metrics. Please try again.",
    };
  }
}
