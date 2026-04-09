---
phase: 11-retention-offer-engine
plan: 02
subsystem: service
tags: [retention, stripe, vitest, tdd, connect]

# Dependency graph
requires:
  - phase: 11-retention-offer-engine
    plan: 01
    provides: RetentionOffer, RetentionOfferTrigger, RetentionOfferAcceptance Prisma models

provides:
  - resolveEligibleOffer(userId, reasonSlugs) — highest-priority eligible offer or null
  - acceptOffer(input) — idempotent offer acceptance with Stripe side-effects
  - Internal: isOfferEligible, applyDiscountOffer, applyPauseOffer, reverseCancelAtPeriodEnd, resolveStripeAccountId

affects:
  - 12-cancel-flow-ui (Phase 12 calls acceptOffer from server action)
  - 13-admin-ui (Phase 13 will use resolveEligibleOffer for offer preview)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "discounts:[{coupon:'id'}] array shape for Stripe subscription update (not legacy string)"
    - "stripeAccountId ? { stripeAccount: stripeAccountId } : undefined — Connect context pattern mirroring checkout.service.ts"
    - "expiresAt computed locally via setMonth — not read from Stripe API response"
    - "surveyId @unique as idempotency anchor — findUnique at top of acceptOffer, return existing early"
    - "PAUSE offer delegates entirely to cancellation.service.pauseSubscription (no direct Stripe call in retention service)"
    - "vi.mock + (fn as any).mockReturnValue pattern for typed Stripe mock in Vitest"

key-files:
  created:
    - lib/services/retention.service.ts
    - lib/services/__tests__/retention.service.test.ts
    - .planning/phases/11-retention-offer-engine/VALIDATION.md
  modified: []

key-decisions:
  - "Connect context passed as third arg to stripe.subscriptions.update using stripeAccountId ? { stripeAccount } : undefined — matches checkout.service.ts pattern exactly"
  - "expiresAt for DISCOUNT offers computed with setMonth(now + durationMonths) locally — not read from Stripe, avoids extra API call and works in unit tests"
  - "PAUSE offer skips cancel_at_period_end reversal branch entirely — pauseSubscription handles its own Stripe state via pause_collection"
  - "resolveEligibleOffer has NO organizationId filter — platform-wide offers visible to all users; multi-tenant scoping deferred to Phase 13"
  - "applyPauseOffer accepts _surveyId/_offerId params (prefixed underscore) for interface compatibility without passing to pauseSubscription"

# Metrics
duration: 15min
completed: 2026-04-09
---

# Phase 11 Plan 02: Retention Service Implementation Summary

**TDD cycle: 10 Vitest tests RED → GREEN — retention.service.ts with resolveEligibleOffer, acceptOffer, Connect context, idempotency, and PAUSE reuse via cancellation.service**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-09T19:54:40Z
- **Completed:** 2026-04-09T20:00:00Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- Task 1 (RED): Wrote 10 failing Vitest tests (A-J) covering all OFF-ENGINE-02 through OFF-ENGINE-07 requirements. Tests fail with "Cannot find module" — correct RED state.
- Task 2 (GREEN): Implemented `lib/services/retention.service.ts` (261 lines). All 10 tests pass. TypeScript clean.
- Task 3 (DOCS): Created `VALIDATION.md` mapping all 7 OFF-ENGINE-* requirements to specific test cases plus manual Stripe verification steps.

## Task Commits

1. **Task 1 (RED): Failing Vitest suite** - `86df367` (test)
2. **Task 2 (GREEN): retention.service.ts implementation** - `41ea6bc` (feat)
3. **Task 3: VALIDATION.md** - `b2f1548` (docs)

## Files Created

- `lib/services/retention.service.ts` — exports `resolveEligibleOffer`, `acceptOffer`; internal helpers `isOfferEligible`, `applyDiscountOffer`, `applyPauseOffer`, `reverseCancelAtPeriodEnd`, `resolveStripeAccountId`
- `lib/services/__tests__/retention.service.test.ts` — 10 Vitest tests with vi.mock for prisma, stripe, cancellation.service
- `.planning/phases/11-retention-offer-engine/VALIDATION.md` — 7 OFF-ENGINE-* mappings + manual Stripe steps

## Decisions Made

- **Connect context pattern:** `stripeAccountId ? { stripeAccount: stripeAccountId } : undefined` passed as third arg to `stripe.subscriptions.update` — matches `checkout.service.ts` pattern exactly. Enables per-tenant Stripe Connect routing without breaking platform-default flows.
- **Local expiresAt computation:** `new Date(); setMonth(now + durationMonths)` — not read from Stripe API response. Avoids an extra retrieve call, works in unit tests without mocking return shapes, and is correct because we set the discount duration ourselves.
- **PAUSE skips cancel reversal:** The cancel_at_period_end reversal branch is gated on `offer.offerType !== 'PAUSE'`. Pause offers set their own Stripe state via `pause_collection` — reversing cancel_at_period_end would conflict with that intent.
- **No organizationId filter in resolveEligibleOffer:** Platform-wide offers (organizationId=null) visible to all users. Multi-tenant isolation is a Phase 13 concern. Keeping it simple now avoids premature complexity with a single-tenant deployment.
- **applyPauseOffer signature:** Accepts `_surveyId` and `_offerId` with underscore prefix — retained for future use (e.g., linking pause directly to survey) but not passed to `pauseSubscription` which has its own IDOR guard.

## Deviations from Plan

**1. [Rule 1 - Bug] TypeScript error in test file — `ReturnType<typeof vi.fn>` not callable**
- **Found during:** Task 2 GREEN phase, `npx tsc --noEmit`
- **Issue:** `(getStripe as ReturnType<typeof vi.fn>)()` triggered TS2348 "Value of type Mock is not callable. Did you mean to include 'new'?" — Vitest's `Mock` type is typed as `Procedure | Constructable` and the cast confused tsc.
- **Fix:** Changed both occurrences to `(getStripe as any)()` and `(getStripe as any).mockReturnValue(...)` with eslint-disable comment.
- **Files modified:** `lib/services/__tests__/retention.service.test.ts`
- **Impact:** None — tests still pass, TypeScript exits 0.

## Known Stubs

None — all service functions are fully implemented with real Prisma and Stripe calls. No hardcoded empty values or placeholder data flows to any consumer.

## Self-Check: PASSED

- FOUND: lib/services/retention.service.ts
- FOUND: lib/services/__tests__/retention.service.test.ts
- FOUND: .planning/phases/11-retention-offer-engine/VALIDATION.md
- FOUND: commits 86df367, 41ea6bc, b2f1548
