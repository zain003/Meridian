import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-08-26.dahlia",
  typescript: true,
});

/**
 * Retrieves an existing Stripe Customer ID for a workspace or creates a new one in Stripe
 * and records it in the PostgreSQL Subscription table.
 */
export async function getOrCreateStripeCustomer(
  workspaceId: string,
  userEmail: string,
  workspaceName: string
): Promise<string> {
  const existingSubscription = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { stripeCustomerId: true },
  });

  if (existingSubscription?.stripeCustomerId) {
    return existingSubscription.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: userEmail,
    name: workspaceName,
    metadata: {
      workspaceId,
    },
  });

  await prisma.subscription.upsert({
    where: { workspaceId },
    update: {
      stripeCustomerId: customer.id,
    },
    create: {
      workspaceId,
      stripeCustomerId: customer.id,
      tier: "FREE",
      status: "ACTIVE",
    },
  });

  return customer.id;
}
