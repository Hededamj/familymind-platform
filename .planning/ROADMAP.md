# Roadmap: FamilyMind Platform

## Milestones

- ✅ **v1.0 Mobile Polish** - Phases 1-4 (shipped 2026-04-05)
- ✅ **v1.1 Personlig Dashboard** - Phases 5-6 (shipped 2026-04-06)
- ✅ **v1.2 Kursus-visning Redesign** - Phases 7-9 (shipped 2026-04-08)
- 🚧 **v1.3 Offboarding Intelligence** - Phases 10-12 (in progress)
- 📋 **v1.4 MobilePay Checkout** - Phases 13-16 (planned — awaiting API credentials)

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

### v1.3 Offboarding Intelligence (In Progress)

**Milestone Goal:** Erstat ekstern cancellation-formular med in-app opsigelses-flow der indsamler strukturerede data (reasons, tags, feedback), understøtter pause som alternativ, og feeder data til New Zenler via eksisterende Zapier-bridge — alt med "hjemmelig hygge" empatisk tone.

#### Phase 10: Cancel-data Foundation + Zapier Bridge
**Goal**: The platform has a CancellationSurvey data model, predefined reason tags, Stripe subscription pause support, and an outbound webhook that feeds cancellation data to Zapier so the existing New Zenler email automation keeps working
**Depends on**: Phase 9
**Requirements**: OFF-DATA-01, OFF-DATA-02, OFF-DATA-03, OFF-DATA-04, OFF-DATA-05
**Success Criteria** (what must be TRUE):
  1. A CancellationSurvey record can be created with userId, subscriptionId, primary reason tag, multi-tag array, feedback text, wouldReturn flag, and pause-related fields
  2. Predefined CancellationReason tags exist (pris, tid, fandt-alternativ, indhold-matcher-ikke, personlig-situation, forbedret, teknisk) and are seeded in the database
  3. The server action subscribeCancellationService() validates a survey is submitted before calling Stripe's subscription cancel API
  4. Stripe subscription.pause_collection is supported via a service function that pauses for 1, 2, or 3 months
  5. An outbound webhook POSTs cancellation data to a configurable Zapier endpoint with user email, tags, and feedback so New Zenler receives the event and triggers the existing re-engagement automation
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd:plan-phase 10 to break down)

**UI hint**: no

#### Phase 11: Hygge Cancel Flow (UI)
**Goal**: A user clicking cancel on their subscription goes through a warm, multi-step in-app flow that asks why, offers pause as an alternative, and leaves them feeling respected — not guilt-tripped
**Depends on**: Phase 10
**Requirements**: OFF-UI-01, OFF-UI-02, OFF-UI-03, OFF-UI-04, OFF-UI-05, OFF-UI-06
**Success Criteria** (what must be TRUE):
  1. The "Opsig abonnement" button on "Mit abonnement" routes to a dedicated /dashboard/subscription/cancel page (not a modal)
  2. Step 1 shows an empathetic headline and warm illustration in the FamilyMind design system (sand, coral, DM Serif Display)
  3. Step 2 lets the user pick a primary reason from tag chips and add free-text feedback (both optional, but one is encouraged)
  4. Step 3 offers pause (1/2/3 months) as an alternative — with clear "nej tak, opsig" button that does not guilt-trip
  5. Step 4 confirms the cancellation date (end of billing period) and completes the Stripe cancel via the server action
  6. Step 5 shows a thank-you message with the user's name and a "velkommen tilbage når du er klar" tone — no upsell pressure
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd:plan-phase 11 to break down)

**UI hint**: yes

#### Phase 12: Churn Analytics Dashboard
**Goal**: Admins can see why customers cancel, filter by tags and time periods, and export segments for re-engagement — turning raw data into actionable insights
**Depends on**: Phase 11
**Requirements**: OFF-ADMIN-01, OFF-ADMIN-02, OFF-ADMIN-03, OFF-ADMIN-04
**Success Criteria** (what must be TRUE):
  1. /admin/analytics/churn shows a bar chart of cancellation reasons with counts over a selectable time window (7/30/90 days)
  2. A list of the most recent cancellation feedback is visible with user info and tags
  3. Admins can filter churned users by tag combinations (e.g. "pris + har børn under 5") and export the segment as CSV
  4. A trend line shows churn rate per month across the entire user base
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd:plan-phase 12 to break down)

**UI hint**: yes

---

### v1.4 MobilePay Checkout (Planned)

**Milestone Goal:** Tilføj MobilePay som ligeværdig subscription-betaling parallelt med Stripe via Vipps Recurring API v3, integreret i platformen og tenant-aware fra start.

**Source spec:** `docs/superpowers/specs/2026-04-08-mobilepay-subscription-design.md`
**Note:** Kræver MobilePay/Vipps API credentials fra eksterne part — startes når disse er tilgængelige.

#### Phase 13: MobilePay Core Infrastructure
**Goal**: The platform has all data models, Vipps API client, and service-layer functions needed to create, query, and cancel MobilePay agreements and charges — with credentials ready to be configured per-tenant
**Depends on**: Phase 12
**Requirements**: MP-DATA-01, MP-DATA-02, MP-DATA-03, MP-DATA-04, MP-DATA-05
**Success Criteria** (what must be TRUE):
  1. Prisma migration adds MobilePayAgreement, MobilePayCharge, MobilePayWebhookEvent and extends Organization + Entitlement with the required columns
  2. lib/mobilepay.ts can authenticate against Vipps sandbox with OAuth2 and cache the access token
  3. mobilepay.service.ts can create, fetch, and cancel agreements against Vipps sandbox end-to-end (verified by integration test)
  4. mobilepay.service.ts can create and refund charges against Vipps sandbox
  5. Client secret is stored encrypted at rest and never logged
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd-plan-phase 10 to break down)

**UI hint**: no

#### Phase 14: Checkout Flow + Webhook Activation
**Goal**: A user can choose MobilePay on a dedicated checkout page, approve an agreement in the MobilePay app, and end up with an active Entitlement — driven end-to-end by the webhook flow with full idempotency
**Depends on**: Phase 13
**Requirements**: MP-CHECKOUT-01, MP-CHECKOUT-02, MP-CHECKOUT-03, MP-CHECKOUT-04, MP-CHECKOUT-05, MP-WEBHOOK-01, MP-WEBHOOK-02, MP-WEBHOOK-03
**Success Criteria** (what must be TRUE):
  1. A user tapping "Bliv medlem" lands on /checkout/vaelg-betaling with both Stripe and MobilePay clearly visible as equal options
  2. Selecting MobilePay on mobile deeplinks into the MobilePay app; on desktop a QR code is shown
  3. After the user approves in MobilePay, the success page transitions to "Du er medlem" as soon as the webhook has been processed
  4. The Entitlement is created exactly once even if Vipps delivers the same webhook multiple times
  5. A user with an already-active subscription Entitlement cannot create a duplicate via MobilePay checkout
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd:plan-phase 14 to break down)

**UI hint**: yes

#### Phase 15: Recurring Charges + Failure Handling
**Goal**: Active MobilePay agreements are charged automatically each cycle, failures are retried and communicated to the user, and the system degrades gracefully if Vipps is unavailable
**Depends on**: Phase 14
**Requirements**: MP-WEBHOOK-04, MP-WEBHOOK-05, MP-CRON-01, MP-CRON-02, MP-CRON-03, MP-CRON-04, MP-ERR-01, MP-ERR-02, MP-ERR-03, MP-ERR-04
**Success Criteria** (what must be TRUE):
  1. The daily charge cron creates MobilePay charges 2 days before nextChargeDate in batches of 20 without duplicates
  2. A successful charge.charged webhook extends Entitlement.expiresAt and emits a receipt email
  3. Three consecutive failed charges move the Entitlement to PAST_DUE with a configurable grace period and dunning emails
  4. The daily reconciliation cron detects and logs any divergence between local state and Vipps API within 24 hours
  5. If Vipps API is unavailable, the checkout page shows a fallback banner and the MobilePay button is disabled until recovery
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd:plan-phase 15 to break down)

**UI hint**: no

#### Phase 16: Admin UI + User Subscription Management
**Goal**: Admins can see, cancel, and refund MobilePay agreements alongside Stripe subscriptions, users can cancel their own subscription from one unified button regardless of provider, and analytics show provider-level conversion and failure metrics
**Depends on**: Phase 15
**Requirements**: MP-ADMIN-01, MP-ADMIN-02, MP-ADMIN-03, MP-ADMIN-04, MP-USER-01, MP-USER-02, MP-ERR-05
**Success Criteria** (what must be TRUE):
  1. /admin/users/[id] has a Betaling tab that lists both Stripe and MobilePay in a unified table with provider badges
  2. Admin can force-cancel any MobilePay agreement and issue full or partial refunds with IDOR protection
  3. /admin/analytics shows payment-method breakdown, per-provider conversion rate, and failed charge rate
  4. A user cancelling from "Mit abonnement" routes through the correct provider without knowing which one they used
  5. Admin receives notifications when reconciliation finds divergence, agreements fail, or Vipps outage threshold is exceeded
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd:plan-phase 16 to break down)

**UI hint**: yes

---

### v1.2 Kursus-visning Redesign (Shipped 2026-04-08)

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
- [x] 09-02-PLAN.md — CourseFilteredView client wrapper with Alle/Video/Artikler/Lyd tabs (FILTER-01)

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 13 → 14 → 15 → 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Safe Area + Viewport | v1.0 | 2/2 | Complete | 2026-04-05 |
| 2. Layout + Overflow | v1.0 | 2/2 | Complete | 2026-04-05 |
| 3. Typography, Spacing + Touch | v1.0 | 3/3 | Complete | 2026-04-05 |
| 4. Navigation + PWA | v1.0 | 2/2 | Complete | 2026-04-05 |
| 5. Dashboard Service Layer | v1.1 | 2/2 | Complete | 2026-04-06 |
| 6. Dashboard UI Redesign | v1.1 | 2/2 | Complete | 2026-04-06 |
| 7. Kursus Data Layer + SavedContent | v1.2 | 2/2 | Complete | 2026-04-08 |
| 8. Lektionskort + Kapitel-layout | v1.2 | 2/2 | Complete | 2026-04-06 |
| 9. Kursus-header + Filter | v1.2 | 2/2 | Complete | 2026-04-08 |
| 10. Cancel-data Foundation + Zapier Bridge | v1.3 | 0/? | Not started | - |
| 11. Hygge Cancel Flow (UI) | v1.3 | 0/? | Not started | - |
| 12. Churn Analytics Dashboard | v1.3 | 0/? | Not started | - |
| 13. MobilePay Core Infrastructure | v1.4 | 0/? | Not started | - |
| 14. Checkout Flow + Webhook Activation | v1.4 | 0/? | Not started | - |
| 15. Recurring Charges + Failure Handling | v1.4 | 0/? | Not started | - |
| 16. Admin UI + User Subscription Management | v1.4 | 0/? | Not started | - |
