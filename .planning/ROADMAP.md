# Roadmap: FamilyMind Platform

## Milestones

- ✅ **v1.0 Mobile Polish** - Phases 1-4 (shipped 2026-04-05)
- ✅ **v1.1 Personlig Dashboard** - Phases 5-6 (shipped 2026-04-06)
- 🚧 **v1.2 Kursus-visning Redesign** - Phases 7-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 Mobile Polish (Phases 1-4) - SHIPPED 2026-04-05</summary>

### Phase 1: Safe Area + Viewport
**Goal**: App renders correctly within iOS/Android safe areas with no content clipped by notches or home indicators
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Safe area CSS variables + viewport meta
- [x] 01-02-PLAN.md — Safe area application across layouts

### Phase 2: Layout + Overflow
**Goal**: All screens scroll correctly with no horizontal overflow or broken layout on mobile
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Layout overflow audit + fixes
- [x] 02-02-PLAN.md — Scroll container corrections

### Phase 3: Typography, Spacing + Touch
**Goal**: Text is readable, spacing is consistent, and all interactive elements meet 44px touch targets
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Typography scale + line-height
- [x] 03-02-PLAN.md — Spacing system audit
- [x] 03-03-PLAN.md — Touch target audit + fixes

### Phase 4: Navigation + PWA
**Goal**: Navigation is consistent across all user routes and the app installs correctly as a PWA
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Navigation consistency
- [x] 04-02-PLAN.md — PWA manifest + theme-color

</details>

<details>
<summary>✅ v1.1 Personlig Dashboard (Phases 5-6) - SHIPPED 2026-04-06</summary>

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
**Plans**: 2/2 plans complete

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
**Plans**: 2/2 plans complete

Plans:
- [x] 06-01-PLAN.md — Check-in component, server action, and section heading
- [x] 06-02-PLAN.md — Weekly focus card and dashboard page restructuring

**UI hint**: yes

</details>

### v1.2 Kursus-visning Redesign (In Progress)

**Milestone Goal:** Redesign kursus-siden med visuelt rige lektionskort, kapitel-sektioner med horisontal scroll, progress-tracking og bookmark-funktionalitet.

#### Phase 7: Kursus Data Layer + SavedContent
**Goal**: The course page has all the server-side data it needs — module metadata, computed duration, completion percentage, and a working bookmark model — so UI phases can focus purely on rendering
**Depends on**: Phase 6
**Requirements**: SAVE-01, COURSE-01, COURSE-02
**Success Criteria** (what must be TRUE):
  1. A user can bookmark a lesson and the saved state persists across page reloads
  2. A user's bookmarked lessons appear under "Gemt" in their profile
  3. The course page receives a pre-computed completion percentage (0-100) without client-side calculation
  4. The course page receives total estimated duration (sum of durationMinutes across all lessons) and chapter count as ready-to-render values
**Plans**: 2 plans

Plans:
- [x] 07-01-PLAN.md — SavedContent Prisma model + bookmark service + server action
- [x] 07-02-PLAN.md — Course metadata extension (chapterCount, totalDurationMinutes) + course page wiring + profile "Gemt" section

**UI hint**: no

#### Phase 8: Lektionskort + Kapitel-layout
**Goal**: Users see visually rich lesson cards organised into scrollable chapter sections on the course page
**Depends on**: Phase 7
**Requirements**: CARD-01, CARD-02, CARD-03, CHAP-01, CHAP-02, CHAP-03
**Success Criteria** (what must be TRUE):
  1. Each lesson card shows a thumbnail (from Bunny CDN) or a fallback image if no thumbnail exists
  2. Each lesson card shows its title, a type badge (VIDEO / TEXT / PDF / AUDIO), and duration in minutes
  3. Each lesson card has a bookmark icon that visually toggles between saved and unsaved state when tapped
  4. Chapters are rendered as named sections, each with a horizontally scrollable row of lesson cards and no visible scrollbar
  5. Lessons with no module are grouped under a section titled "Øvrige lektioner"
**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md — LessonCard component (thumbnail, badge, duration, bookmark toggle)
- [x] 08-02-PLAN.md — ChapterSection component + horizontal scroll layout + course page restructuring + progress bar

**UI hint**: yes

#### Phase 9: Kursus-header + Filter
**Goal**: Users can see course progress and metadata at a glance and filter lessons by content type
**Depends on**: Phase 8
**Requirements**: COURSE-03, FILTER-01
**Success Criteria** (what must be TRUE):
  1. The course header shows a cover image when one is available on the product
  2. A progress bar with percentage label is visible in the course header
  3. The course header shows the number of chapters and total estimated duration
  4. Tapping a filter tab (Alle / Video / Artikler) hides lessons that do not match the selected type across all chapters
**Plans**: 2 plans

Plans:
- [x] 09-01-PLAN.md — Cover image in authenticated course header (COURSE-03)
- [ ] 09-02-PLAN.md — CourseFilteredView client wrapper with Alle/Video/Artikler/Lyd tabs (FILTER-01)

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 7 → 8 → 9

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Safe Area + Viewport | v1.0 | 2/2 | Complete | 2026-04-05 |
| 2. Layout + Overflow | v1.0 | 2/2 | Complete | 2026-04-05 |
| 3. Typography, Spacing + Touch | v1.0 | 3/3 | Complete | 2026-04-05 |
| 4. Navigation + PWA | v1.0 | 2/2 | Complete | 2026-04-05 |
| 5. Dashboard Service Layer | v1.1 | 2/2 | Complete | 2026-04-06 |
| 6. Dashboard UI Redesign | v1.1 | 2/2 | Complete | 2026-04-06 |
| 7. Kursus Data Layer + SavedContent | v1.2 | 0/2 | Not started | - |
| 8. Lektionskort + Kapitel-layout | v1.2 | 2/2 | Complete   | 2026-04-06 |
| 9. Kursus-header + Filter | v1.2 | 0/2 | Not started | - |
