---
phase: 11-retention-offer-engine
plan: 01
subsystem: database
tags: [prisma, postgres, retention, offers, cancellation]

# Dependency graph
requires:
  - phase: 10-cancellation-flow
    provides: CancellationSurvey and CancellationReason models that receive inverse relations

provides:
  - RetentionOfferType enum (DISCOUNT, PAUSE, SUPPORT, CONTENT_HELP, NONE)
  - RetentionOffer model — offer templates with type-specific nullable fields, priority, and cooldown controls
  - RetentionOfferTrigger join table — maps reasons to offers with @@unique([offerId, cancellationReasonId])
  - RetentionOfferAcceptance model — acceptance ledger with surveyId @unique idempotency anchor
  - Inverse relation retentionAcceptance on CancellationSurvey
  - Inverse relation offerTriggers on CancellationReason

affects:
  - 11-retention-offer-engine (plans 02+)
  - 13-admin-ui (will need RetentionOffer CRUD)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "surveyId @unique as idempotency anchor — ensures at most one acceptance per cancellation survey"
    - "Nullable organizationId on offer — null = platform-wide default, non-null = tenant-scoped"
    - "Type-specific nullable columns (not JSON) — explicit TypeScript types, simpler admin UI validation"

key-files:
  created: []
  modified:
    - prisma/schema.prisma

key-decisions:
  - "organizationId nullable on RetentionOffer so platform-wide defaults work without a Connect org"
  - "priority on the offer itself (not the trigger) so rank is consistent regardless of which reason triggered it"
  - "surveyId @unique enforces idempotency: second acceptOffer() call finds existing row, no duplicate Stripe calls"
  - "Type-specific fields as nullable columns not JSON blob: cleaner queries, explicit TS types, per-type admin validation"

patterns-established:
  - "Idempotency via @unique FK: use surveyId as anchor for acceptance records"
  - "db push (not migrate dev) for Supabase schema drift — established Phase 7, followed here"

requirements-completed: [OFF-ENGINE-01]

# Metrics
duration: 8min
completed: 2026-04-06
---

# Phase 11 Plan 01: Retention Offer Engine Schema Summary

**Prisma schema extended with RetentionOfferType enum, three retention offer models, and inverse relations on CancellationSurvey/CancellationReason — database tables created via db push**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-06T00:00:00Z
- **Completed:** 2026-04-06T00:08:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `RetentionOfferType` enum with five values (DISCOUNT, PAUSE, SUPPORT, CONTENT_HELP, NONE) in the enum section before models
- Added `RetentionOffer`, `RetentionOfferTrigger`, and `RetentionOfferAcceptance` models with full indexes and relations
- Wired inverse relations onto existing `CancellationSurvey.retentionAcceptance` and `CancellationReason.offerTriggers`
- `npx prisma db push` succeeded — three new tables created in Supabase with no drift errors
- `npx tsc --noEmit` exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Add RetentionOfferType enum + three models + inverse relations** - `2c49aa4` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `prisma/schema.prisma` - Added enum + 3 models + inverse relations on CancellationSurvey and CancellationReason

## Decisions Made

- `organizationId` is nullable on `RetentionOffer` — null means platform-wide default, non-null scopes to a Connect tenant. This lets FamilyMind's own default offers work without requiring an org record.
- `priority` lives on the offer (not the trigger) so the same offer keeps its display rank regardless of which reason triggered it.
- `surveyId @unique` on `RetentionOfferAcceptance` is the idempotency anchor — the second call to `acceptOffer({ surveyId })` finds the existing row and returns it without any Stripe side-effects.
- Type-specific fields (stripeCouponId, pauseMonths, supportUrl, contentUrl, etc.) are nullable columns, not a JSON blob, for cleaner queries and explicit TypeScript types.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Tables were created automatically via `prisma db push`.

## Next Phase Readiness

- Prisma Client now exports `RetentionOffer`, `RetentionOfferTrigger`, `RetentionOfferAcceptance`, and `RetentionOfferType` — ready for Plan 11-02 service functions
- All Phase 11 service functions (`getEligibleOffers`, `acceptOffer`, `getAcceptedOffer`) can now import and query these types
- No blockers

---
*Phase: 11-retention-offer-engine*
*Completed: 2026-04-06*
