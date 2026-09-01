# FEAT-007-FE-billing-portal — P1

## Layer
Frontend

## Goal
Build the workspace billing and subscription settings page featuring Free vs Pro tier comparison cards, checkout triggers, and Stripe Customer Portal integration.

## Depends On
`FEAT-007-BE-stripe-billing.md`, `FEAT-007-INT-stripe-webhooks.md`

## Context Pack
```typescript
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
```

## Consumes
```typescript
export async function createStripeCheckoutSessionAction(input: { workspaceId: string; priceId: string; returnUrl: string }): Promise<ActionResponse<{ checkoutUrl: string }>>;
export async function createStripeCustomerPortalAction(workspaceId: string, returnUrl: string): Promise<ActionResponse<{ portalUrl: string }>>;
export async function getWorkspaceSubscriptionAction(workspaceId: string): Promise<ActionResponse<Subscription | null>>;
```

## Scope (In)
- Billing settings page at `app/(dashboard)/[workspaceId]/settings/billing/page.tsx`.
- Pricing tier comparison card (Free vs Pro) showing feature matrix (Unlimited rules, full velocity analytics, priority support).
- "Upgrade to Pro" button redirecting workspace owners to Stripe Checkout.
- "Manage Subscription & Invoices" button redirecting active subscribers to Stripe Customer Portal.
- Status badge indicating active plan (`FREE`, `PRO`, `PAST_DUE`).

## Scope (Out)
- In-app custom credit card input forms (Stripe Checkout handles hosted PCI-compliant payment entry).

## Tech / Files to Touch
- `app/(dashboard)/[workspaceId]/settings/billing/page.tsx` — Billing settings page (Next.js 16 Server Component).
- `components/billing/pricing-tier-card.tsx` — Plan comparison card (shadcn `Card`, `Button`, `Badge`, Lucide `Check`, `Zap`).
- `components/billing/subscription-status-card.tsx` — Current plan status and portal trigger (shadcn `Card`, `Badge`, Lucide `CreditCard`, `ExternalLink`).

## Tests to Write FIRST
1. `Billing Page Render`: Displays current plan tier (`FREE` or `PRO`) fetched via `getWorkspaceSubscriptionAction`.
2. `Upgrade Trigger`: Clicking "Upgrade to Pro" calls `createStripeCheckoutSessionAction` and initiates redirect.
3. `Customer Portal Trigger`: Clicking "Manage Subscription" calls `createStripeCustomerPortalAction` and opens portal.
4. `Non-Owner RBAC UI`: Hides upgrade/portal buttons and shows read-only badge for non-owners.

## Implementation Steps
1. Build `app/(dashboard)/[workspaceId]/settings/billing/page.tsx` as a Next.js 16 Server Component fetching subscription data.
2. Build `PricingTierCard` with shadcn `Card`, `Button`, feature checklists with Lucide `Check` icons, and pricing highlights ($12/user/month for Pro).
3. Build `SubscriptionStatusCard` using shadcn `Card` displaying renewal date, status `Badge`, and customer portal button with Lucide `ExternalLink`.
4. Wire client redirect actions to `createStripeCheckoutSessionAction` and `createStripeCustomerPortalAction`.
5. Add loading spinner (`Loader2`) to buttons during checkout URL generation.

## Acceptance Criteria
- [ ] Free workspaces display the "Upgrade to Pro" CTA with Pro feature list.
- [ ] Clicking "Upgrade to Pro" redirects to Stripe Checkout with valid session token.
- [ ] Active Pro workspaces display "Manage Subscription" CTA which redirects to Stripe Customer Portal.
- [ ] Non-owner members see current tier but cannot click upgrade or manage billing buttons.
- [ ] Design adheres to `ui-context.md` (cards, badges, buttons, typography).

## Definition of Done
- Component tests pass in Vitest.
- Visual design matches `context/UI/UI-Rules.md` and dark/light mode standards.
- `tsc --noEmit` passes with 0 errors.
- `DEVIATIONS.md` updated if applicable.

## Edge Cases to Handle
- Workspace with `PAST_DUE` subscription (display amber warning banner prompting payment update).
- Failed checkout cancellation (graceful return to billing page with informative alert).

## Pre-flight Check
Confirm `FEAT-007-INT-stripe-webhooks.md` is complete.

## What's Next
- `FEAT-007-VERIFY-billing.md`

## Ambiguity Resolution Protocol
If you encounter a case not covered by this spec:
1. Do NOT silently guess.
2. Make the smallest reasonable assumption needed to proceed.
3. Log it in `specs/DEVIATIONS.md` as: `FEAT-007-FE-billing-portal` — [what was ambiguous] — [assumption made].
4. Continue implementation; do not block unless it affects `000-shared-contracts.md`.
