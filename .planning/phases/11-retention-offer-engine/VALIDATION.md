# Phase 11 Validation Plan

## 1. Automated Coverage

**Command:** `npx vitest run lib/services/__tests__/retention.service.test.ts`

| Requirement | Description | Test Case(s) |
|-------------|-------------|--------------|
| OFF-ENGINE-01 | Prisma models (RetentionOffer, RetentionOfferTrigger, RetentionOfferAcceptance, RetentionOfferType enum) | Verified by Plan 11-01 `npx prisma validate` + `npx prisma db push` |
| OFF-ENGINE-02 | resolveEligibleOffer returns highest-priority eligible offer, enforces maxUsesPerUser, cooldownDays, single-active-offer rule | Tests A, B, C, D, E |
| OFF-ENGINE-03 | applyDiscountOffer calls stripe.subscriptions.update with `discounts:[{coupon}]` array shape + Stripe Connect context | Test G |
| OFF-ENGINE-04 | applyPauseOffer reuses cancellation.service.pauseSubscription() — no direct Stripe call | Test J |
| OFF-ENGINE-05 | acceptOffer auto-reverses cancel_at_period_end to false for non-PAUSE offers when it was true | Test I |
| OFF-ENGINE-06 | Idempotency via surveyId — second call with same surveyId returns existing acceptance, accepted:false, no duplicate Stripe call | Test F |
| OFF-ENGINE-07 | Vitest suite with vi.mock('@/lib/prisma'), vi.mock('@/lib/stripe'), vi.mock('@/lib/services/cancellation.service') — all 10 tests pass | All tests (A-J) |

All 10 tests run in under 1 second (fully mocked, no DB or Stripe network calls).

**Detailed test coverage:**

| Test | Function | What is verified |
|------|----------|-----------------|
| A | resolveEligibleOffer | Returns null when reasonSlugs is empty |
| B | resolveEligibleOffer | Returns null when no CancellationReason rows match the given slugs |
| C | resolveEligibleOffer | Returns highest-priority offer when multiple candidates match (priority desc) |
| D | resolveEligibleOffer | Skips offer when acceptanceCount >= maxUsesPerUser and returns next eligible candidate |
| E | resolveEligibleOffer | Skips offer when user already has active non-expired acceptance (single-active-offer rule) |
| F | acceptOffer | Existing surveyId returns { accepted: false } without calling stripe.subscriptions.update (idempotency) |
| G | acceptOffer | DISCOUNT calls stripe.subscriptions.update with discounts:[{coupon:'cpn_x'}] and {stripeAccount:'acct_123'} (Connect context) |
| H | acceptOffer | expiresAt computed locally as now + durationMonths — NOT read from Stripe API response |
| I | acceptOffer | cancel_at_period_end:true is reversed → update called with {cancel_at_period_end:false}, cancelReversed:true returned |
| J | acceptOffer | PAUSE calls pauseSubscription with correct months; stripe.subscriptions.retrieve/update NOT called |

## 2. Test Commands

```bash
npx vitest run lib/services/__tests__/retention.service.test.ts
npx tsc --noEmit
```

## 3. Manual Stripe Test-Mode Verification

Stripe Connect and real coupon application cannot be verified in unit tests — they require a live Stripe test subscription.

**Steps:**
1. Create a test coupon in Stripe Dashboard (test mode): 50% off, duration=once. Note the coupon ID.
2. Insert a `RetentionOffer` row in DB: `offerType=DISCOUNT`, `stripeCouponId=<id from step 1>`, `isActive=true`, `priority=10`.
3. Insert a `RetentionOfferTrigger` row linking the offer to the "pris" `CancellationReason`.
4. As a test user with an active Stripe subscription, submit a `CancellationSurvey` with `primaryReason` slug = "pris".
5. Call `acceptOffer({ userId, entitlementId, surveyId, offerId })` — verify in Stripe Dashboard that the subscription shows the new discount applied.
6. Verify `cancel_at_period_end` is false in Stripe Dashboard if it was previously true.
7. Call `acceptOffer()` a second time with the same `surveyId` — verify the response contains `accepted:false` and no new Stripe call was made (check Stripe event log for absence of duplicate subscription.updated event).
8. Test PAUSE offer: create a `RetentionOffer` with `offerType=PAUSE`, `pauseMonths=2`. Call `acceptOffer()` — verify Stripe Dashboard shows subscription paused with correct `resumes_at` timestamp (approximately 2 months from now).

## 4. Out of Scope for Phase 11

- Multi-tenant organization scoping in `resolveEligibleOffer` (deferred to Phase 13 — currently all offers are platform-wide)
- Admin UI for creating and managing retention offers (Phase 13)
- UI for displaying offers to cancelling users and calling `acceptOffer` (Phase 12)
- Integration tests against real Stripe sandbox (manual verification only for now)
- Email/Resend notifications on offer acceptance (not part of retention engine scope)

## 5. Requirement to Validation Mapping

| Req | Automated | Manual |
|-----|-----------|--------|
| OFF-ENGINE-01 | `npx tsc --noEmit` validates Prisma type usage | `npx prisma validate` + DB table inspection after db push |
| OFF-ENGINE-02 | Tests A, B, C, D, E — eligibility algorithm | Call resolveEligibleOffer via server action in Phase 12 cancel flow |
| OFF-ENGINE-03 | Test G — discounts array shape + Connect account assertion | Stripe Dashboard: subscription shows coupon applied after acceptOffer() |
| OFF-ENGINE-04 | Test J — pauseSubscription mock called with correct months | Stripe Dashboard: subscription paused with correct resumes_at |
| OFF-ENGINE-05 | Test I — cancel_at_period_end:false assertion | Stripe Dashboard: cancel schedule cleared after acceptOffer() |
| OFF-ENGINE-06 | Test F — second call returns accepted:false, update not called | Stripe event log: no duplicate subscription.updated on second acceptOffer() call |
| OFF-ENGINE-07 | All tests A-J pass with vi.mock pattern | CI pipeline: vitest run exits 0 |
