import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { SubscriptionStatus, SubscriptionTier } from "@prisma/client";

/**
 * Handles incoming verified Stripe webhook events and synchronizes subscription
 * records in PostgreSQL.
 */
export async function handleStripeWebhookEvent(
  event: Stripe.Event
): Promise<{ handled: boolean; workspaceId?: string }> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      let workspaceId = session.metadata?.workspaceId;
      const stripeCustomerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      const stripeSubscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!stripeCustomerId) {
        return { handled: false };
      }

      // If workspaceId was not in metadata, attempt fallback lookup by stripeCustomerId
      if (!workspaceId) {
        const existing = await prisma.subscription.findUnique({
          where: { stripeCustomerId },
          select: { workspaceId: true },
        });
        if (existing) {
          workspaceId = existing.workspaceId;
        }
      }

      if (!workspaceId) {
        console.warn(
          `[Stripe Webhook] checkout.session.completed: Unable to resolve workspaceId for customer ${stripeCustomerId}`
        );
        return { handled: false };
      }

      await prisma.subscription.upsert({
        where: { workspaceId },
        update: {
          stripeCustomerId,
          ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
          tier: "PRO",
          status: "ACTIVE",
        },
        create: {
          workspaceId,
          stripeCustomerId,
          stripeSubscriptionId: stripeSubscriptionId || null,
          tier: "PRO",
          status: "ACTIVE",
        },
      });

      return { handled: true, workspaceId };
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
      const workspaceId = subscription.metadata?.workspaceId;

      let mappedStatus: SubscriptionStatus = "ACTIVE";
      if (subscription.status === "active") mappedStatus = "ACTIVE";
      else if (subscription.status === "past_due") mappedStatus = "PAST_DUE";
      else if (subscription.status === "canceled") mappedStatus = "CANCELED";
      else if (subscription.status === "trialing") mappedStatus = "TRIALING";
      else if (subscription.status === "unpaid") mappedStatus = "UNPAID";
      else if (subscription.status === "incomplete") mappedStatus = "INCOMPLETE";

      const mappedTier: SubscriptionTier =
        mappedStatus === "ACTIVE" || mappedStatus === "TRIALING"
          ? "PRO"
          : "FREE";

      const periodEndSeconds = (subscription as unknown as { current_period_end?: number })
        .current_period_end;
      const currentPeriodEnd = periodEndSeconds
        ? new Date(periodEndSeconds * 1000)
        : undefined;

      const stripePriceId = subscription.items?.data?.[0]?.price?.id;

      await prisma.subscription.updateMany({
        where: {
          OR: [
            { stripeSubscriptionId: subscription.id },
            ...(stripeCustomerId ? [{ stripeCustomerId }] : []),
            ...(workspaceId ? [{ workspaceId }] : []),
          ],
        },
        data: {
          status: mappedStatus,
          tier: mappedTier,
          stripeSubscriptionId: subscription.id,
          ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
          ...(stripePriceId ? { stripePriceId } : {}),
        },
      });

      return { handled: true, workspaceId };
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
      const workspaceId = subscription.metadata?.workspaceId;

      await prisma.subscription.updateMany({
        where: {
          OR: [
            { stripeSubscriptionId: subscription.id },
            ...(stripeCustomerId ? [{ stripeCustomerId }] : []),
            ...(workspaceId ? [{ workspaceId }] : []),
          ],
        },
        data: {
          tier: "FREE",
          status: "CANCELED",
        },
      });

      return { handled: true, workspaceId };
    }

    default:
      return { handled: false };
  }
}
