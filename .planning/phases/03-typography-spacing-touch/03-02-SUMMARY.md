---
phase: 03-typography-spacing-touch
plan: "02"
subsystem: ui
tags: [tailwind, community, typography, overflow, line-clamp]

# Dependency graph
requires:
  - phase: 02-layout-overflow
    provides: overflow-hidden on Card, min-w-0 on flex containers
provides:
  - Community post and reply bodies safe against long unbroken words (break-words hyphens-auto)
  - Community room names clamped to 1 line in grid cards
  - Community post feed body previews clamped to 2 lines
affects: [community]

# Tech tracking
tech-stack:
  added: []
  patterns: [break-words hyphens-auto on user-generated text, line-clamp on card headings and feed previews]

key-files:
  created: []
  modified:
    - app/community/[roomSlug]/[postSlug]/page.tsx
    - app/community/page.tsx
    - app/community/[roomSlug]/page.tsx

key-decisions:
  - "Use break-words + hyphens-auto together on UGC paragraphs — break-words handles ASCII overflow, hyphens-auto provides natural hyphenation for Danish compound words (works with lang=da on root html)"
  - "line-clamp-1 on room card names to prevent multi-line heading in fixed-height grid cells"
  - "line-clamp-2 on post body preview to balance readability with compact list density"

patterns-established:
  - "UGC paragraph pattern: whitespace-pre-wrap break-words hyphens-auto — apply to any user-authored body text"
  - "Card heading clamp pattern: line-clamp-1 on h2 inside grid cards to prevent layout breaks"
  - "Feed preview clamp pattern: line-clamp-2 on preview paragraphs in list/feed views"

requirements-completed: [TYPO-03, TOUCH-03]

# Metrics
duration: 5min
completed: 2026-04-05
---

# Phase 03 Plan 02: Community Text Overflow Protection Summary

**Tailwind break-words/hyphens-auto on community UGC bodies, line-clamp-1 on room card names, line-clamp-2 on post feed previews — prevents horizontal scroll from long Danish compound words and URLs**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-05T00:00:00Z
- **Completed:** 2026-04-05T00:05:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Post and reply bodies in single-post view now wrap long unbroken strings (URLs, Danish compound nouns) without horizontal overflow
- Community room grid cards clamp room names to a single line, maintaining a consistent card height
- Room feed post previews clamp body text to 2 lines for compact, scannable list layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Add break-words and hyphens to post and reply bodies** - `dcd5a7e` (feat)
2. **Task 2: Add line-clamp to community room cards and post feed previews** - `f131736` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `app/community/[roomSlug]/[postSlug]/page.tsx` - Added `break-words hyphens-auto` to post body and reply body paragraphs (2 occurrences)
- `app/community/page.tsx` - Added `line-clamp-1` to room name h2 in community grid
- `app/community/[roomSlug]/page.tsx` - Added `line-clamp-2` to post body preview paragraph in room feed

## Decisions Made
- `break-words` and `hyphens-auto` are applied together: `break-words` handles non-hyphenatable strings (URLs, codes), `hyphens-auto` provides natural hyphenation for Danish compound words — works correctly because the root layout sets `lang="da"` on the html element.
- No changes outside the specified class additions; all other attributes on the target elements preserved unchanged.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Community text overflow protection complete
- Ready for remaining Phase 03 plans (03-03 and beyond)
- No blockers

---
*Phase: 03-typography-spacing-touch*
*Completed: 2026-04-05*
