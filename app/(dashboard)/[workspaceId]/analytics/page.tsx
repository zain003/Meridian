import * as React from "react";
import { redirect, notFound } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/rbac";
import { getWorkspaceAnalyticsAction } from "@/server/actions/analytics";
import { AnalyticsDashboardView } from "@/components/analytics/analytics-dashboard-view";
import type { AnalyticsSummary } from "@/lib/validations/analytics";

export const dynamic = "force-dynamic";

interface AnalyticsPageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

const DEFAULT_ANALYTICS_SUMMARY: AnalyticsSummary = {
  totalTasks: 0,
  completedTasks: 0,
  velocity: [],
  cycleTime: {
    averageHours: 0,
    medianHours: 0,
    distribution: [
      { range: "< 24h", count: 0 },
      { range: "1-3 days", count: 0 },
      { range: "3-7 days", count: 0 },
      { range: "1-2 weeks", count: 0 },
      { range: "> 2 weeks", count: 0 },
    ],
  },
  workload: [],
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { workspaceId } = await params;
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    await requireWorkspaceAccess(workspaceId, "VIEWER");
  } catch {
    redirect("/onboarding");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!workspace) {
    notFound();
  }

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      key: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const analyticsResponse = await getWorkspaceAnalyticsAction({ workspaceId });
  const initialSummary =
    analyticsResponse.success && analyticsResponse.data
      ? analyticsResponse.data
      : DEFAULT_ANALYTICS_SUMMARY;

  return (
    <AnalyticsDashboardView
      workspaceId={workspaceId}
      initialSummary={initialSummary}
      projects={projects}
    />
  );
}
