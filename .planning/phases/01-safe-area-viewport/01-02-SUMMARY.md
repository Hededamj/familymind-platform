---
phase: 01-safe-area-viewport
plan: 02
subsystem: ui
tags: [safe-area, ios, viewport, next.js, tailwind, mobile]

# Dependency graph
requires:
  - phase: 01-safe-area-viewport plan 01
    provides: "viewport-fit=cover in root layout, BottomTabBar height formula (3.5rem + env(safe-area-inset-bottom))"
provides:
  - "Onboarding wizard footer with dynamic paddingBottom clearing home indicator"
  - "Check-in form submit button that floats above tab bar with 16px clearance on all iOS devices"
affects: [02-layout-fixes, any-phase-touching-onboarding-wizard, any-phase-touching-check-in-form]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS env() via inline style prop for safe-area-inset-bottom on fixed/sticky components"
    - "calc(3.5rem + env(safe-area-inset-bottom, 0px) + N) for tab-bar-clearing sticky elements"

key-files:
  created: []
  modified:
    - app/onboarding/_components/onboarding-wizard.tsx
    - app/journeys/[slug]/_components/check-in-form.tsx

key-decisions:
  - "Use inline style prop (not Tailwind class) for env() values — Tailwind 4 cannot generate dynamic calc with env() at compile time"
  - "Onboarding footer: pt-4 className + paddingBottom in style prop — preserves 16px base, adds home indicator clearance"
  - "Check-in sticky button: remove bottom-4 class, use style bottom with full tab-bar formula matching BottomTabBar height"

patterns-established:
  - "Tab-bar-clearing sticky button pattern: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)"
  - "Safe-area footer padding pattern: calc(1rem + env(safe-area-inset-bottom, 0px))"

requirements-completed: [SAFE-03, SAFE-04]

# Metrics
duration: 8min
completed: 2026-04-03
---

# Phase 01 Plan 02: Safe-Area Page Components Summary

**Onboarding wizard footer and check-in submit button now clear the home indicator and tab bar via CSS env(safe-area-inset-bottom) inline style props**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-03T20:00:00Z
- **Completed:** 2026-04-03T20:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Onboarding wizard footer replaces static `py-4` with `pt-4` + dynamic `paddingBottom: calc(1rem + env(safe-area-inset-bottom, 0px))`, ensuring footer buttons are never obscured by the home indicator
- Check-in form sticky submit button replaces `bottom-4` with `bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)`, floating 16px above the full tab bar height on all device types
- TypeScript compiles cleanly with no errors introduced

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix onboarding wizard footer safe area padding** - `e7c93aa` (feat)
2. **Task 2: Fix check-in form sticky button clearance over tab bar** - `16be3ea` (feat)

## Files Created/Modified

- `app/onboarding/_components/onboarding-wizard.tsx` - Footer div: `py-4` -> `pt-4` + inline style paddingBottom with env()
- `app/journeys/[slug]/_components/check-in-form.tsx` - Sticky wrapper: removed `bottom-4`, added inline style bottom with tab-bar-clearing calc

## Decisions Made

- Used inline style props for env() values because Tailwind 4 cannot generate arbitrary calc expressions with CSS custom environment variables at build time
- Kept `sm:relative` and `sm:` breakpoint variants on the onboarding footer unchanged — the paddingBottom style prop is harmless on desktop (resolves to 1rem + 0px = same as original py-4)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The plan's automated verify script checked `! grep -q "py-4" app/onboarding/_components/onboarding-wizard.tsx` which failed because other elements in the file (option buttons, date input) legitimately use `py-4`. The actual acceptance criteria (footer div does not contain py-4) was met. The verification was re-evaluated against the acceptance criteria rather than the greedy script.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 01 (Safe Area & Viewport) is fully complete: viewport-fit=cover, chrome bars, and page-level components all safe-area-aware
- Phase 02 (Layout Fixes) can proceed — the safe area foundation is in place for all subsequent layout work
- No blockers

---
*Phase: 01-safe-area-viewport*
*Completed: 2026-04-03*
