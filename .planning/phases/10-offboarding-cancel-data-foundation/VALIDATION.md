# Phase 10 Validation Plan

## 1. Automated Unit Tests (Vitest with mocks)

**Command:** `npx vitest run lib/services/__tests__/cancellation.service.test.ts`

**Coverage:**

| Test | Function | What is verified |
|------|----------|-----------------|
| A | cancelSubscription | Throws "Survey er ikke udfyldt" when no CancellationSurvey exists |
| B | cancelSubscription | Throws when entitlement.userId mismatch (IDOR guard) |
| C | cancelSubscription | Calls stripe.subscriptions.update with cancel_at_period_end:true; sets survey.cancelledAt; returns correct result shape |
| D | cancelSubscription | Idempotent: when cancel_at_period_end already true, does NOT re-call Stripe update |
| E | pauseSubscription | Calls Stripe with pause_collection.behavior=void and resumes_at as Unix seconds (not ms) for months=2 |
| F | pauseSubscription | Upserts CancellationSurvey with offeredPause=true and pauseAccepted=true |
| G | pauseSubscription | Runtime guard throws for invalid months value (e.g. 4) |
| H | listCancellations | Calls findMany with include: user, entitlement, primaryReason, tags.reason |
| I | listCancellations | Orders by submittedAt desc |

All 9 tests run in under 1 second (mocked, no DB or Stripe network calls).

## 2. Manual Stripe Test-Mode Verification

Stripe API calls cannot be verified in unit tests — they require a live Stripe test subscription.

**Steps:**
1. Create a test user and checkout with Stripe test card `4242 4242 4242 4242`
2. Note the resulting `stripeSubscriptionId` from the Entitlement row
3. Create a CancellationSurvey row manually (or via Phase 11 UI form)
4. Call `cancelSubscription({ userId, entitlementId })` via a temporary script or REPL
5. Verify in Stripe test dashboard: subscription shows "Cancel at period end" scheduled
6. Call `pauseSubscription({ userId, entitlementId, months: 2 })` on a fresh subscription
7. Verify in Stripe test dashboard: subscription shows "Paused" with correct `resumes_at` timestamp
8. Confirm `customer.subscription.updated` webhook fires but existing webhook handler ignores it (no duplicate DB writes)

## 3. Out of Scope for This Phase (Deferred to Phase 11 UAT)

- End-to-end user flow via `/dashboard/subscription/cancel` page
- Visual confirmation of hygge tone and illustrations
- Re-engagement email: explicitly NO email code in this milestone
- Admin dashboard GROUP BY reason slug (Phase 12)

## 4. Requirement to Validation Mapping

| Req | Automated | Manual |
|-----|-----------|--------|
| OFF-DATA-01 | Prisma type-check: `npx tsc --noEmit` validates CancellationSurvey type usage | DB row inspection after `prisma db push` |
| OFF-DATA-02 | `npx tsx prisma/seed.ts` runs idempotently (tested twice in Plan 10-01) | `SELECT * FROM "CancellationReason"` shows 7 rows |
| OFF-DATA-03 | Tests A, B, C, D in cancellation.service.test.ts | Stripe test-mode cancel round-trip (step 4-5 above) |
| OFF-DATA-04 | Tests E, F, G | Stripe dashboard shows paused subscription with correct resumes_at (step 6-7 above) |
| OFF-DATA-05 | Tests H, I (listCancellations include shape + order) | Query by tags to verify Phase 12 readiness |
