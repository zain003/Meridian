import { z } from "zod";

export const analyticsFilterSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  projectId: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>;

export interface VelocityMetric {
  interval: string; // e.g. "Week 1", "Week 2", "2026-W35"
  completedTasks: number;
  createdTasks: number;
}

export interface CycleTimeMetric {
  averageHours: number;
  medianHours: number;
  distribution: Array<{ range: string; count: number }>;
}

export interface MemberWorkloadMetric {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
}

export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  velocity: VelocityMetric[];
  cycleTime: CycleTimeMetric;
  workload: MemberWorkloadMetric[];
}
