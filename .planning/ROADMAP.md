# Roadmap: FamilyMind Mobile-First Overhaul

## Overview

This milestone transforms FamilyMind from a functional platform into a polished mobile webapp that feels native. Work proceeds in four phases: safe area and viewport foundation first (because it affects every visible surface), then structural layout fixes, then visual and interaction polish, and finally navigation consistency and PWA setup. No new features — every phase refines what already exists.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Safe Area & Viewport** - Apply safe-area insets to all fixed chrome so the UI is never obscured by notch or home indicator (completed 2026-04-03)
- [ ] **Phase 2: Layout & Overflow** - Fix structural layout issues so content fits correctly at all screen widths
- [ ] **Phase 3: Typography, Spacing & Touch** - Polish font sizes, padding, text wrapping and touch targets for a refined mobile feel
- [ ] **Phase 4: Navigation & PWA** - Ensure consistent app navigation on all user routes and add PWA manifest/meta tags

## Phase Details

### Phase 1: Safe Area & Viewport
**Goal**: Every fixed UI element respects device safe areas so content is never obscured by notch, Dynamic Island, or home indicator
**Depends on**: Nothing (first phase)
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-04
**Success Criteria** (what must be TRUE):
  1. On iPhone with notch or Dynamic Island, the topbar is fully visible and not overlapped by the status bar
  2. On iPhone with home indicator, the bottom tab bar sits above the home indicator with no overlap
  3. The onboarding wizard fixed footer button is fully tappable and not cut off by device chrome
  4. The check-in form sticky button is visible above the bottom tab bar with correct clearance
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Enable viewport-fit=cover and fix AppTopbar + BottomTabBar safe areas
- [x] 01-02-PLAN.md — Fix onboarding wizard footer and check-in form sticky button safe areas
**UI hint**: yes

### Phase 2: Layout & Overflow
**Goal**: All pages have correct structural layout — no horizontal overflow, consistent max-width, and grids that collapse appropriately on small screens
**Depends on**: Phase 1
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05
**Success Criteria** (what must be TRUE):
  1. No page causes horizontal scroll on a 375px wide screen
  2. Dashboard, browse, community and journeys pages share a consistent content max-width
  3. Multi-column grids collapse to a single column on screens narrower than 640px
  4. Cards and banners never show content breaking outside their bounds
  5. Bundle card titles are truncated cleanly rather than overflowing their container
**Plans**: 2 plans
Plans:
- [x] 02-01-PLAN.md — Fix card/banner overflow and bundle card truncation (LAYOUT-01, LAYOUT-04, LAYOUT-05)
- [x] 02-02-PLAN.md — Fix progress page grid collapse and verify max-width consistency (LAYOUT-02, LAYOUT-03)
**UI hint**: yes

### Phase 3: Typography, Spacing & Touch
**Goal**: Text is appropriately sized and spaced at every viewport, user-generated content wraps safely, and every interactive element is comfortably tappable
**Depends on**: Phase 2
**Requirements**: TYPO-01, TYPO-02, TYPO-03, TYPO-04, TOUCH-01, TOUCH-02, TOUCH-03
**Success Criteria** (what must be TRUE):
  1. The landing page hero heading scales fluidly between mobile and desktop without breaking layout
  2. All user-facing pages have consistent horizontal padding (px-4 on mobile, px-8 on desktop)
  3. Long community posts with no spaces wrap and hyphenate correctly — no horizontal overflow
  4. Every button, link and interactive element has a tap target of at least 44px
  5. Horizontal scroll carousels scroll smoothly without a visible scrollbar on iOS and Android
**Plans**: 3 plans
Plans:
- [x] 03-01-PLAN.md — Fix hero and progress page heading responsive sizes (TYPO-01, TYPO-02, TYPO-04)
- [x] 03-02-PLAN.md — Add break-words/hyphens to community posts and line-clamp to community cards (TYPO-03, TOUCH-03)
- [x] 03-03-PLAN.md — Add min-h-[44px] touch targets to buttons and community pill links (TOUCH-01, TOUCH-02)
**UI hint**: yes

### Phase 4: Navigation & PWA
**Goal**: Every user-facing route uses the correct app shell with tab bar and sidebar, and the app is installable as a PWA with correct branding metadata
**Depends on**: Phase 3
**Requirements**: NAV-01, NAV-02, NAV-03, PWA-01, PWA-02, PWA-03
**Success Criteria** (what must be TRUE):
  1. Visiting any authenticated user route shows the bottom tab bar and sidebar — no missing AppLayout wrapper
  2. Authenticated users on app routes do not see the marketing topbar or footer
  3. Back navigation works correctly on all sub-pages — tapping back returns to the expected previous screen
  4. Adding the app to the iOS home screen shows the correct app name, icon and theme color
  5. The browser chrome on Android matches the app theme color when the app is open
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Safe Area & Viewport | 2/2 | Complete   | 2026-04-03 |
| 2. Layout & Overflow | 0/2 | Planned | - |
| 3. Typography, Spacing & Touch | 0/3 | Planned | - |
| 4. Navigation & PWA | 0/? | Not started | - |
