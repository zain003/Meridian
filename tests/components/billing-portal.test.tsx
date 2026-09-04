/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockCreateStripeCheckoutSessionAction = vi.fn();
const mockCreateStripeCustomerPortalAction = vi.fn();
const mockGetWorkspaceSubscriptionAction = vi.fn();

vi.mock("@/server/actions/billing", () => ({
  createStripeCheckoutSessionAction: (...args: unknown[]) =>
    mockCreateStripeCheckoutSessionAction(...args),
  createStripeCustomerPortalAction: (...args: unknown[]) =>
    mockCreateStripeCustomerPortalAction(...args),
  getWorkspaceSubscriptionAction: (...args: unknown[]) =>
    mockGetWorkspaceSubscriptionAction(...args),
}));

import { SubscriptionStatusCard } from "@/components/billing/subscription-status-card";
import { PricingTierCard } from "@/components/billing/pricing-tier-card";

describe("Billing Portal & Subscription Components (FEAT-007-FE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateStripeCheckoutSessionAction.mockResolvedValue({
      success: true,
      data: { checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_mock" },
    });
    mockCreateStripeCustomerPortalAction.mockResolvedValue({
      success: true,
      data: { portalUrl: "https://billing.stripe.com/p/session/portal_mock" },
    });
  });

  describe("1. SubscriptionStatusCard", () => {
    it("renders Free Tier default status for workspace without subscription", () => {
      render(
        <SubscriptionStatusCard
          workspaceId="ws-test-1"
          subscription={null}
          isOwner={true}
        />
      );

      expect(screen.getByText("Current Subscription")).toBeInTheDocument();
      expect(screen.getByText("Free Tier")).toBeInTheDocument();
      expect(screen.getByTestId("status-badge-active")).toHaveTextContent("Active");
      expect(screen.getByText("Free Starter")).toBeInTheDocument();
      expect(screen.getByText("Continuous (Free)")).toBeInTheDocument();
    });

    it("renders Pro Plan with renewal date and active badge", () => {
      render(
        <SubscriptionStatusCard
          workspaceId="ws-test-1"
          subscription={{
            tier: "PRO",
            status: "ACTIVE",
            currentPeriodEnd: new Date("2026-10-15T00:00:00Z"),
            stripeCustomerId: "cus_123",
          }}
          isOwner={true}
        />
      );

      expect(screen.getByText("Pro Plan")).toBeInTheDocument();
      expect(screen.getByTestId("status-badge-active")).toBeInTheDocument();
      expect(screen.getByText("Pro Subscription")).toBeInTheDocument();
      expect(screen.getByText(/Renews on/)).toBeInTheDocument();
      expect(screen.getByTestId("manage-subscription-btn")).toBeInTheDocument();
    });

    it("displays Past Due warning alert when status is PAST_DUE", () => {
      render(
        <SubscriptionStatusCard
          workspaceId="ws-test-1"
          subscription={{
            tier: "PRO",
            status: "PAST_DUE",
            currentPeriodEnd: new Date("2026-10-15T00:00:00Z"),
            stripeCustomerId: "cus_123",
          }}
          isOwner={true}
        />
      );

      expect(screen.getByTestId("past-due-alert")).toBeInTheDocument();
      expect(screen.getByText("Payment Past Due")).toBeInTheDocument();
      expect(screen.getByTestId("status-badge-past-due")).toBeInTheDocument();
    });

    it("triggers createStripeCustomerPortalAction when owner clicks Manage Subscription", async () => {
      render(
        <SubscriptionStatusCard
          workspaceId="ws-test-1"
          subscription={{
            tier: "PRO",
            status: "ACTIVE",
            currentPeriodEnd: new Date("2026-10-15T00:00:00Z"),
            stripeCustomerId: "cus_123",
          }}
          isOwner={true}
        />
      );

      const manageBtn = screen.getByTestId("manage-subscription-btn");
      fireEvent.click(manageBtn);

      await waitFor(() => {
        expect(mockCreateStripeCustomerPortalAction).toHaveBeenCalledWith(
          "ws-test-1",
          expect.any(String)
        );
      });
    });

    it("hides manage subscription button and shows note for non-owners", () => {
      render(
        <SubscriptionStatusCard
          workspaceId="ws-test-1"
          subscription={{
            tier: "PRO",
            status: "ACTIVE",
            currentPeriodEnd: new Date("2026-10-15T00:00:00Z"),
            stripeCustomerId: "cus_123",
          }}
          isOwner={false}
        />
      );

      expect(screen.queryByTestId("manage-subscription-btn")).not.toBeInTheDocument();
      expect(
        screen.getByText("Only workspace owners can manage invoices & payment methods.")
      ).toBeInTheDocument();
    });
  });

  describe("2. PricingTierCard", () => {
    it("renders Free Tier and Pro Plan comparison cards with feature checklists", () => {
      render(
        <PricingTierCard
          workspaceId="ws-test-1"
          currentTier="FREE"
          isOwner={true}
        />
      );

      expect(screen.getByTestId("pricing-card-free")).toBeInTheDocument();
      expect(screen.getByTestId("pricing-card-pro")).toBeInTheDocument();
      expect(screen.getByText("Up to 3 active projects")).toBeInTheDocument();
      expect(screen.getByText("Unlimited projects & boards")).toBeInTheDocument();
      expect(screen.getByText("Full velocity, burndown & cycle time analytics")).toBeInTheDocument();
      expect(screen.getByText("Most Popular")).toBeInTheDocument();
    });

    it("triggers createStripeCheckoutSessionAction when owner clicks Upgrade to Pro", async () => {
      render(
        <PricingTierCard
          workspaceId="ws-test-1"
          currentTier="FREE"
          isOwner={true}
        />
      );

      const upgradeBtn = screen.getByTestId("upgrade-to-pro-btn");
      expect(upgradeBtn).toHaveTextContent("Upgrade to Pro");

      fireEvent.click(upgradeBtn);

      await waitFor(() => {
        expect(mockCreateStripeCheckoutSessionAction).toHaveBeenCalledWith({
          workspaceId: "ws-test-1",
          priceId: "price_pro_monthly",
          returnUrl: expect.any(String),
        });
      });
    });

    it("shows active plan indicator and disables upgrade button when already on PRO", () => {
      render(
        <PricingTierCard
          workspaceId="ws-test-1"
          currentTier="PRO"
          isOwner={true}
        />
      );

      expect(screen.queryByTestId("upgrade-to-pro-btn")).not.toBeInTheDocument();
      expect(screen.getByText("Active Plan")).toBeInTheDocument();
    });

    it("disables upgrade button and displays owner note for non-owners on FREE tier", () => {
      render(
        <PricingTierCard
          workspaceId="ws-test-1"
          currentTier="FREE"
          isOwner={false}
        />
      );

      expect(screen.queryByTestId("upgrade-to-pro-btn")).not.toBeInTheDocument();
      expect(screen.getByText("Upgrade to Pro")).toBeDisabled();
      expect(screen.getByText("Only workspace owners can upgrade plans.")).toBeInTheDocument();
    });
  });
});
