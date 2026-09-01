# FEAT-007-INT-stripe-webhooks — P1

## Layer
Integration

## Goal
Implement the Stripe Webhook HTTP Route Handler with raw cryptographic signature verification to synchronize subscription status and tier entitlements in PostgreSQL.

## Depends On
`FEAT-007-BE-stripe-billing.md`

## Context Pack
```typescript
export type SubscriptionTier = "FREE" | "PRO";
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "CANCELED" | "INCOMPLETE" | "PAST_DUE" | "UNPAID";
```

## Consumes
```typescript
export const stripe: Stripe;
```

## Provides / Exposes
```typescript
export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<{
  handled: boolean;
  workspaceId?: string;
}>;
```

## Scope (In)
- Secure HTTP Route Handler at `app/api/webhooks/stripe/route.ts`.
- Raw body stream parsing and cryptographic signature verification against `STRIPE_WEBHOOK_SECRET`.
- Handlers for Stripe events:
  - `checkout.session.completed`: Upgrade workspace to `PRO` tier, store `stripeSubscriptionId` and `currentPeriodEnd`.
  - `customer.subscription.updated`: Update status (`ACTIVE`, `PAST_DUE`, `CANCELED`) and renew billing cycle.
  - `customer.subscription.deleted`: Downgrade workspace back to `FREE` tier.
- Idempotent event processing to prevent duplicate processing of re-sent webhooks.

## Scope (Out)
- User-facing UI billing settings (handled in `FEAT-007-FE-billing-portal.md`).

## Tech / Files to Touch
- `app/api/webhooks/stripe/route.ts` — Webhook route handler.
- `lib/stripe/webhook-handlers.ts` — Modular event handlers.

## Tests to Write FIRST
1. `Webhook Signature Validation`: Validates `stripe-signature` header; rejects invalid signature with HTTP 400.
2. `checkout.session.completed`: Updates target workspace subscription to `tier: "PRO"` and `status: "ACTIVE"`.
3. `customer.subscription.deleted`: Reverts workspace subscription to `tier: "FREE"` and `status: "CANCELED"`.
4. `Idempotent handling`: Re-processing an identical event does not cause DB constraint violations.

## Implementation Steps
1. Build `app/api/webhooks/stripe/route.ts` reading raw request body text and verifying signature with `stripe.webhooks.constructEvent`.
2. Implement `handleStripeWebhookEvent` in `lib/stripe/webhook-handlers.ts` with event type switch statement.
3. Handle `checkout.session.completed` reading `session.metadata.workspaceId` and updating Prisma `Subscription`.
4. Handle `customer.subscription.updated` mapping Stripe status to `SubscriptionStatus` enum.
5. Handle `customer.subscription.deleted` setting `tier: "FREE"`.
6. Return HTTP 200 `{ received: true }` upon successful processing.

## Acceptance Criteria
- [ ] Requests with invalid Stripe signatures return HTTP 400 Bad Request.
- [ ] Completing a Checkout session updates the workspace tier from `FREE` to `PRO` in the database.
- [ ] Canceling a subscription in Stripe triggers webhook that sets tier to `FREE` upon period expiration.
- [ ] Webhook route handles unhandled event types with HTTP 200 without throwing errors.

## Definition of Done
- Integration tests pass in Vitest.
- Strict TypeScript typecheck passes (`tsc --noEmit`).
- No mutation runs if webhook signature fails verification.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Webhook arrives before Checkout return redirect finishes.
- Missing `workspaceId` metadata (lookup subscription via `stripeCustomerId`).
- Stripe test-clock events and out-of-order webhook delivery.

## Pre-flight Check
Confirm `FEAT-007-BE-stripe-billing.md` is complete.

## What's Next
- `FEAT-007-FE-billing-portal.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-007-INT-stripe-webhooks` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
