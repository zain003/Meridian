import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as authModule from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Use vi.hoisted for variables referenced in vi.mock
const { mockCustomerCreate, mockCheckoutSessionCreate, mockPortalSessionCreate } = vi.hoisted(() => ({
  mockCustomerCreate: vi.fn(),
  mockCheckoutSessionCreate: vi.fn(),
  mockPortalSessionCreate: vi.fn(),
}));

vi.mock("stripe", () => {
  return {
    default: class MockStripe {
      customers = {
        create: mockCustomerCreate,
      };
      checkout = {
        sessions: {
          create: mockCheckoutSessionCreate,
        },
      };
      billingPortal = {
        sessions: {
          create: mockPortalSessionCreate,
        },
      };
    },
  };
});

vi.mock("@/lib/auth", () => ({
  getAuthSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { getOrCreateStripeCustomer } from "@/lib/stripe";
import {
  createStripeCheckoutSessionAction,
  createStripeCustomerPortalAction,
  getWorkspaceSubscriptionAction,
} from "@/server/actions/billing";

describe("Stripe Subscription Billing Backend (FEAT-007-BE)", () => {
  const mockUser = {
    id: "user-owner-1",
    name: "Alex Owner",
    email: "alex@meridian.dev",
  };

  const mockWorkspace = {
    id: "ws-test-1",
    name: "Meridian HQ",
    slug: "meridian-hq",
    subscription: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. getOrCreateStripeCustomer", () => {
    it("returns existing customer ID without creating a new Stripe customer if already in DB", async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce({
        id: "sub-1",
        workspaceId: "ws-test-1",
        stripeCustomerId: "cus_existing123",
        stripeSubscriptionId: null,
        stripePriceId: null,
        tier: "FREE",
        status: "ACTIVE",
        currentPeriodEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const customerId = await getOrCreateStripeCustomer(
        "ws-test-1",
        "alex@meridian.dev",
        "Meridian HQ"
      );

      expect(customerId).toBe("cus_existing123");
      expect(mockCustomerCreate).not.toHaveBeenCalled();
      expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    });

    it("creates a new Stripe customer and records stripeCustomerId in Subscription table when none exists", async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null);
      mockCustomerCreate.mockResolvedValueOnce({
        id: "cus_newCreated456",
        email: "alex@meridian.dev",
        name: "Meridian HQ",
      });
      vi.mocked(prisma.subscription.upsert).mockResolvedValueOnce({
        id: "sub-new",
        workspaceId: "ws-test-1",
        stripeCustomerId: "cus_newCreated456",
        stripeSubscriptionId: null,
        stripePriceId: null,
        tier: "FREE",
        status: "ACTIVE",
        currentPeriodEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const customerId = await getOrCreateStripeCustomer(
        "ws-test-1",
        "alex@meridian.dev",
        "Meridian HQ"
      );

      expect(customerId).toBe("cus_newCreated456");
      expect(mockCustomerCreate).toHaveBeenCalledWith({
        email: "alex@meridian.dev",
        name: "Meridian HQ",
        metadata: {
          workspaceId: "ws-test-1",
        },
      });
      expect(prisma.subscription.upsert).toHaveBeenCalledWith({
        where: { workspaceId: "ws-test-1" },
        update: {
          stripeCustomerId: "cus_newCreated456",
        },
        create: {
          workspaceId: "ws-test-1",
          stripeCustomerId: "cus_newCreated456",
          tier: "FREE",
          status: "ACTIVE",
        },
      });
    });
  });

  describe("2. createStripeCheckoutSessionAction", () => {
    it("rejects unauthenticated requests with UNAUTHORIZED", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValueOnce(null);

      const result = await createStripeCheckoutSessionAction({
        workspaceId: "ws-test-1",
        priceId: "price_pro_monthly",
        returnUrl: "http://localhost:3000/ws-test-1/settings/billing",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("UNAUTHORIZED");
      }
      expect(mockCheckoutSessionCreate).not.toHaveBeenCalled();
    });

    it("rejects non-owner members with FORBIDDEN", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValueOnce({
        user: { id: "user-member-2", email: "member@meridian.dev" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
        id: "mem-2",
        workspaceId: "ws-test-1",
        userId: "user-member-2",
        role: "MEMBER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createStripeCheckoutSessionAction({
        workspaceId: "ws-test-1",
        priceId: "price_pro_monthly",
        returnUrl: "http://localhost:3000/ws-test-1/settings/billing",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("FORBIDDEN");
      }
      expect(mockCheckoutSessionCreate).not.toHaveBeenCalled();
    });

    it("generates valid Stripe Checkout session URL for workspace OWNER with metadata", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValueOnce({
        user: mockUser,
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
        id: "mem-1",
        workspaceId: "ws-test-1",
        userId: mockUser.id,
        role: "OWNER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
        ...mockWorkspace,
        subscription: null,
      } as any);

      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null);
      mockCustomerCreate.mockResolvedValueOnce({
        id: "cus_checkout_test",
      });
      vi.mocked(prisma.subscription.upsert).mockResolvedValueOnce({} as any);

      mockCheckoutSessionCreate.mockResolvedValueOnce({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/c/pay/cs_test_123",
      });

      const result = await createStripeCheckoutSessionAction({
        workspaceId: "ws-test-1",
        priceId: "price_pro_monthly",
        returnUrl: "http://localhost:3000/ws-test-1/settings/billing",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.checkoutUrl).toBe("https://checkout.stripe.com/c/pay/cs_test_123");
      }
      expect(mockCheckoutSessionCreate).toHaveBeenCalledWith({
        customer: "cus_checkout_test",
        payment_method_types: ["card"],
        line_items: [
          {
            price: "price_pro_monthly",
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: "http://localhost:3000/ws-test-1/settings/billing?session_id={CHECKOUT_SESSION_ID}&success=true",
        cancel_url: "http://localhost:3000/ws-test-1/settings/billing?canceled=true",
        metadata: {
          workspaceId: "ws-test-1",
          userId: mockUser.id,
        },
        subscription_data: {
          metadata: {
            workspaceId: "ws-test-1",
          },
        },
      });
    });

    it("redirects to Customer Portal if workspace already has active PRO subscription", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValueOnce({
        user: mockUser,
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
        id: "mem-1",
        workspaceId: "ws-test-1",
        userId: mockUser.id,
        role: "OWNER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
        ...mockWorkspace,
        subscription: {
          id: "sub-active-pro",
          workspaceId: "ws-test-1",
          stripeCustomerId: "cus_active_pro",
          stripeSubscriptionId: "sub_stripe_123",
          tier: "PRO",
          status: "ACTIVE",
        },
      } as any);

      mockPortalSessionCreate.mockResolvedValueOnce({
        url: "https://billing.stripe.com/p/session/portal_active_pro",
      });

      const result = await createStripeCheckoutSessionAction({
        workspaceId: "ws-test-1",
        priceId: "price_pro_monthly",
        returnUrl: "http://localhost:3000/ws-test-1/settings/billing",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.checkoutUrl).toBe("https://billing.stripe.com/p/session/portal_active_pro");
      }
      expect(mockCheckoutSessionCreate).not.toHaveBeenCalled();
    });

    it("returns validation error on invalid input parameters", async () => {
      const result = await createStripeCheckoutSessionAction({
        workspaceId: "",
        priceId: "",
        returnUrl: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid checkout session parameters");
        expect(result.fieldErrors).toBeDefined();
      }
    });
  });

  describe("3. createStripeCustomerPortalAction", () => {
    it("rejects non-owner members with FORBIDDEN", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValueOnce({
        user: { id: "user-admin-2", email: "admin@meridian.dev" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
        id: "mem-admin",
        workspaceId: "ws-test-1",
        userId: "user-admin-2",
        role: "ADMIN",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createStripeCustomerPortalAction("ws-test-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("FORBIDDEN");
      }
      expect(mockPortalSessionCreate).not.toHaveBeenCalled();
    });

    it("generates Stripe Customer Portal session URL for workspace OWNER with existing stripeCustomerId", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValueOnce({
        user: mockUser,
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
        id: "mem-1",
        workspaceId: "ws-test-1",
        userId: mockUser.id,
        role: "OWNER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
        ...mockWorkspace,
        subscription: {
          id: "sub-1",
          stripeCustomerId: "cus_existing_portal",
        },
      } as any);

      mockPortalSessionCreate.mockResolvedValueOnce({
        url: "https://billing.stripe.com/p/session/test_portal_session",
      });

      const result = await createStripeCustomerPortalAction(
        "ws-test-1",
        "http://localhost:3000/ws-test-1/settings/billing"
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.portalUrl).toBe("https://billing.stripe.com/p/session/test_portal_session");
      }
      expect(mockPortalSessionCreate).toHaveBeenCalledWith({
        customer: "cus_existing_portal",
        return_url: "http://localhost:3000/ws-test-1/settings/billing",
      });
    });

    it("handles Stripe API errors gracefully returning structured error response", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValueOnce({
        user: mockUser,
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
        id: "mem-1",
        workspaceId: "ws-test-1",
        userId: mockUser.id,
        role: "OWNER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
        ...mockWorkspace,
        subscription: {
          id: "sub-1",
          stripeCustomerId: "cus_existing_portal",
        },
      } as any);

      mockPortalSessionCreate.mockRejectedValueOnce(new Error("Stripe API down"));

      const result = await createStripeCustomerPortalAction("ws-test-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to open customer billing portal.");
      }
    });
  });

  describe("4. getWorkspaceSubscriptionAction", () => {
    it("allows any workspace member (e.g. VIEWER) to query subscription status", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValueOnce({
        user: { id: "user-viewer-3", email: "viewer@meridian.dev" },
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
        id: "mem-viewer",
        workspaceId: "ws-test-1",
        userId: "user-viewer-3",
        role: "VIEWER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockSubRecord = {
        id: "sub-1",
        workspaceId: "ws-test-1",
        stripeCustomerId: "cus_viewer_test",
        stripeSubscriptionId: "sub_123",
        stripePriceId: "price_pro",
        tier: "PRO" as const,
        status: "ACTIVE" as const,
        currentPeriodEnd: new Date("2026-10-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(mockSubRecord);

      const result = await getWorkspaceSubscriptionAction("ws-test-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockSubRecord);
      }
    });

    it("returns null data if no subscription record exists for workspace", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValueOnce({
        user: mockUser,
      } as any);

      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
        id: "mem-1",
        workspaceId: "ws-test-1",
        userId: mockUser.id,
        role: "OWNER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null);

      const result = await getWorkspaceSubscriptionAction("ws-test-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("rejects unauthenticated user with UNAUTHORIZED", async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValueOnce(null);

      const result = await getWorkspaceSubscriptionAction("ws-test-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("UNAUTHORIZED");
      }
    });
  });
});
