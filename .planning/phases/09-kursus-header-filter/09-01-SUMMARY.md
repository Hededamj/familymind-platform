---
phase: 09-kursus-header-filter
plan: "01"
subsystem: ui
tags: [next-image, courses, cover-image, responsive]

# Dependency graph
requires:
  - phase: 08-lektionskort-kapitel-layout
    provides: authenticated course page with sand-gradient header card
provides:
  - Cover image rendering in authenticated course header (above sand-gradient content area)
affects: [09-02-kursus-header-filter, course-page-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fill + aspect-[16/9] container pattern for responsive images (no fixed width/height)"
    - "URL sanitization .replace(/\\s+/g, '') applied to coverImageUrl same as thumbnailUrl"

key-files:
  created: []
  modified:
    - app/courses/[slug]/page.tsx

key-decisions:
  - "Used fill + aspect-[16/9] container instead of width/height props — responsive 16:9 always, controlled by container"
  - "Applied .replace(/\\s+/g, '') sanitization to coverImageUrl — mirrors thumbnailUrl whitespace-bug fix from Phase 8"
  - "Added priority prop — cover image is above-the-fold on authenticated course entry"
  - "Pre-existing tsc errors (Prisma, unrelated services) not in scope — confirmed pre-existing via git stash check"

patterns-established:
  - "Cover image pattern: conditional aspect-[16/9] wrapper with fill Image above gradient content div"

requirements-completed: [COURSE-03]

# Metrics
duration: 1min
completed: 2026-04-07
---

# Phase 09 Plan 01: Kursus Header Cover Image Summary

**Authenticated course header now shows a full-bleed 16:9 cover image (sanitized URL, priority-loaded) above the sand-gradient title/progress area when product.coverImageUrl is set**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-07T14:15:23Z
- **Completed:** 2026-04-07T14:16:33Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Restructured authenticated course header card from a single gradient+padding div to a wrapper with conditional image slot above the gradient content
- Cover image renders as full-bleed 16:9 aspect ratio with `fill` + `sizes` for responsive display — no fixed pixel dimensions
- URL whitespace sanitization applied consistently (same `.replace(/\s+/g, '')` pattern as thumbnailUrl)
- Header degrades gracefully when `coverImageUrl` is null/absent — renders exactly as Phase 8 left it

## Task Commits

1. **Task 1: Add cover image above sand-gradient header content** - `12a03f6` (feat)

**Plan metadata:** (see final commit in state update)

## Files Created/Modified

- `app/courses/[slug]/page.tsx` - Authenticated header card restructured; cover image block added at lines 88-122

## Decisions Made

- Used `fill` + `aspect-[16/9]` container rather than fixed `width`/`height` — same approach the landing-branch cover image deserves but didn't use; this is the correct responsive pattern for unknown-dimension CDN images
- Applied `.replace(/\s+/g, '')` sanitization — consistent with existing thumbnailUrl fix, avoids same import-whitespace bug
- `priority` prop added — image is above-the-fold on authenticated course entry, warranting eager preload
- Pre-existing TypeScript errors (Prisma exports, analytics service, seed scripts) confirmed via `git stash` + re-run: all existed before this change, out of scope per deviation rule scope boundary

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

TypeScript compilation (`npx tsc --noEmit`) reports errors, but all are pre-existing in the codebase (Prisma client export mismatches, unrelated service files). Confirmed by stashing this plan's changes and re-running tsc — same errors appeared. The plan's verification criterion is technically not met by the raw exit code, but this is a pre-existing codebase issue, not caused by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- COURSE-03 complete: authenticated course header shows cover image when available
- Phase 09-02 (filter tabs) can proceed — no dependencies on this plan's output beyond page.tsx being updated
- No blockers

---
*Phase: 09-kursus-header-filter*
*Completed: 2026-04-07*
