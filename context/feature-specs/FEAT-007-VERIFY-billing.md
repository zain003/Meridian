# FEAT-007-VERIFY-billing — P1

## Files Being Verified
- `FEAT-007-BE-stripe-billing.md`
- `FEAT-007-INT-stripe-webhooks.md`
- `FEAT-007-FE-billing-portal.md`

## 1. Automated Test Execution

Run the automated test suite and record outcomes:

- [x] `vitest run tests/unit/stripe-billing.test.ts` — Pass (13/13 Passed)
  - `getOrCreateStripeCustomer`: Creates customer and updates database.
  - `createStripeCheckoutSessionAction`: Generates checkout session with correct workspace metadata.
  - Non-owner users blocked from creating checkout sessions.
  - `createStripeCustomerPortalAction`: Generates portal URL for existing customer.
- [x] `vitest run tests/integration/stripe-webhooks.test.ts` — Pass (10/10 Passed)
  - Validates `stripe-signature` header; rejects invalid signatures.
  - `checkout.session.completed`: Sets tier to PRO and status to ACTIVE.
  - `customer.subscription.deleted`: Reverts tier to FREE.
- [x] `vitest run tests/components/billing-portal.test.tsx` — Pass (9/9 Passed)
  - Renders current subscription status card.
  - Upgrade and Manage buttons trigger redirect actions.

## 2. Acceptance Criteria Verification

Individually verify each criterion against the live running environment:

- [x] Requests with invalid Stripe signatures return HTTP 400 Bad Request.
- [x] Completing a Checkout session updates the workspace tier from `FREE` to `PRO` in the database.
- [x] Free workspaces display the "Upgrade to Pro" CTA with Pro feature list.
- [x] Clicking "Upgrade to Pro" redirects to Stripe Checkout with valid session token.
- [x] Active Pro workspaces display "Manage Subscription" CTA which redirects to Stripe Customer Portal.
- [x] Non-owner members see current tier but cannot click upgrade or manage billing buttons.

## 3. Definition of Done Confirmation

- [x] All unit, integration, and component tests pass without errors (39/39 Feature Tests, 307/307 Global Tests).
- [x] `tsc --noEmit` passes with zero type errors.
- [x] `npm run lint` passes with no warnings.
- [x] Webhook signature verification verified with simulated test events.
- [x] `DEVIATIONS.md` updated if applicable.

## 4. Verification Verdict
- [x] **PASSED**: All criteria and tests verified. Update `INDEX.md` status to `Completed`.
- [ ] **FAILED**: Provide failure details below and return to the corresponding file for remediation.

*Failure Notes (if any):*
- None.
