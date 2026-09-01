# FEAT-007-BE-stripe-billing — P1

## Layer
Backend

## Goal
Implement Stripe integration helpers: Customer creation, Stripe Checkout session generator for Pro upgrades, and Stripe Customer Portal session generator.

## Depends On
`000-shared-contracts.md`, `FEAT-001-VERIFY-auth-workspace.md`

## Context Pack
```typescript
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
```

## Provides / Exposes
```typescript
export interface CreateCheckoutSessionInput {
  workspaceId: string;
  priceId: string;
  returnUrl: string;
}

export async function getOrCreateStripeCustomer(
  workspaceId: string,
  userEmail: string,
  workspaceName: string
): Promise<string>;

export async function createStripeCheckoutSessionAction(
  input: CreateCheckoutSessionInput
): Promise<ActionResponse<{ checkoutUrl: string }>>;

export async function createStripeCustomerPortalAction(
  workspaceId: string,
  returnUrl: string
): Promise<ActionResponse<{ portalUrl: string }>>;

export async function getWorkspaceSubscriptionAction(
  workspaceId: string
): Promise<ActionResponse<Subscription | null>>;
```

## Scope (In)
- Stripe SDK initialization in `lib/stripe.ts`.
- Automatically creating or retrieving Stripe Customer associated with a `Workspace`.
- Generating Stripe Checkout Session URLs for upgrading from Free Tier to Pro Tier.
- Generating Stripe Customer Portal URLs for billing management and cancellations.
- Workspace Owner RBAC check before initiating any billing checkout or portal session.

## Scope (Out)
- Webhook signature verification and database sync (handled in `FEAT-007-INT-stripe-webhooks.md`).
- Front-end billing settings UI (handled in `FEAT-007-FE-billing-portal.md`).

## Tech / Files to Touch
- `lib/stripe.ts` — Stripe SDK client singleton.
- `server/actions/billing.ts` — Billing Server Actions.
- `lib/validations/billing.ts` — Zod schemas for checkout parameters.

## Tests to Write FIRST
1. `getOrCreateStripeCustomer`: Creates Stripe customer and saves `stripeCustomerId` in `Subscription` table.
2. `createStripeCheckoutSessionAction`: Generates valid Checkout session URL for workspace owner.
3. `createStripeCheckoutSessionAction RBAC`: Rejects non-owner workspace members with `FORBIDDEN`.
4. `createStripeCustomerPortalAction`: Returns billing portal URL for customer with existing Stripe ID.

## Implementation Steps
1. Configure Stripe SDK singleton in `lib/stripe.ts` using `STRIPE_SECRET_KEY`.
2. Implement `getOrCreateStripeCustomer` checking for existing `Subscription` record or creating a new customer in Stripe.
3. Implement `createStripeCheckoutSessionAction` in `server/actions/billing.ts` setting `metadata.workspaceId`.
4. Implement `createStripeCustomerPortalAction` returning self-serve billing portal redirect URL.
5. Implement `getWorkspaceSubscriptionAction` returning current tier and subscription status.

## Acceptance Criteria
- [ ] Non-owner users cannot initiate Checkout or open the Billing Portal.
- [ ] Creating a checkout session includes `workspaceId` in Stripe metadata for webhook association.
- [ ] Checkout session redirects to `returnUrl` on success/cancel.
- [ ] Customer Portal session allows managing payment methods and subscription tiers.

## Definition of Done
- All 4 unit tests pass in Vitest.
- Strict TypeScript typecheck passes (`tsc --noEmit`).
- No live Stripe secret keys in code; uses `STRIPE_SECRET_KEY` env var.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Workspace with already active Pro subscription attempting new checkout (redirect to Customer Portal instead).
- Stripe API temporary downtime (return structured error with user-friendly message).
- Missing return URL (fallback to workspace settings page).

## Pre-flight Check
Confirm `FEAT-001-VERIFY-auth-workspace.md` passed.

## What's Next
- `FEAT-007-INT-stripe-webhooks.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-007-BE-stripe-billing` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
