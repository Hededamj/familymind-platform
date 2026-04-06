---
phase: 06-dashboard-ui-redesign
plan: "02"
subsystem: ui
tags: [next.js, react, tailwind, dashboard, mobile-first]

# Dependency graph
requires:
  - phase: 06-dashboard-ui-redesign/06-01
    provides: DashboardCheckIn component and SectionHeading component
  - phase: 05-dashboard-service-layer
    provides: getDashboardState, WeeklyFocus type, checkInPrompt, personalizedWelcome
provides:
  - WeeklyFocusCard component showing today's journey day with progress dots and CTA
  - Unified dashboard layout replacing state-based conditional views
  - Section-based structure with SectionHeading, check-in, focus, courses, recommendations
affects: [any future dashboard plans, journey page, mobile UI phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Unified section layout — every user sees same structure, sections render conditionally on data availability
    - WeeklyFocusCard: sand/50 header, progress dots with success/primary/border colours, rounded-2xl large card
    - SectionHeading wrapping each major section for consistent visual hierarchy

key-files:
  created:
    - app/dashboard/_components/weekly-focus-card.tsx
  modified:
    - app/dashboard/page.tsx

key-decisions:
  - "Unified layout replaces state-based views — simpler, always-visible structure instead of NewUserView/ActiveJourneyView branches"
  - "WeeklyFocusCard uses sand/50 header with phase Badge and progress dot row — matches JourneyDayCard visual language"
  - "RecommendationSection kept without SectionHeading wrapper to avoid duplicate heading (component has its own h2)"

patterns-established:
  - "WeeklyFocusCard pattern: large card with warm-tinted header, progress indicator strip, full-width CTA — reusable for future focus cards"
  - "Section pattern: <section> + <SectionHeading> + content component, conditionally rendered based on data availability"

requirements-completed: [WEEK-02, VISUAL-01, VISUAL-02, VISUAL-03]

# Metrics
duration: ~15min
completed: 2026-04-05
---

# Phase 06 Plan 02: Dashboard UI Redesign — WeeklyFocusCard + Unified Layout Summary

**WeeklyFocusCard with progress dots and CTA, unified section-based dashboard replacing all state-based conditional views**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-05T21:25:00Z
- **Completed:** 2026-04-05T23:27:05Z
- **Tasks:** 2 (1 auto, 1 human-verify — approved)
- **Files modified:** 2

## Accomplishments

- Created WeeklyFocusCard: large card with sand/50 warm header, today's day title in serif, phase Badge, row of progress dots (green=done, primary=current, border=upcoming), and a full-width "Fortsaet med dagens fokus" button
- Rewrote dashboard page.tsx from ~340 lines of state-branching views down to a clean 141-line unified section layout
- Removed NewUserView, ActiveJourneyView, and all other state-based render functions — replaced with always-present sections that conditionally render based on data

## Task Commits

1. **Task 1: WeeklyFocusCard + restructured dashboard page** - `dca3976` (feat)
2. **Task 2: Visual verification** - Approved by user (no commit)

## Files Created/Modified

- `app/dashboard/_components/weekly-focus-card.tsx` - Large visual card for today's journey focus day; sand header, progress dots, CTA button
- `app/dashboard/page.tsx` - Fully restructured with unified section layout using SectionHeading, DashboardCheckIn, WeeklyFocusCard; old state views removed

## Decisions Made

- Unified layout instead of state-based views: cleaner, reduces branching complexity, easier to extend
- WeeklyFocusCard is a server component (no `use client`) — keeps data flow on server side
- RecommendationSection rendered without a SectionHeading wrapper because the component already contains its own `<h2>` — avoided duplicate heading rather than modifying a shared component

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 06 is now complete (both plans executed and verified)
- Dashboard has polished mobile-first layout with check-in, weekly focus, courses, and recommendations
- WeeklyFocusCard and SectionHeading patterns available for reuse in future phases
- No blockers for next milestone

## Self-Check: PASSED

- `app/dashboard/_components/weekly-focus-card.tsx` — exists (created in dca3976)
- `app/dashboard/page.tsx` — modified in dca3976
- Commit dca3976 — present in git log

---
*Phase: 06-dashboard-ui-redesign*
*Completed: 2026-04-05*
