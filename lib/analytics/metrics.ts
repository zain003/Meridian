import { prisma } from "@/lib/prisma";
import type {
  AnalyticsFilterInput,
  AnalyticsSummary,
  VelocityMetric,
  CycleTimeMetric,
  MemberWorkloadMetric,
} from "@/lib/validations/analytics";

export interface TaskMetricItem {
  id: string;
  createdAt: Date;
  completedAt: Date | null;
  assigneeId: string | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  column?: {
    id: string;
    name: string;
    order?: number;
  } | null;
}

export interface WorkspaceMemberMetricItem {
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

/**
 * Generates time interval buckets for velocity metrics.
 * Defaults to 4 weekly intervals if no range is specified.
 */
export function generateTimeIntervals(
  startDate?: Date | null,
  endDate?: Date | null
): Array<{ label: string; start: Date; end: Date }> {
  const now = endDate ? new Date(endDate) : new Date();

  if (startDate && endDate) {
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const totalMs = Math.max(1, endMs - startMs);
    const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
    
    // Choose sensible interval count (between 2 and 6, default 4)
    const intervalCount = totalDays <= 7 ? Math.max(1, totalDays) : Math.min(6, Math.max(2, Math.ceil(totalDays / 7)));
    const stepMs = totalMs / intervalCount;

    const intervals: Array<{ label: string; start: Date; end: Date }> = [];
    for (let i = 0; i < intervalCount; i++) {
      const intervalStart = new Date(startMs + i * stepMs);
      const intervalEnd = new Date(startMs + (i + 1) * stepMs);
      intervals.push({
        label: totalDays <= 7 ? `Day ${i + 1}` : `Week ${i + 1}`,
        start: intervalStart,
        end: intervalEnd,
      });
    }
    return intervals;
  }

  // Default: 4 weekly intervals ending at now
  const intervals: Array<{ label: string; start: Date; end: Date }> = [];
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const fourWeeksAgoMs = now.getTime() - 4 * oneWeekMs;

  for (let i = 0; i < 4; i++) {
    const intervalStart = new Date(fourWeeksAgoMs + i * oneWeekMs);
    const intervalEnd = new Date(fourWeeksAgoMs + (i + 1) * oneWeekMs);
    intervals.push({
      label: `Week ${i + 1}`,
      start: intervalStart,
      end: intervalEnd,
    });
  }

  return intervals;
}

/**
 * Computes velocity metrics grouped by time intervals.
 * Fills inactive intervals with zero counts.
 */
export function calculateVelocityMetrics(
  tasks: TaskMetricItem[],
  startDate?: Date | null,
  endDate?: Date | null
): VelocityMetric[] {
  const intervals = generateTimeIntervals(startDate, endDate);

  return intervals.map((interval, index) => {
    const isLast = index === intervals.length - 1;

    const createdTasks = tasks.filter((task) => {
      const createdAt = new Date(task.createdAt).getTime();
      const inStart = createdAt >= interval.start.getTime();
      const inEnd = isLast
        ? createdAt <= interval.end.getTime()
        : createdAt < interval.end.getTime();
      return inStart && inEnd;
    }).length;

    const completedTasks = tasks.filter((task) => {
      if (!task.completedAt) return false;
      const completedAt = new Date(task.completedAt).getTime();
      const inStart = completedAt >= interval.start.getTime();
      const inEnd = isLast
        ? completedAt <= interval.end.getTime()
        : completedAt < interval.end.getTime();
      return inStart && inEnd;
    }).length;

    return {
      interval: interval.label,
      createdTasks,
      completedTasks,
    };
  });
}

/**
 * Calculates average and median cycle time in hours and duration distribution buckets.
 * Tasks without a completedAt timestamp are strictly excluded.
 */
export function calculateCycleTimeMetrics(tasks: TaskMetricItem[]): CycleTimeMetric {
  const completedTasks = tasks.filter((task) => task.completedAt !== null && task.completedAt !== undefined);

  const defaultDistribution = [
    { range: "< 24h", count: 0 },
    { range: "1-3 days", count: 0 },
    { range: "3-7 days", count: 0 },
    { range: "1-2 weeks", count: 0 },
    { range: "> 2 weeks", count: 0 },
  ];

  if (completedTasks.length === 0) {
    return {
      averageHours: 0,
      medianHours: 0,
      distribution: defaultDistribution,
    };
  }

  const hoursList: number[] = [];
  const distributionCounts: Record<string, number> = {
    "< 24h": 0,
    "1-3 days": 0,
    "3-7 days": 0,
    "1-2 weeks": 0,
    "> 2 weeks": 0,
  };

  let totalHours = 0;

  for (const task of completedTasks) {
    const createdMs = new Date(task.createdAt).getTime();
    const completedMs = new Date(task.completedAt!).getTime();
    const durationHours = Math.max(0, (completedMs - createdMs) / (1000 * 60 * 60));
    
    hoursList.push(durationHours);
    totalHours += durationHours;

    if (durationHours < 24) {
      distributionCounts["< 24h"]++;
    } else if (durationHours < 72) {
      distributionCounts["1-3 days"]++;
    } else if (durationHours < 168) {
      distributionCounts["3-7 days"]++;
    } else if (durationHours < 336) {
      distributionCounts["1-2 weeks"]++;
    } else {
      distributionCounts["> 2 weeks"]++;
    }
  }

  // Average calculation
  const averageHours = Number((totalHours / completedTasks.length).toFixed(1));

  // Median calculation
  hoursList.sort((a, b) => a - b);
  const mid = Math.floor(hoursList.length / 2);
  const median =
    hoursList.length % 2 !== 0
      ? hoursList[mid]
      : (hoursList[mid - 1] + hoursList[mid]) / 2;
  const medianHours = Number(median.toFixed(1));

  const distribution = [
    { range: "< 24h", count: distributionCounts["< 24h"] },
    { range: "1-3 days", count: distributionCounts["1-3 days"] },
    { range: "3-7 days", count: distributionCounts["3-7 days"] },
    { range: "1-2 weeks", count: distributionCounts["1-2 weeks"] },
    { range: "> 2 weeks", count: distributionCounts["> 2 weeks"] },
  ];

  return {
    averageHours,
    medianHours,
    distribution,
  };
}

/**
 * Calculates member workload distribution (assigned, in-progress, completed).
 * Aggregates unassigned tasks into an "Unassigned" bucket when present.
 */
export function calculateWorkloadMetrics(
  tasks: TaskMetricItem[],
  members: WorkspaceMemberMetricItem[] = []
): MemberWorkloadMetric[] {
  const memberMap = new Map<string, MemberWorkloadMetric>();

  // Initialize all workspace members
  for (const member of members) {
    memberMap.set(member.userId, {
      userId: member.userId,
      userName: member.user.name || member.user.email || "Member",
      userAvatar: member.user.image || null,
      assignedCount: 0,
      inProgressCount: 0,
      completedCount: 0,
    });
  }

  let unassignedCount = 0;
  let unassignedInProgress = 0;
  let unassignedCompleted = 0;

  for (const task of tasks) {
    const isCompleted =
      task.completedAt !== null && task.completedAt !== undefined ||
      task.column?.name?.trim().toLowerCase() === "done";

    const isInProgress =
      !isCompleted &&
      (task.column?.name?.trim().toLowerCase().includes("progress") ||
        task.column?.name?.trim().toLowerCase().includes("review") ||
        task.column?.name?.trim().toLowerCase() === "in progress");

    if (!task.assigneeId) {
      unassignedCount++;
      if (isCompleted) unassignedCompleted++;
      if (isInProgress) unassignedInProgress++;
      continue;
    }

    let workload = memberMap.get(task.assigneeId);
    if (!workload) {
      // If task assignee is not in members list (e.g. past member or direct assignee)
      workload = {
        userId: task.assigneeId,
        userName: task.assignee?.name || task.assignee?.email || "Member",
        userAvatar: task.assignee?.image || null,
        assignedCount: 0,
        inProgressCount: 0,
        completedCount: 0,
      };
      memberMap.set(task.assigneeId, workload);
    }

    workload.assignedCount++;
    if (isCompleted) workload.completedCount++;
    if (isInProgress) workload.inProgressCount++;
  }

  const result = Array.from(memberMap.values()).sort(
    (a, b) => b.assignedCount - a.assignedCount
  );

  // If there are unassigned tasks, add the Unassigned bucket
  if (unassignedCount > 0) {
    result.push({
      userId: "unassigned",
      userName: "Unassigned",
      userAvatar: null,
      assignedCount: unassignedCount,
      inProgressCount: unassignedInProgress,
      completedCount: unassignedCompleted,
    });
  }

  return result;
}

/**
 * Pure helper to compute complete AnalyticsSummary from raw task and member collections.
 */
export function calculateMetricsFromData(
  tasks: TaskMetricItem[],
  members: WorkspaceMemberMetricItem[],
  startDate?: Date | null,
  endDate?: Date | null
): AnalyticsSummary {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) =>
      (task.completedAt !== null && task.completedAt !== undefined) ||
      task.column?.name?.trim().toLowerCase() === "done"
  ).length;

  const velocity = calculateVelocityMetrics(tasks, startDate, endDate);
  const cycleTime = calculateCycleTimeMetrics(tasks);
  const workload = calculateWorkloadMetrics(tasks, members);

  return {
    totalTasks,
    completedTasks,
    velocity,
    cycleTime,
    workload,
  };
}

/**
 * Aggregates workspace tasks and computes full analytics summary.
 * Performance optimized to complete within <300ms using indexed Prisma queries.
 */
export async function getWorkspaceAnalytics(
  input: AnalyticsFilterInput
): Promise<AnalyticsSummary> {
  const { workspaceId, projectId, startDate, endDate } = input;

  const dateFilter =
    startDate || endDate
      ? {
          OR: [
            {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            },
            {
              completedAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            },
          ],
        }
      : {};

  const [tasks, members] = await Promise.all([
    prisma.task.findMany({
      where: {
        workspaceId,
        ...(projectId ? { projectId } : {}),
        ...dateFilter,
      },
      select: {
        id: true,
        createdAt: true,
        completedAt: true,
        assigneeId: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
  ]);

  return calculateMetricsFromData(tasks, members, startDate, endDate);
}
