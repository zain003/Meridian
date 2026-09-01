# FEAT-007-VERIFY-billing — P1

## Files Being Verified
- `FEAT-007-BE-stripe-billing.md`
- `FEAT-007-INT-stripe-webhooks.md`
- `FEAT-007-FE-billing-portal.md`

## 1. Automated Test Execution

Run the automated test suite and record outcomes:

- [ ] `vitest run tests/unit/stripe-billing.test.ts` — Pass / Fail
  - `getOrCreateStripeCustomer`: Creates customer and updates database.
  - `createStripeCheckoutSessionAction`: Generates checkout session with correct workspace metadata.
  - Non-owner users blocked from creating checkout sessions.
  - `createStripeCustomerPortalAction`: Generates portal URL for existing customer.
- [ ] `vitest run tests/integration/stripe-webhooks.test.ts` — Pass / Fail
  - Validates `stripe-signature` header; rejects invalid signatures.
  - `checkout.session.completed`: Sets tier to PRO and status to ACTIVE.
  - `customer.subscription.deleted`: Reverts tier to FREE.
- [ ] `vitest run tests/components/billing-portal.test.tsx` — Pass / Fail
  - Renders current subscription status card.
  - Upgrade and Manage buttons trigger redirect actions.

## 2. Acceptance Criteria Verification

Individually verify each criterion against the live running environment:

- [ ] Requests with invalid Stripe signatures return HTTP 400 Bad Request.
- [ ] Completing a Checkout session updates the workspace tier from `FREE` to `PRO` in the database.
- [ ] Free workspaces display the "Upgrade to Pro" CTA with Pro feature list.
- [ ] Clicking "Upgrade to Pro" redirects to Stripe Checkout with valid session token.
- [ ] Active Pro workspaces display "Manage Subscription" CTA which redirects to Stripe Customer Portal.
- [ ] Non-owner members see current tier but cannot click upgrade or manage billing buttons.

## 3. Definition of Done Confirmation

- [ ] All unit, integration, and component tests pass without errors.
- [ ] `tsc --noEmit` passes with zero type errors.
- [ ] `npm run lint` passes with no warnings.
- [ ] Webhook signature verification verified with simulated test events.
- [ ] `DEVIATIONS.md` updated if applicable.

## 4. Verification Verdict
- [ ] **PASSED**: All criteria and tests verified. Update `INDEX.md` status to `Completed`.
- [ ] **FAILED**: Provide failure details below and return to the corresponding file for remediation.

*Failure Notes (if any):*
- None.
