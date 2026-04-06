---
phase: 07-kursus-data-layer-savedcontent
plan: 02
subsystem: service-layer
tags: [progress, bookmarks, course-page, profile, savedcontent]

# Dependency graph
requires:
  - 07-01 (SavedContent model + getSavedLessons service)
provides:
  - getCourseProgress returning chapterCount and totalDurationMinutes
  - Course page displaying percentComplete, chapterCount, totalDurationMinutes and savedLessonIds Set
  - Profile page Gemt section listing bookmarked lessons
affects:
  - 08-kursus-ui (bookmark toggle UI uses savedLessonIds Set from course page)
  - 09-kursus-filter-ui (course page metadata ready for filter/header redesign)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Promise.all for parallel DB queries within a single page load (getCourseProgress + getSavedLessons)
    - Set<string> for O(1) bookmark lookup by contentUnitId on course page
    - Null coercion ?? 0 on nullable durationMinutes to prevent NaN accumulation in reduce

key-files:
  created: []
  modified:
    - lib/services/progress.service.ts
    - app/courses/[slug]/page.tsx
    - app/dashboard/profile/page.tsx

key-decisions:
  - "getCourseProgress uses Promise.all([lessons, moduleCount]) — single round trip for both lesson data and chapter count"
  - "savedLessonIds is a Set<string> (not array) — O(1) has() lookup available for Phase 8 bookmark toggle rendering"
  - "Gemt section hidden when savedLessons.length === 0 — no empty state UI needed at this phase"

# Metrics
duration: 2min
completed: 2026-04-06
---

# Phase 07 Plan 02: getCourseProgress Extension + Course Page Metadata + Profile Gemt Summary

**getCourseProgress extended with chapterCount and totalDurationMinutes; course page wired with percentComplete display and savedLessonIds Set; profile page shows Gemt section of bookmarked lessons**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-06T20:14:19Z
- **Completed:** 2026-04-06T20:15:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Extended `getCourseProgress` to run `prisma.courseModule.count` in parallel with the lessons query — no extra round trip, returns `chapterCount` and `totalDurationMinutes`
- `totalDurationMinutes` computed via reduce with `?? 0` null coercion on nullable `durationMinutes` field
- Course page now renders: `percentComplete%`, completed/total lessons, chapter count and duration metadata
- Course page declares `savedLessonIds = new Set<string>()` populated from `getSavedLessons` via `Promise.all` — ready for Phase 8 LessonCard toggle
- Profile page has "Gemt" section with bookmarked lesson list: filled Bookmark icon, title (line-clamp-1), media type label, 44px touch targets, links to `/content/[slug]`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend getCourseProgress and wire into course page** - `6d40465` (feat)
2. **Task 2: Add Gemt section to profile page** - `e5974cb` (feat)

## Files Created/Modified

- `lib/services/progress.service.ts` - getCourseProgress extended with Promise.all([lessons, moduleCount]), chapterCount, totalDurationMinutes
- `app/courses/[slug]/page.tsx` - getSavedLessons import, savedLessonIds Set, Promise.all in hasAccess branch, updated progress display with percentComplete + metadata
- `app/dashboard/profile/page.tsx` - getSavedLessons import, Bookmark icon import, savedLessons fetch, Gemt section JSX with min-h-[44px] links

## Decisions Made

- `getCourseProgress` uses `Promise.all([lessons, moduleCount])` — a single round trip instead of two sequential queries. The module count query is cheap and always needed for COURSE-02.
- `savedLessonIds` is typed as `Set<string>` rather than an array — Phase 8 will call `savedLessonIds.has(contentUnitId)` per LessonCard, requiring O(1) lookup.
- Gemt section is conditionally rendered only when `savedLessons.length > 0` — clean for users with no bookmarks without an empty state placeholder.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data is wired from live DB queries. The Gemt section uses real `getSavedLessons` data. The course metadata uses real `getCourseProgress` data.

---

*Phase: 07-kursus-data-layer-savedcontent*
*Completed: 2026-04-06*

## Self-Check: PASSED

- FOUND: lib/services/progress.service.ts
- FOUND: app/courses/[slug]/page.tsx
- FOUND: app/dashboard/profile/page.tsx
- FOUND: .planning/phases/07-kursus-data-layer-savedcontent/07-02-SUMMARY.md
- FOUND commit: 6d40465
- FOUND commit: e5974cb
