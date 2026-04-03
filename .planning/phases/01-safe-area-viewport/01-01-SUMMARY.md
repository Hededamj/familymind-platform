---
phase: 01-safe-area-viewport
plan: 01
subsystem: ui
tags: [safe-area, viewport, next.js, css, mobile, ios]

# Dependency graph
requires: []
provides:
  - viewport-fit=cover metadata exported from root layout (enables env(safe-area-inset-*) non-zero values)
  - AppTopbar with dynamic height and paddingTop using env(safe-area-inset-top, 0px)
  - BottomTabBar with dynamic height using env(safe-area-inset-bottom, 0px)
affects: [02-layout-fixes, 03-typography-touch, 04-navigation-pwa]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Safe-area chrome: remove h-14, use style prop with calc(3.5rem + env(safe-area-inset-*, 0px)) for dynamic height"
    - "Viewport-fit cover: export const viewport: Viewport in app/layout.tsx rather than meta tag"

key-files:
  created: []
  modified:
    - app/layout.tsx
    - components/layout/app-topbar.tsx
    - components/layout/bottom-tab-bar.tsx

key-decisions:
  - "Use Next.js 14+ viewport export (not meta tag) for viewport-fit=cover — correct approach for App Router"
  - "Control height via style prop (calc) rather than Tailwind class — Tailwind cannot express dynamic env() values"

patterns-established:
  - "Safe-area chrome pattern: remove h-14, add style={{ paddingTop/paddingBottom: env(...), height: calc(3.5rem + env(...)) }}"

requirements-completed: [SAFE-01, SAFE-02]

# Metrics
duration: 8min
completed: 2026-04-03
---

# Phase 01 Plan 01: Safe Area Viewport Summary

**viewport-fit=cover metadata and safe-area-inset env() values applied to AppTopbar and BottomTabBar, making both components grow dynamically on notch/home-indicator iPhones**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-03T00:00:00Z
- **Completed:** 2026-04-03T00:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Root layout exports `viewport` const with `viewportFit: 'cover'` — this unlocks non-zero `env(safe-area-inset-*)` values on all iOS devices
- AppTopbar header: `h-14` removed, replaced with `paddingTop: env(safe-area-inset-top, 0px)` and `height: calc(3.5rem + env(safe-area-inset-top, 0px))` — topbar content now sits below the notch/Dynamic Island
- BottomTabBar nav: `h-14` removed, existing `paddingBottom` retained, `height: calc(3.5rem + env(safe-area-inset-bottom, 0px))` added — bar background fills behind home indicator while tab icons stay centered in upper 56px

## Task Commits

Each task was committed atomically:

1. **Task 1: Add viewport-fit=cover metadata and fix AppTopbar safe area** - `ec901ef` (feat)
2. **Task 2: Fix BottomTabBar dynamic height for safe area** - `aaa2147` (feat)

**Plan metadata:** pending (docs commit below)

## Files Created/Modified
- `app/layout.tsx` - Added `Viewport` import, exported `viewport` const with `viewportFit: 'cover'`
- `components/layout/app-topbar.tsx` - Removed `h-14`, added safe-area-aware paddingTop and dynamic height via style prop
- `components/layout/bottom-tab-bar.tsx` - Removed `h-14`, added dynamic height alongside existing paddingBottom via style prop

## Decisions Made
- Used the Next.js App Router `export const viewport: Viewport` pattern rather than a manual `<meta>` tag — this is the canonical approach for Next.js 14+ and avoids conflicts with framework internals
- Height controlled via inline style using `calc(3.5rem + env(...))` since Tailwind classes cannot express runtime env() function values

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — TypeScript compilation clean, all grep verifications passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Viewport-fit=cover is now active; all `env(safe-area-inset-*)` values will return device-reported insets
- Phase 2 (layout fixes) should audit any elements using `pb-14` or `mb-14` to clear the tab bar — per UI-SPEC note, these need updating to `calc(3.5rem + env(safe-area-inset-bottom, 0px))` now that the tab bar is taller on home-indicator devices
- SAFE-03 (onboarding wizard footer) and SAFE-04 (check-in sticky button) are scheduled for plan 01-02

---
*Phase: 01-safe-area-viewport*
*Completed: 2026-04-03*
