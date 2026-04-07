---
phase: 09-kursus-header-filter
plan: "02"
subsystem: ui
tags: [courses, filter, client-component, serialization]

# Dependency graph
requires:
  - phase: 09-01
    provides: authenticated course page with cover image header
provides:
  - Content-type filter tabs on authenticated course page (FILTER-01)
affects: [course-page-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Set serialization boundary: server passes Array.from(set), client reconstructs via useMemo(() => new Set(arr))"
    - "Client filter component wraps server-prepared chapter data; chapters with 0 matches are hidden by .filter(ch => ch.lessons.length > 0)"

key-files:
  created:
    - app/courses/[slug]/_components/CourseFilteredView.tsx
  modified:
    - app/courses/[slug]/page.tsx

key-decisions:
  - "CourseFilteredView owns all filter state — server page stays async/server and delegates chapter rendering entirely"
  - "Sets converted with Array.from() at the server/client boundary — required to avoid Next.js serialization error"
  - "Unassigned lessons and no-modules fallback unified into single unassignedLessons+unassignedTitle prop pair"
  - "ChapterSection import removed from page.tsx — no longer used directly after delegation to CourseFilteredView"

# Metrics
duration: 2min
completed: 2026-04-07
---

# Phase 09 Plan 02: Kursus Header Filter Summary

**Client-side content-type filter tabs (Alle, Video, Artikler, Lyd) added to authenticated course page via new CourseFilteredView component; server/client Set serialization boundary handled correctly with Array.from().**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-07T14:18:30Z
- **Completed:** 2026-04-07T14:20:30Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- Created `CourseFilteredView` client component with four filter tabs: Alle, Video, Artikler, Lyd
- Filter state lives entirely in the client component — no server round-trip on filter change
- Chapters with zero matching lessons disappear from rendered output (pre-filtered before passing to ChapterSection)
- Empty-state message ("Ingen videoer/artikler/lydlektioner i dette forløb") when no results across all chapters
- Sets reconstructed via `useMemo(() => new Set(arr))` from `string[]` props — satisfies Next.js serialization constraint
- `min-h-[44px]` on filter buttons for touch-target compliance
- page.tsx authenticated branch simplified: inline module/unassigned/fallback rendering replaced by single `<CourseFilteredView>` call

## Task Commits

1. **Task 1: Create CourseFilteredView client component** - `43bb119` (feat)
2. **Task 2: Wire CourseFilteredView into page.tsx** - `c11921d` (feat)

## Files Created/Modified

- `app/courses/[slug]/_components/CourseFilteredView.tsx` — new client component (125 lines); owns MediaFilter state, reconstructs Sets, renders filter tabs + filtered ChapterSections
- `app/courses/[slug]/page.tsx` — authenticated branch refactored; chaptersData/unassignedLessonsData built server-side; Array.from() used for Set props; ChapterSection import removed

## Decisions Made

- Server page builds `chaptersData` and `unassignedLessonsData` arrays before the return — keeps data shaping on the server where Prisma types are available
- `unassignedTitle` prop string encapsulates the "Øvrige lektioner" vs "Lektioner" logic — CourseFilteredView is agnostic to which case applies
- Removed `ChapterSection` import from page.tsx as it is now only consumed inside CourseFilteredView

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- FILTER-01 complete: content-type filter tabs working on authenticated course page
- Phase 09 fully complete (both plans delivered)
- No blockers

---
*Phase: 09-kursus-header-filter*
*Completed: 2026-04-07*
