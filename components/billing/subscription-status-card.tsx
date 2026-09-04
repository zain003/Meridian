"use client";

import * as React from "react";
import {
  CreditCard,
  ExternalLink,
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createStripeCustomerPortalAction } from "@/server/actions/billing";
import type { SubscriptionTier, SubscriptionStatus } from "@prisma/client";

interface SubscriptionStatusCardProps {
  workspaceId: string;
  subscription: {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    currentPeriodEnd?: Date | string | null;
    stripeCustomerId?: string | null;
  } | null;
  isOwner: boolean;
}

export function SubscriptionStatusCard({
  workspaceId,
  subscription,
  isOwner,
}: SubscriptionStatusCardProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const tier = subscription?.tier || "FREE";
  const status = subscription?.status || "ACTIVE";
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;

  const handleOpenPortal = async () => {
    if (!isOwner) return;
    setIsLoading(true);
    setError(null);

    try {
      const returnUrl = typeof window !== "undefined" ? window.location.href : "";
      const result = await createStripeCustomerPortalAction(workspaceId, returnUrl);

      if (result.success && result.data?.portalUrl) {
        window.location.href = result.data.portalUrl;
      } else if (!result.success) {
        setError(result.error || "Failed to open billing portal.");
        setIsLoading(false);
      }
    } catch {
      setError("An unexpected error occurred while connecting to Stripe.");
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="success" className="gap-1 text-[11px] font-medium" data-testid="status-badge-active">
            <CheckCircle2 className="size-3" />
            Active
          </Badge>
        );
      case "PAST_DUE":
        return (
          <Badge variant="warning" className="gap-1 text-[11px] font-medium" data-testid="status-badge-past-due">
            <AlertTriangle className="size-3" />
            Past Due
          </Badge>
        );
      case "TRIALING":
        return (
          <Badge variant="info" className="gap-1 text-[11px] font-medium" data-testid="status-badge-trialing">
            Trialing
          </Badge>
        );
      case "CANCELED":
        return (
          <Badge variant="destructive" className="gap-1 text-[11px] font-medium" data-testid="status-badge-canceled">
            Canceled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px] font-medium border-zinc-700 text-zinc-400">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {status === "PAST_DUE" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300"
          data-testid="past-due-alert"
        >
          <AlertTriangle className="size-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-200">Payment Past Due</p>
            <p className="text-amber-300/90">
              Your latest subscription payment failed. Please update your payment method in the
              billing portal to maintain uninterrupted Pro features.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400"
        >
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="border-zinc-800 bg-[#121215]" data-testid="subscription-status-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-base font-semibold text-foreground">
                Current Subscription
              </CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Your workspace is currently on the{" "}
              <span className="font-semibold text-foreground">
                {tier === "PRO" ? "Pro Plan" : "Free Tier"}
              </span>
              .
            </CardDescription>
          </div>

          <div>
            {isOwner ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPortal}
                disabled={isLoading}
                className="gap-1.5 text-xs border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-foreground transition-all"
                data-testid="manage-subscription-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Opening Portal...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="size-3.5 text-zinc-400" />
                    <span>Manage Subscription</span>
                    <ExternalLink className="size-3 text-zinc-500 ml-0.5" />
                  </>
                )}
              </Button>
            ) : (
              <p className="text-[11px] text-zinc-500">
                Only workspace owners can manage invoices & payment methods.
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              Plan Level
            </span>
            <span className="font-semibold text-foreground text-sm">
              {tier === "PRO" ? "Pro Subscription" : "Free Starter"}
            </span>
          </div>

          <div className="space-y-1 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
              <Calendar className="size-3" />
              Billing Cycle
            </span>
            <span className="font-semibold text-foreground text-sm">
              {periodEnd
                ? `Renews on ${periodEnd.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`
                : tier === "PRO"
                ? "Monthly Billing"
                : "Continuous (Free)"}
            </span>
          </div>

          <div className="space-y-1 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              Invoicing & Receipts
            </span>
            <span className="font-semibold text-foreground text-sm">
              {tier === "PRO" ? "Stripe Customer Portal" : "No active billing"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
