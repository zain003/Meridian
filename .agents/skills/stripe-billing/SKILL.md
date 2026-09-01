---
name: stripe-billing
description: >-
  Provides procedures and security guidelines for integrating Stripe subscription billing,
  Checkout sessions, Customer Portal, and raw webhook signature verification in Next.js 16.
  Use when implementing subscription tiers, Stripe webhook route handlers, or billing settings.
---

# Stripe Subscription Billing Skill

## Overview

Meridian integrates with **Stripe** for multi-tenant subscription tiers (Free vs Pro) using Stripe Checkout, Customer Portal, and cryptographically verified Webhooks.

## Architecture

- **Stripe Client Singleton**: `lib/stripe.ts` initializes `new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })`.
- **Webhook Route Handler**: `app/api/webhooks/stripe/route.ts` parses raw request text, validates `stripe-signature`, and updates subscription records.
- **Server Actions**: `server/actions/billing.ts` creates Checkout sessions and Customer Portal URLs.

## Webhook Signature Verification (Next.js 16 App Router)

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Missing Stripe webhook secret or signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      if (workspaceId) {
        await prisma.subscription.upsert({
          where: { workspaceId },
          update: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            tier: "PRO",
            status: "ACTIVE",
          },
          create: {
            workspaceId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            tier: "PRO",
            status: "ACTIVE",
          },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status === "active" ? "ACTIVE" : "CANCELED";
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status,
          tier: status === "ACTIVE" ? "PRO" : "FREE",
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
```

## Testing Webhooks Locally

Use the Stripe CLI to forward events to your local dev server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
