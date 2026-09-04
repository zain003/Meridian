import * as React from "react";
import { redirect, notFound } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/rbac";
import { getWorkspaceSubscriptionAction } from "@/server/actions/billing";
import { SubscriptionStatusCard } from "@/components/billing/subscription-status-card";
import { PricingTierCard } from "@/components/billing/pricing-tier-card";
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

interface BillingPageProps {
  params: Promise<{ workspaceId: string }>;
  searchParams?: Promise<{ success?: string; canceled?: string; session_id?: string }>;
}

export default async function BillingSettingsPage({
  params,
  searchParams,
}: BillingPageProps) {
  const { workspaceId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  let accessContext;
  try {
    accessContext = await requireWorkspaceAccess(workspaceId, "VIEWER");
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

  const subscriptionResult = await getWorkspaceSubscriptionAction(workspaceId);
  const subscription = subscriptionResult.success ? subscriptionResult.data : null;
  const isOwner = accessContext.role === "OWNER";
  const currentTier = subscription?.tier || "FREE";

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <CreditCard className="size-5 text-primary" />
          Billing & Subscription
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage {workspace.name}&apos;s plan, payment details, and billing invoices.
        </p>
      </div>

      {/* Query Param Feedback Banners */}
      {resolvedSearchParams?.success === "true" && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 animate-in fade-in duration-200"
          data-testid="checkout-success-banner"
        >
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-semibold text-emerald-200">Payment Successful!</p>
            <p className="text-emerald-300/90">
              Your subscription upgrade is being activated. Welcome to Meridian Pro!
            </p>
          </div>
        </div>
      )}

      {resolvedSearchParams?.canceled === "true" && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4 text-xs text-zinc-300 animate-in fade-in duration-200"
          data-testid="checkout-canceled-banner"
        >
          <AlertCircle className="size-5 shrink-0 text-zinc-400" />
          <div>
            <p className="font-semibold text-zinc-200">Checkout Canceled</p>
            <p className="text-zinc-400">
              The checkout process was canceled. No charges were made.
            </p>
          </div>
        </div>
      )}

      {/* Subscription Status Card */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Overview
        </h2>
        <SubscriptionStatusCard
          workspaceId={workspace.id}
          subscription={subscription}
          isOwner={isOwner}
        />
      </div>

      {/* Pricing Tier Comparison Cards */}
      <div className="space-y-4 pt-2">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Available Plans
          </h2>
          <p className="text-xs text-muted-foreground">
            Upgrade to unlock unlimited workflow automation rules, team analytics, and priority support.
          </p>
        </div>

        <PricingTierCard
          workspaceId={workspace.id}
          currentTier={currentTier}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
