import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocked references
const { mockConstructEvent, mockHeadersGet } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockHeadersGet: vi.fn(),
}));

vi.mock("stripe", () => {
  return {
    default: class MockStripe {
      webhooks = {
        constructEvent: mockConstructEvent,
      };
    },
  };
});

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: mockHeadersGet,
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { handleStripeWebhookEvent } from "@/lib/stripe/webhook-handlers";
import { POST } from "@/app/api/webhooks/stripe/route";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

describe("Stripe Webhooks & Subscription Sync Integration (FEAT-007-INT)", () => {
  const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret_key_123";
  });

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
  });

  describe("1. HTTP Webhook Route & Signature Verification (POST)", () => {
    it("rejects requests missing stripe-signature header with HTTP 400", async () => {
      mockHeadersGet.mockReturnValue(null);

      const req = new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ type: "checkout.session.completed" }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain("Missing Stripe webhook secret or signature");
      expect(mockConstructEvent).not.toHaveBeenCalled();
    });

    it("rejects requests when STRIPE_WEBHOOK_SECRET is unset with HTTP 400", async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      mockHeadersGet.mockReturnValue("t=123,v1=signature_val");

      const req = new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ type: "checkout.session.completed" }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      expect(mockConstructEvent).not.toHaveBeenCalled();
    });

    it("rejects requests with invalid Stripe signature with HTTP 400", async () => {
      mockHeadersGet.mockReturnValue("t=123,v1=invalid_signature");
      mockConstructEvent.mockImplementation(() => {
        throw new Error("No signatures found matching the expected signature");
      });

      const req = new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body: "raw_payload_bytes",
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain("Webhook Error: No signatures found matching the expected signature");
    });

    it("verifies valid signature, processes event, and returns HTTP 200 { received: true }", async () => {
      mockHeadersGet.mockReturnValue("t=123,v1=valid_sig");
      const mockEvent: Stripe.Event = {
        id: "evt_100",
        type: "checkout.session.completed",
        data: {
          object: {
            customer: "cus_valid_123",
            subscription: "sub_pro_123",
            metadata: {
              workspaceId: "ws-123",
            },
          } as any,
        },
      } as any;

      mockConstructEvent.mockReturnValue(mockEvent);
      vi.mocked(prisma.subscription.upsert).mockResolvedValueOnce({} as any);

      const req = new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body: "raw_event_payload",
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ received: true });
      expect(mockConstructEvent).toHaveBeenCalledWith(
        "raw_event_payload",
        "t=123,v1=valid_sig",
        "whsec_test_secret_key_123"
      );
    });
  });

  describe("2. Event Handler: checkout.session.completed", () => {
    it("upgrades workspace subscription to tier: PRO and status: ACTIVE with metadata.workspaceId", async () => {
      const event: Stripe.Event = {
        id: "evt_checkout_1",
        type: "checkout.session.completed",
        data: {
          object: {
            customer: "cus_checkout_test",
            subscription: "sub_stripe_pro_99",
            metadata: {
              workspaceId: "ws-target-1",
            },
          } as any,
        },
      } as any;

      vi.mocked(prisma.subscription.upsert).mockResolvedValueOnce({} as any);

      const result = await handleStripeWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(result.workspaceId).toBe("ws-target-1");
      expect(prisma.subscription.upsert).toHaveBeenCalledWith({
        where: { workspaceId: "ws-target-1" },
        update: {
          stripeCustomerId: "cus_checkout_test",
          stripeSubscriptionId: "sub_stripe_pro_99",
          tier: "PRO",
          status: "ACTIVE",
        },
        create: {
          workspaceId: "ws-target-1",
          stripeCustomerId: "cus_checkout_test",
          stripeSubscriptionId: "sub_stripe_pro_99",
          tier: "PRO",
          status: "ACTIVE",
        },
      });
    });

    it("resolves workspaceId via stripeCustomerId lookup if omitted in metadata", async () => {
      const event: Stripe.Event = {
        id: "evt_checkout_2",
        type: "checkout.session.completed",
        data: {
          object: {
            customer: "cus_fallback_customer",
            subscription: "sub_stripe_pro_88",
            metadata: {},
          } as any,
        },
      } as any;

      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce({
        id: "sub-1",
        workspaceId: "ws-fallback-discovered",
        stripeCustomerId: "cus_fallback_customer",
        stripeSubscriptionId: null,
        stripePriceId: null,
        tier: "FREE",
        status: "ACTIVE",
        currentPeriodEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.subscription.upsert).mockResolvedValueOnce({} as any);

      const result = await handleStripeWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(result.workspaceId).toBe("ws-fallback-discovered");
      expect(prisma.subscription.upsert).toHaveBeenCalledWith({
        where: { workspaceId: "ws-fallback-discovered" },
        update: {
          stripeCustomerId: "cus_fallback_customer",
          stripeSubscriptionId: "sub_stripe_pro_88",
          tier: "PRO",
          status: "ACTIVE",
        },
        create: {
          workspaceId: "ws-fallback-discovered",
          stripeCustomerId: "cus_fallback_customer",
          stripeSubscriptionId: "sub_stripe_pro_88",
          tier: "PRO",
          status: "ACTIVE",
        },
      });
    });
  });

  describe("3. Event Handler: customer.subscription.updated", () => {
    it("updates status to PAST_DUE and renews currentPeriodEnd", async () => {
      const futurePeriodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const event: Stripe.Event = {
        id: "evt_sub_updated_1",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_stripe_123",
            customer: "cus_customer_123",
            status: "past_due",
            current_period_end: futurePeriodEnd,
            items: {
              data: [
                {
                  price: { id: "price_pro_monthly" },
                },
              ],
            },
            metadata: {
              workspaceId: "ws-target-1",
            },
          } as any,
        },
      } as any;

      vi.mocked(prisma.subscription.updateMany).mockResolvedValueOnce({ count: 1 });

      const result = await handleStripeWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { stripeSubscriptionId: "sub_stripe_123" },
            { stripeCustomerId: "cus_customer_123" },
            { workspaceId: "ws-target-1" },
          ],
        },
        data: {
          status: "PAST_DUE",
          tier: "FREE",
          stripeSubscriptionId: "sub_stripe_123",
          currentPeriodEnd: new Date(futurePeriodEnd * 1000),
          stripePriceId: "price_pro_monthly",
        },
      });
    });

    it("updates status to ACTIVE and tier to PRO on renewal", async () => {
      const futurePeriodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const event: Stripe.Event = {
        id: "evt_sub_updated_2",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_stripe_123",
            customer: "cus_customer_123",
            status: "active",
            current_period_end: futurePeriodEnd,
            items: {
              data: [{ price: { id: "price_pro_annual" } }],
            },
          } as any,
        },
      } as any;

      vi.mocked(prisma.subscription.updateMany).mockResolvedValueOnce({ count: 1 });

      const result = await handleStripeWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { stripeSubscriptionId: "sub_stripe_123" },
            { stripeCustomerId: "cus_customer_123" },
          ],
        },
        data: {
          status: "ACTIVE",
          tier: "PRO",
          stripeSubscriptionId: "sub_stripe_123",
          currentPeriodEnd: new Date(futurePeriodEnd * 1000),
          stripePriceId: "price_pro_annual",
        },
      });
    });
  });

  describe("4. Event Handler: customer.subscription.deleted", () => {
    it("downgrades workspace subscription to tier: FREE and status: CANCELED", async () => {
      const event: Stripe.Event = {
        id: "evt_sub_deleted_1",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_stripe_to_cancel",
            customer: "cus_canceling_customer",
            metadata: {
              workspaceId: "ws-canceled-1",
            },
          } as any,
        },
      } as any;

      vi.mocked(prisma.subscription.updateMany).mockResolvedValueOnce({ count: 1 });

      const result = await handleStripeWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { stripeSubscriptionId: "sub_stripe_to_cancel" },
            { stripeCustomerId: "cus_canceling_customer" },
            { workspaceId: "ws-canceled-1" },
          ],
        },
        data: {
          tier: "FREE",
          status: "CANCELED",
        },
      });
    });
  });

  describe("5. Unhandled Events & Idempotency", () => {
    it("returns handled: false for unhandled event types without throwing errors", async () => {
      const event: Stripe.Event = {
        id: "evt_payment_intent_succeeded",
        type: "payment_intent.succeeded" as any,
        data: {
          object: {} as any,
        },
      } as any;

      const result = await handleStripeWebhookEvent(event);

      expect(result.handled).toBe(false);
      expect(prisma.subscription.upsert).not.toHaveBeenCalled();
      expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
    });
  });
});
