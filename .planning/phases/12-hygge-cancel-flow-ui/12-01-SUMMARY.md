---
phase: 12-hygge-cancel-flow-ui
plan: 01
subsystem: payments
tags: [prisma, stripe, server-actions, cancellation, retention]

requires:
  - phase: 11-retention-offer-engine
    provides: cancelSubscription, resolveEligibleOffer, acceptOffer services

provides:
  - Cancel entry link at /dashboard/settings (inside active entitlement branch)
  - app/dashboard/subscription/cancel/actions.ts with three typed server actions
  - submitSurveyAndResolveOffer: survey upsert + retention offer resolution
  - acceptOfferAction: offer acceptance with PAUSE pauseMonths override
  - confirmCancelAction: skip-path survey-gate upsert + cancelSubscription

affects:
  - 12-02 (CancelFlowWizard client component calls these three actions)
  - 12-03 (OfferCard client component calls acceptOfferAction)

tech-stack:
  added: []
  patterns:
    - "Server actions upsert survey before cancelSubscription to satisfy OFF-DATA-03 gate"
    - "IDOR guard on every server action via requireAuth() + prisma entitlement ownership check"
    - "Empty-update upsert pattern for skip-path: update:{} preserves existing survey fields"

key-files:
  created:
    - app/dashboard/subscription/cancel/actions.ts
  modified:
    - app/dashboard/settings/page.tsx

key-decisions:
  - "Use upsert update:{} (empty) in confirmCancelAction so skip-path creates minimal survey without overwriting a full survey from Step 1"
  - "Tag replacement in submitSurveyAndResolveOffer uses nested deleteMany+create inside upsert.update (single atomic operation)"
  - "pauseMonths override in acceptOfferAction mutates the offer row as a pragmatic workaround; TODO(phase-13) to pass through acceptOffer input"
  - "No revalidatePath in actions — Plan 12-02 client components own navigation and revalidation"

patterns-established:
  - "Cancel flow actions: no try/catch — errors propagate to client for display"
  - "Survey-gate workaround: upsert with empty update before cancelSubscription"

requirements-completed: [OFF-UI-01]

duration: 12min
completed: 2026-04-06
---

# Phase 12 Plan 01: Entry Link + Server Actions Summary

**Three typed Next.js server actions for the cancel flow (survey upsert, offer acceptance, confirm cancel) wired to existing cancellation and retention services, plus the settings page entry link**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-06T00:00:00Z
- **Completed:** 2026-04-06T00:12:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added "Opsig abonnement" link below ManageSubscriptionButton on /dashboard/settings (visible only for active entitlements)
- Created `app/dashboard/subscription/cancel/actions.ts` with `submitSurveyAndResolveOffer`, `acceptOfferAction`, `confirmCancelAction`
- Implemented skip-path survey-gate upsert so `confirmCancelAction` works with or without a prior survey submission
- All three actions use `requireAuth()` + entitlement IDOR guard; TypeScript compiles clean

## Task Commits

1. **Task 1: Add Opsig abonnement link to settings page** - `c89fe7e` (feat)
2. **Task 2: Create cancel-flow server actions** - `6d6e0e1` (feat)

## Files Created/Modified

- `app/dashboard/settings/page.tsx` - Cancel entry link added inside activeCount > 0 branch
- `app/dashboard/subscription/cancel/actions.ts` - Three server actions as the stable API contract for Plans 12-02/12-03

## Decisions Made

- Empty `update: {}` in `confirmCancelAction` upsert preserves full survey data if Step 1 was completed, while satisfying the survey gate for the skip-path. This is the exact pattern mandated by the plan's CRITICAL note.
- Tags replaced atomically in `submitSurveyAndResolveOffer` via nested `deleteMany: {} + create: [...]` — simpler and transactionally safe compared to a separate `deleteMany` + `createMany` outside the upsert.
- `acceptOfferAction` patches the `RetentionOffer.pauseMonths` row only when the offer type is PAUSE and the value actually differs, minimising unintended side effects.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Stable server action signatures are published; Plans 12-02 (CancelFlowWizard) and 12-03 (OfferCard) can now build client components against these contracts.
- No blockers.

---
*Phase: 12-hygge-cancel-flow-ui*
*Completed: 2026-04-06*
