"use client";

import * as React from "react";
import { Check, Zap, Loader2, Sparkles, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createStripeCheckoutSessionAction } from "@/server/actions/billing";
import { cn } from "@/lib/utils";

interface PricingTierCardProps {
  workspaceId: string;
  currentTier: "FREE" | "PRO";
  isOwner: boolean;
  priceId?: string;
}

const FREE_FEATURES = [
  "Up to 3 active projects",
  "Basic Kanban and List task views",
  "3 custom workflow automation rules",
  "7-day team activity history",
  "Standard community support",
];

const PRO_FEATURES = [
  "Unlimited projects & boards",
  "Kanban, List & Monthly Calendar views",
  "Unlimited custom automation rules",
  "Full velocity, burndown & cycle time analytics",
  "Real-time live presence & active card viewers",
  "Priority email support & SLA",
];

export function PricingTierCard({
  workspaceId,
  currentTier,
  isOwner,
  priceId = "price_pro_monthly",
}: PricingTierCardProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!isOwner) return;
    setIsLoading(true);
    setError(null);

    try {
      const returnUrl = typeof window !== "undefined" ? window.location.href : "";
      const result = await createStripeCheckoutSessionAction({
        workspaceId,
        priceId,
        returnUrl,
      });

      if (result.success && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else if (!result.success) {
        setError(result.error || "Failed to initiate Stripe Checkout.");
        setIsLoading(false);
      }
    } catch {
      setError("An unexpected error occurred while connecting to Stripe.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400"
        >
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan Card */}
        <Card
          className={cn(
            "relative flex flex-col justify-between transition-all",
            currentTier === "FREE" && "border-zinc-700/80 bg-[#141418]"
          )}
          data-testid="pricing-card-free"
        >
          <div>
            <CardHeader className="space-y-2 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">Free Tier</CardTitle>
                {currentTier === "FREE" && (
                  <Badge variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Essential tools for small teams and personal task management.
              </CardDescription>
              <div className="pt-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">$0</span>
                <span className="text-xs text-muted-foreground ml-1">/ month</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Included Features
              </div>
              <ul className="space-y-2.5">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <Check className="size-4 shrink-0 text-zinc-500 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </div>

          <CardFooter className="pt-4 border-t border-zinc-800/60">
            <Button
              variant="outline"
              disabled
              className="w-full text-xs font-medium border-zinc-800 bg-zinc-900/50 text-zinc-500"
            >
              {currentTier === "FREE" ? "Active Plan" : "Free Tier"}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan Card */}
        <Card
          className={cn(
            "relative flex flex-col justify-between border-primary/40 bg-gradient-to-b from-primary/5 via-[#121215] to-[#121215] shadow-lg shadow-primary/5 transition-all",
            currentTier === "PRO" && "border-primary bg-primary/[0.07]"
          )}
          data-testid="pricing-card-pro"
        >
          <div className="absolute -top-3 right-5">
            <Badge className="bg-primary text-primary-foreground border-0 shadow-sm flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5">
              <Sparkles className="size-3" />
              Most Popular
            </Badge>
          </div>

          <div>
            <CardHeader className="space-y-2 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-1.5">
                  Pro Plan
                </CardTitle>
                {currentTier === "PRO" && (
                  <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Advanced workflow automation, unlimited projects, and velocity analytics.
              </CardDescription>
              <div className="pt-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">$12</span>
                <span className="text-xs text-muted-foreground ml-1">/ user / month</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                Everything in Free, plus
              </div>
              <ul className="space-y-2.5">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-xs text-zinc-200">
                    <Check className="size-4 shrink-0 text-primary mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </div>

          <CardFooter className="flex-col items-stretch gap-2 pt-4 border-t border-zinc-800/60">
            {currentTier === "PRO" ? (
              <Button
                variant="outline"
                disabled
                className="w-full text-xs font-medium border-primary/30 bg-primary/10 text-primary"
              >
                <Check className="size-3.5 mr-1.5" />
                Active Plan
              </Button>
            ) : isOwner ? (
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-[0.98]"
                data-testid="upgrade-to-pro-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Connecting to Stripe...
                  </>
                ) : (
                  <>
                    <Zap className="size-3.5 mr-1.5" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-1 text-center">
                <Button
                  variant="outline"
                  disabled
                  className="w-full text-xs font-medium border-zinc-800 text-zinc-500 cursor-not-allowed"
                >
                  Upgrade to Pro
                </Button>
                <p className="text-[11px] text-zinc-500">
                  Only workspace owners can upgrade plans.
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
