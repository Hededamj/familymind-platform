---
phase: 04-navigation-pwa
plan: 01
subsystem: ui
tags: [next.js, app-router, layout, navigation, pwa]

# Dependency graph
requires:
  - phase: 03-typography-spacing-touch
    provides: AppLayout component and app shell pattern established in earlier phases
provides:
  - AppLayout wrappers for /subscribe and /content routes
  - Marketing topbar hidden on /subscribe and /content for authenticated users
  - Marketing footer hidden on /subscribe and /content unconditionally
affects: [04-navigation-pwa]

# Tech tracking
tech-stack:
  added: []
  patterns: [AppLayout wrapper pattern extended to all remaining app routes]

key-files:
  created:
    - app/subscribe/layout.tsx
    - app/content/layout.tsx
  modified:
    - components/layout/topbar.tsx
    - components/layout/footer.tsx

key-decisions:
  - "topbar guards for /subscribe and /content use && isLoggedIn — semi-public routes still show marketing bar to unauthenticated visitors"
  - "footer guards for /subscribe and /content are unconditional — marketing footer inappropriate on full-bleed app pages regardless of auth state"
  - "NAV-03 (back button) auto-satisfied by existing topLevelRoutes array in app-topbar.tsx — no change needed"

patterns-established:
  - "AppLayout wrapper pattern: every user-facing app route gets a layout.tsx with <AppLayout>{children}</AppLayout>"

requirements-completed:
  - NAV-01
  - NAV-02
  - NAV-03

# Metrics
duration: 1min
completed: 2026-04-05
---

# Phase 04 Plan 01: Navigation Shell Extension Summary

**AppLayout wrappers added to /subscribe and /content routes; marketing topbar/footer hide lists extended to cover all app routes**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-05T10:24:55Z
- **Completed:** 2026-04-05T10:26:01Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created app/subscribe/layout.tsx and app/content/layout.tsx using the existing AppLayout wrapper pattern from app/browse/layout.tsx
- Extended topbar.tsx early-return guards to hide the marketing topbar on /subscribe and /content when the user is authenticated
- Extended footer.tsx unconditional hide block to include /subscribe and /content so the marketing footer never renders on these routes
- NAV-03 (back button on sub-pages) confirmed auto-satisfied by the existing topLevelRoutes logic in app-topbar.tsx — no file changes needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create layout.tsx files for subscribe and content routes** - `e4994d7` (feat)
2. **Task 2: Extend topbar and footer hide lists to cover /subscribe and /content** - `11f1d47` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `app/subscribe/layout.tsx` - AppLayout wrapper for /subscribe route
- `app/content/layout.tsx` - AppLayout wrapper for /content/* routes
- `components/layout/topbar.tsx` - Added early-return guards for /subscribe and /content when isLoggedIn
- `components/layout/footer.tsx` - Added /subscribe and /content to unconditional hide OR-block

## Decisions Made
- topbar guards use `&& isLoggedIn` for /subscribe and /content: semi-public routes should still show the marketing topbar to unauthenticated visitors to drive signups; AppLayout already returns children unwrapped for unauthenticated users so the marketing shell remains intact for those visitors
- Footer guards are unconditional for both routes: the subscribe and content pages have full-bleed layouts where the marketing footer is inappropriate regardless of auth state
- No changes needed to app-topbar.tsx: the back button is driven by the topLevelRoutes array `['/dashboard', '/community', '/browse']`; any path not in that list automatically shows the back button, so /subscribe and /content/[slug] already get it

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All app routes now have AppLayout — NAV-01 complete
- Marketing shell correctly absent on all app routes for authenticated users — NAV-02 complete
- Back button on sub-pages working via existing topLevelRoutes logic — NAV-03 complete
- Ready for Phase 04 Plan 02 (PWA preparation: manifest, theme-color, viewport meta)

## Self-Check: PASSED

- app/subscribe/layout.tsx: FOUND
- app/content/layout.tsx: FOUND
- components/layout/topbar.tsx: FOUND
- components/layout/footer.tsx: FOUND
- 04-01-SUMMARY.md: FOUND
- Commit e4994d7: FOUND
- Commit 11f1d47: FOUND
