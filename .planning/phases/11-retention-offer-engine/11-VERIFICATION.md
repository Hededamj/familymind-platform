---
phase: 11-retention-offer-engine
verified: 2026-04-06T22:02:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Stripe Connect live coupon application"
    expected: "After acceptOffer() in a real Stripe test-mode environment, the subscription shows the discount coupon applied and cancel_at_period_end reads false"
    why_human: "Unit tests mock stripe SDK — real Connect wire cannot be exercised without a live Stripe test subscription and credentials"
  - test: "PAUSE offer creates correct resumes_at in Stripe Dashboard"
    expected: "Subscription shows pause_collection.resumes_at approximately 2 months from now after PAUSE acceptOffer()"
    why_human: "pauseSubscription is mocked in tests; real Stripe side-effect requires dashboard inspection"
---

# Phase 11: Retention Offer Engine Verification Report

**Phase Goal:** Configurable retention engine with RetentionOffer/Trigger/Acceptance models, resolveEligibleOffer with abuse prevention (maxUses/cooldown), applyDiscountOffer with Stripe Connect context, applyPauseOffer reusing Phase 10, cancel_at_period_end reversal, idempotency via surveyId unique, Vitest unit tests.
**Verified:** 2026-04-06T22:02:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | RetentionOffer, RetentionOfferTrigger, RetentionOfferAcceptance exist in Prisma schema | VERIFIED | Lines 1010, 1042, 1054 in prisma/schema.prisma |
| 2 | RetentionOfferType enum has DISCOUNT, PAUSE, SUPPORT, CONTENT_HELP, NONE | VERIFIED | Lines 116-122 in prisma/schema.prisma — all 5 values present |
| 3 | RetentionOfferAcceptance.surveyId is @unique (idempotency anchor) | VERIFIED | Line 1057: `surveyId String @unique @db.Uuid` |
| 4 | resolveEligibleOffer and acceptOffer exported from retention.service.ts | VERIFIED | Lines 167 and 229 in lib/services/retention.service.ts |
| 5 | applyDiscountOffer uses discounts:[{coupon}] array shape | VERIFIED | Line 113: `{ discounts: [{ coupon: stripeCouponId }] }` |
| 6 | Stripe calls pass { stripeAccount: ... } for Connect orgs | VERIFIED | Lines 114, 148, 294: `stripeAccountId ? { stripeAccount: stripeAccountId } : undefined` |
| 7 | expiresAt computed locally (now + durationMonths), not from Stripe | VERIFIED | Lines 273-276: `expiresAt = new Date(); expiresAt.setMonth(...)` — no Stripe read for it |
| 8 | applyPauseOffer imports and calls cancellation.service.pauseSubscription | VERIFIED | Line 3 import + line 131 call in retention.service.ts |
| 9 | Idempotency: acceptOffer checks findUnique({ where: { surveyId } }) first | VERIFIED | Lines 233-243: findUnique on surveyId, returns accepted:false if found |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | Three new models + enum + inverse relations | VERIFIED | All models present, surveyId @unique, offerTriggers and retentionAcceptance inverse relations on parent models |
| `lib/services/retention.service.ts` | resolveEligibleOffer, acceptOffer, internal helpers | VERIFIED | 320 lines (min 180 required), both functions exported, all helpers present |
| `lib/services/__tests__/retention.service.test.ts` | 10 Vitest tests A-J with vi.mock | VERIFIED | 10 tests, vi.mock for prisma + stripe + cancellation.service |
| `.planning/phases/11-retention-offer-engine/VALIDATION.md` | 7 OFF-ENGINE-* requirements mapped | VERIFIED | 14 occurrences of OFF-ENGINE- pattern, all 7 IDs covered |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| RetentionOfferTrigger | RetentionOffer + CancellationReason | @@unique([offerId, cancellationReasonId]) | VERIFIED | Present at line ~1049 of schema.prisma |
| RetentionOfferAcceptance.surveyId | CancellationSurvey.id | @unique FK | VERIFIED | `surveyId String @unique @db.Uuid` + FK relation |
| retention.service.ts applyDiscountOffer | stripe.subscriptions.update | discounts array + Connect options | VERIFIED | Line 113: exact `discounts: [{ coupon: stripeCouponId }]` shape |
| retention.service.ts applyPauseOffer | cancellation.service.pauseSubscription | import + function call | VERIFIED | Line 3 import, line 131 call |
| retention.service.ts acceptOffer | prisma.retentionOfferAcceptance.findUnique | surveyId idempotency lookup | VERIFIED | Lines 233-234: `findUnique({ where: { surveyId } })` |
| retention.service.ts acceptOffer | stripe.subscriptions.update cancel_at_period_end:false | reverseCancelAtPeriodEnd | VERIFIED | Line 147: `{ cancel_at_period_end: false }` in reverseCancelAtPeriodEnd |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| retention.service.ts resolveEligibleOffer | candidates (RetentionOffer[]) | prisma.retentionOffer.findMany with trigger join | Yes — DB query with where/orderBy | FLOWING |
| retention.service.ts acceptOffer | existing (idempotency) | prisma.retentionOfferAcceptance.findUnique | Yes — DB lookup by surveyId | FLOWING |
| retention.service.ts applyDiscountOffer | coupon → Stripe | stripe.subscriptions.update with discounts array | Yes — real Stripe API call (mocked in tests) | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Vitest suite 10/10 GREEN | `npx vitest run lib/services/__tests__/retention.service.test.ts` | 10 passed (10), 482ms | PASS |
| TypeScript clean | `npx tsc --noEmit` | No output (exit 0) | PASS |
| VALIDATION.md has 7+ OFF-ENGINE refs | `grep -c "OFF-ENGINE-" VALIDATION.md` | 14 | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| OFF-ENGINE-01 | 11-01-PLAN.md | Prisma models — RetentionOffer, RetentionOfferTrigger, RetentionOfferAcceptance | SATISFIED | All 3 models in schema.prisma; enum with 5 values; surveyId @unique; inverse relations present |
| OFF-ENGINE-02 | 11-02-PLAN.md | resolveEligibleOffer with maxUsesPerUser, cooldownDays, single-active-offer | SATISFIED | Tests A-E pass; isOfferEligible enforces all three rules (lines 62-100 of service) |
| OFF-ENGINE-03 | 11-02-PLAN.md | applyDiscountOffer with discounts:[{coupon}] array shape + Connect context | SATISFIED | Line 113 uses array shape; line 114 passes stripeAccount; Test G asserts both |
| OFF-ENGINE-04 | 11-02-PLAN.md | applyPauseOffer reuses cancellation.service.pauseSubscription() | SATISFIED | Import line 3 + call line 131; Test J asserts pauseSubscription called with correct months |
| OFF-ENGINE-05 | 11-02-PLAN.md | Auto-reverse cancel_at_period_end for non-PAUSE offers | SATISFIED | Lines 287-300; Test I confirms update called with cancel_at_period_end:false |
| OFF-ENGINE-06 | 11-02-PLAN.md | Idempotency via surveyId unique | SATISFIED | @unique in schema + findUnique check at top of acceptOffer; Test F confirms no duplicate Stripe call |
| OFF-ENGINE-07 | 11-02-PLAN.md | Vitest unit tests with vi.mock | SATISFIED | 10/10 tests GREEN; all three vi.mock declarations present |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

Scanned retention.service.ts (320 lines) and retention.service.test.ts for TODOs, placeholder returns, empty handlers, hardcoded empty data. None found.

---

### Human Verification Required

#### 1. Stripe Connect Live Coupon Application

**Test:** With a real Stripe test-mode subscription and a Connect-enabled organization, call acceptOffer() for a DISCOUNT offer and inspect the Stripe Dashboard.
**Expected:** Subscription shows the discount coupon applied; no legacy `coupon` field used (discounts array visible); cancel_at_period_end reads false if it was previously true.
**Why human:** The Stripe SDK is mocked in all unit tests. Real Connect wire-through cannot be verified without live credentials and a test subscription.

#### 2. PAUSE Offer Stripe Side-Effect

**Test:** Call acceptOffer() for a PAUSE offer with pauseMonths=2 against a real test subscription. Inspect Stripe Dashboard.
**Expected:** Subscription shows `pause_collection.resumes_at` approximately 2 months from now; no cancel_at_period_end reversal attempted.
**Why human:** pauseSubscription is mocked in unit tests. Stripe Dashboard is the only way to confirm the correct resumes_at is set.

---

### Gaps Summary

No gaps. All must-haves verified. All 9 observable truths hold. All 4 artifacts exist and are substantive and wired. All 6 key links are verified. All 7 OFF-ENGINE-* requirements are satisfied. Vitest runs 10/10 GREEN. TypeScript is clean. VALIDATION.md maps every requirement.

Two items are routed to human verification because they require a live Stripe test environment — this is expected for a payment-integration phase and was called out in the VALIDATION.md from the start.

---

_Verified: 2026-04-06T22:02:00Z_
_Verifier: Claude (gsd-verifier)_
