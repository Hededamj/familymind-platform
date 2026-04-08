---
phase: 10-offboarding-cancel-data-foundation
plan: 01
subsystem: database
tags: [prisma, postgres, schema, seed, cancellation, offboarding]

# Dependency graph
requires:
  - phase: 07-kursus-data-layer-savedcontent
    provides: prisma db push pattern for Supabase drift; established upsert seed style
provides:
  - CancellationSurvey model with @@unique([userId, entitlementId]) IDOR-safe compound key
  - CancellationReason lookup table with 7 seeded Danish reason slugs
  - CancellationSurveyTag join table mirroring ContentUnitTag pattern
  - User.cancellationSurveys and Entitlement.cancellationSurvey inverse relations
  - Prisma client types for all three new models
affects:
  - 10-02 (service layer imports CancellationSurvey types and queries)
  - Phase 11 (UI reads cancellationReason rows for dropdown options)
  - Phase 12 (admin dashboard GROUP BY reason slug)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CancellationReason as lookup table with slug (stable) + label (changeable)
    - CancellationSurveyTag join table with @@id([surveyId, reasonId]) mirrors ContentUnitTag
    - entitlementId @unique enables one-to-one Entitlement.cancellationSurvey relation
    - @@unique([userId, entitlementId]) compound key embeds ownership for IDOR-safe findUnique

key-files:
  created: []
  modified:
    - prisma/schema.prisma
    - prisma/seed.ts

key-decisions:
  - "entitlementId is @unique (not just part of @@unique) because Prisma one-to-one relations require a standalone unique on the FK side"
  - "NO webhookSentAt field — scope decision excludes Zapier/outbound webhooks entirely from this phase"
  - "Seed uses upsert by slug so it is idempotent and slugs remain stable identifiers even if labels change"
  - "prisma db push used (not migrate dev) due to known Supabase schema drift — consistent with Phase 7"

patterns-established:
  - "Lookup table pattern: slug @unique for stable identity, label for display — mirrors ContentTag"
  - "Join table with @@id([a, b]) for many-to-many cancellation tags — mirrors ContentUnitTag"

requirements-completed: [OFF-DATA-01, OFF-DATA-02]

# Metrics
duration: 12min
completed: 2026-04-08
---

# Phase 10 Plan 01: Offboarding Cancel Data Foundation Summary

**Prisma schema foundation for in-app cancellation surveys: three new models (CancellationSurvey, CancellationReason, CancellationSurveyTag) applied to Supabase via db push, with 7 Danish reason rows seeded idempotently**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-08T20:12:24Z
- **Completed:** 2026-04-08T20:24:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added three new models to prisma/schema.prisma: CancellationReason (lookup), CancellationSurvey (main record), CancellationSurveyTag (join table)
- Established IDOR-safe @@unique([userId, entitlementId]) compound key on CancellationSurvey
- Seeded 7 CancellationReason rows (pris, tid, fandt-alternativ, indhold-matcher-ikke, personlig-situation, forbedret, teknisk) via idempotent upsert; verified runs twice without errors
- Applied schema via `prisma db push`, regenerated Prisma client, TypeScript compiles clean

## Task Commits

1. **Task 1: Add CancellationSurvey, CancellationReason, CancellationSurveyTag models** - `4a4a5c8` (feat)
2. **Task 2: Seed 7 CancellationReason rows via upsert block** - `c50a4d5` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `prisma/schema.prisma` - Three new models + User.cancellationSurveys and Entitlement.cancellationSurvey inverse relations
- `prisma/seed.ts` - CANCELLATION_REASONS const + upsert loop for 7 reason rows

## Decisions Made

- **entitlementId needs @unique** — Prisma one-to-one relations require a standalone `@unique` on the FK field; compound @@unique alone is not sufficient. Auto-fixed during validation.
- **No webhookSentAt field** — RESEARCH.md included it but the NO-Zapier scope decision supersedes; field omitted entirely.
- **Seed slugs are stable identifiers** — labels may change in future, slugs must not; upsert updates label, never changes slug.
- **prisma db push** — consistent with Phase 7 approach for Supabase schema drift.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added @unique to entitlementId for valid one-to-one relation**
- **Found during:** Task 1 (schema validation)
- **Issue:** `npx prisma validate` rejected the schema — Prisma one-to-one relations require `@unique` on the defining FK field; `@@unique([userId, entitlementId])` compound key alone does not satisfy this requirement
- **Fix:** Added `@unique` to the `entitlementId` field declaration in CancellationSurvey
- **Files modified:** prisma/schema.prisma
- **Verification:** `npx prisma validate` exits 0
- **Committed in:** `4a4a5c8` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - schema correctness)
**Impact on plan:** Fix was necessary for schema validity. No scope change.

## Issues Encountered

None beyond the @unique fix documented above.

## User Setup Required

None - schema applied via `prisma db push` automatically. No manual DB steps needed.

## Next Phase Readiness

- Plan 10-02 (service layer) can now import `CancellationSurvey`, `CancellationReason`, `CancellationSurveyTag` from `@prisma/client`
- 7 CancellationReason rows are live in the DB — Phase 11 UI can query them for dropdown options
- The @@unique([userId, entitlementId]) constraint enforces one survey per subscription — Phase 11 UI can call findUnique safely

---
*Phase: 10-offboarding-cancel-data-foundation*
*Completed: 2026-04-08*
