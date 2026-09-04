"use server";

import type { Subscription } from "@prisma/client";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { requireWorkspaceAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  createCheckoutSessionSchema,
  createCustomerPortalSchema,
  type CreateCheckoutSessionInput,
} from "@/lib/validations/billing";
import type { ActionResponse } from "@/types";

export type { CreateCheckoutSessionInput };

/**
 * Creates a Stripe Checkout Session for upgrading a workspace from Free to Pro tier.
 * Only workspace OWNER can initiate a checkout session.
 */
export async function createStripeCheckoutSessionAction(
  input: CreateCheckoutSessionInput
): Promise<ActionResponse<{ checkoutUrl: string }>> {
  const parsed = createCheckoutSessionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: "Invalid checkout session parameters",
      fieldErrors,
    };
  }

  const { workspaceId, priceId, returnUrl } = parsed.data;

  try {
    const { user } = await requireWorkspaceAccess(workspaceId, "OWNER");

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { subscription: true },
    });

    if (!workspace) {
      return {
        success: false,
        error: "Workspace not found",
      };
    }

    // Edge Case: If workspace already has an active Pro subscription, redirect to Customer Portal
    if (
      workspace.subscription &&
      workspace.subscription.tier === "PRO" &&
      workspace.subscription.status === "ACTIVE" &&
      workspace.subscription.stripeCustomerId
    ) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: workspace.subscription.stripeCustomerId,
        return_url: returnUrl,
      });

      return {
        success: true,
        data: { checkoutUrl: portalSession.url },
      };
    }

    const stripeCustomerId = await getOrCreateStripeCustomer(
      workspaceId,
      user.email,
      workspace.name
    );

    const successUrl = returnUrl.includes("?")
      ? `${returnUrl}&session_id={CHECKOUT_SESSION_ID}&success=true`
      : `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`;

    const cancelUrl = returnUrl.includes("?")
      ? `${returnUrl}&canceled=true`
      : `${returnUrl}?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        workspaceId,
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          workspaceId,
        },
      },
    });

    if (!session.url) {
      return {
        success: false,
        error: "Failed to generate Stripe Checkout URL",
      };
    }

    return {
      success: true,
      data: {
        checkoutUrl: session.url,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to create Stripe Checkout session:", error);
    return {
      success: false,
      error: "Failed to initiate checkout. Please check Stripe configuration.",
    };
  }
}

/**
 * Creates a Stripe Customer Portal session URL for managing subscriptions and invoices.
 * Only workspace OWNER can access the Customer Portal.
 */
export async function createStripeCustomerPortalAction(
  workspaceId: string,
  returnUrl?: string
): Promise<ActionResponse<{ portalUrl: string }>> {
  const parsed = createCustomerPortalSchema.safeParse({ workspaceId, returnUrl });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid customer portal parameters",
    };
  }

  try {
    const { user } = await requireWorkspaceAccess(workspaceId, "OWNER");

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { subscription: true },
    });

    if (!workspace) {
      return {
        success: false,
        error: "Workspace not found",
      };
    }

    const stripeCustomerId = workspace.subscription?.stripeCustomerId
      ? workspace.subscription.stripeCustomerId
      : await getOrCreateStripeCustomer(workspaceId, user.email, workspace.name);

    const fallbackReturnUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/${workspaceId}/settings/billing`;
    const targetReturnUrl = returnUrl && returnUrl.trim().length > 0 ? returnUrl : fallbackReturnUrl;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: targetReturnUrl,
    });

    return {
      success: true,
      data: {
        portalUrl: portalSession.url,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to create Stripe Customer Portal session:", error);
    return {
      success: false,
      error: "Failed to open customer billing portal.",
    };
  }
}

/**
 * Retrieves the current Subscription record for a workspace.
 * Any workspace member (VIEWER or above) can query the subscription status.
 */
export async function getWorkspaceSubscriptionAction(
  workspaceId: string
): Promise<ActionResponse<Subscription | null>> {
  try {
    await requireWorkspaceAccess(workspaceId, "VIEWER");

    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
    });

    return {
      success: true,
      data: subscription,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return { success: false, error: error.message };
      }
    }
    console.error("Failed to get workspace subscription:", error);
    return {
      success: false,
      error: "Failed to retrieve subscription details",
    };
  }
}
