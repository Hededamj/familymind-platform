# Roadmap: FamilyMind Personlig Dashboard

## Overview

This milestone makes the FamilyMind dashboard personal and engaging. Using existing onboarding data and journey state, the dashboard will show contextual check-in prompts, weekly focus content, and admin-configurable welcome messages. Work splits into two phases: the service layer that reads and resolves user context first (because the UI has nothing to display without it), then the UI components that present that context in the redesigned dashboard.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 5: Dashboard Service Layer** - Build backend logic that resolves user context, check-in prompts, and weekly journey focus for the dashboard
- [x] **Phase 6: Dashboard UI Redesign** - Deliver the redesigned dashboard UI with large content cards, visual check-in section, and weekly overview (completed 2026-04-06)

## Phase Details

### Phase 5: Dashboard Service Layer
**Goal**: The dashboard can resolve every piece of personalised content from the database — check-in prompt, weekly focus days, progress count, and contextual welcome message — based on the user's current state
**Depends on**: Nothing (builds on existing data models — UserProfile, UserJourney, DashboardMessage, CheckInOption)
**Requirements**: CHECKIN-01, CHECKIN-03, CONTEXT-01, CONTEXT-02, WEEK-01, WEEK-03
**Success Criteria** (what must be TRUE):
  1. A user with an active journey sees a check-in prompt matching their current journey or primary challenge
  2. A user with no journey, a new account, or a completed journey each sees a different contextually appropriate check-in prompt
  3. The welcome message on the dashboard reflects the user's onboarding data (e.g. child age group, challenge area)
  4. The "Din gode uge" section resolves the upcoming days from the user's active journey with a completed-day count (e.g. "2 af 5 dage")
  5. Dashboard messages can be updated by an admin in the existing CMS without a code deploy
**Plans:** 2 plans

Plans:
- [x] 05-01-PLAN.md — Check-in prompt resolver + personalized welcome function
- [x] 05-02-PLAN.md — Weekly focus resolver + wire all into getDashboardState

**UI hint**: no

### Phase 6: Dashboard UI Redesign
**Goal**: Users experience a visually redesigned dashboard where all personalised content is presented in large, clearly structured cards that feel native and inviting on mobile
**Depends on**: Phase 5
**Requirements**: CHECKIN-02, WEEK-02, VISUAL-01, VISUAL-02, VISUAL-03
**Success Criteria** (what must be TRUE):
  1. The user can write and submit a free-text reflection directly from the dashboard check-in prompt without navigating away
  2. Today's journey focus is displayed as a large content card with a title, description, and illustration or image
  3. The check-in section is visually distinguished from surrounding content (prominent coloured or elevated container)
  4. Each dashboard section has a clear heading and supporting secondary text (e.g. "Din gode uge" with "Nyt hver mandag")
  5. All dashboard cards use rounded corners and adequate spacing — the overall layout feels polished on a 375px screen
**Plans:** 2/2 plans complete

Plans:
- [x] 06-01-PLAN.md — Check-in component, server action, and section heading
- [x] 06-02-PLAN.md — Weekly focus card and dashboard page restructuring

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Dashboard Service Layer | 0/2 | Not started | - |
| 6. Dashboard UI Redesign | 2/2 | Complete   | 2026-04-06 |
