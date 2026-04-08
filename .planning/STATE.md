---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: Offboarding Intelligence
status: executing
stopped_at: Completed 10-01-PLAN.md
last_updated: "2026-04-08T20:16:39.125Z"
last_activity: 2026-04-08
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 2
  completed_plans: 1
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-08)

**Core value:** Indsaml strukturerede opsigelses-data i-app så churned kunder kan tagges og re-engageres — uden dark patterns
**Current focus:** Phase 10 — offboarding-cancel-data-foundation

## Current Position

Phase: 10 (offboarding-cancel-data-foundation) — EXECUTING
Plan: 2 of 2
Status: Ready to execute
Last activity: 2026-04-08

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 4
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 08 | 2 | - | - |
| 09 | 2 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

Previous milestone velocity (v1.0 + v1.1):
| Phase 01-safe-area-viewport P01 | 8min | 2 tasks | 3 files |
| Phase 01-safe-area-viewport P02 | 8min | 2 tasks | 2 files |
| Phase 02-layout-overflow P02 | 1min | 1 tasks | 1 files |
| Phase 02-layout-overflow P01 | 75s | 2 tasks | 4 files |
| Phase 03-typography-spacing-touch P02 | 5min | 2 tasks | 3 files |
| Phase 03-typography-spacing-touch P03 | 5min | 2 tasks | 3 files |
| Phase 03-typography-spacing-touch P01 | 4min | 2 tasks | 2 files |
| Phase 04-navigation-pwa P02 | 5min | 2 tasks | 2 files |
| Phase 04-navigation-pwa P01 | 1min | 2 tasks | 4 files |
| Phase 05-dashboard-service-layer P01 | 3min | 2 tasks | 3 files |
| Phase 05-dashboard-service-layer P02 | 2min | 2 tasks | 2 files |
| Phase 06-dashboard-ui-redesign P01 | 2min | 2 tasks | 3 files |
| Phase 06-dashboard-ui-redesign P02 | 15min | 2 tasks | 2 files |
| Phase 07-kursus-data-layer-savedcontent P01 | 3min | 2 tasks | 3 files |
| Phase 07-kursus-data-layer-savedcontent P02 | 2min | 2 tasks | 3 files |
| Phase 08 P01 | 56s | 1 tasks | 1 files |
| Phase 09-kursus-header-filter P01 | 1 | 1 tasks | 1 files |
| Phase 09-kursus-header-filter P02 | 2min | 2 tasks | 2 files |
| Phase 10-offboarding-cancel-data-foundation P01 | 12min | 2 tasks | 2 files |

## Accumulated Context

### Roadmap Evolution

- 2026-04-08: Milestone v1.3 MobilePay Checkout added (Phases 10-13). Source spec: docs/superpowers/specs/2026-04-08-mobilepay-subscription-design.md

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Milestone v1.2: 3-phase structure — data layer first (SavedContent model + course service functions), then card/chapter UI, then header + filter UI
- SavedContent model is net-new — requires Prisma migration, must not touch existing models
- ContentUnit model carries bunnyVideoId, thumbnailUrl, mediaType, durationMinutes — all fields needed for CARD-01/CARD-02 already exist
- FILTER-01 filter tabs: "Alle", "Video", "Artikler" — maps to mediaType values VIDEO and TEXT (PDF/AUDIO collapse into Artikler or stay under Alle)
- SAVE-01 spans data model (Phase 7) and profile UI (Phase 7 success criteria includes profile view); bookmark toggle icon on card is CARD-03 in Phase 8

Carried from v1.1:

- Milestone v1.1: 2-phase structure — service layer before UI (nothing to render without resolved data)
- Existing models in scope: UserProfile, UserJourney, DashboardMessage, CheckInOption — no schema changes permitted
- Dashboard state machine: 4 states — new user, active journey, no journey, completed journey
- Admin-configurable messages use existing DashboardMessage model — no new CMS needed

Carried from v1.0:

- Use inline style prop (not Tailwind class) for env() values — Tailwind 4 cannot generate dynamic calc with env() at compile time
- Tab-bar-clearing sticky button pattern: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)
- break-words + hyphens-auto on UGC paragraphs — handles Danish compound words via lang=da on root html
- min-h-[44px] added alongside size prop for touch targets — does not override shadcn Button size styles
- theme_color #1A1A1A in manifest.json matches app dark topbar (brand identity)
- [Phase 05]: DashboardState type exported so Plan 02 and UI can import it without duplication
- [Phase 05]: getPersonalizedWelcome appends to DashboardMessage.body rather than replacing — preserves admin-editable base text
- [Phase 05]: Age group labels: <12m=lille en, 12-36m=tumling, 37-72m=børnehavebarn, >72m=skolebarn
- [Phase 05]: getDashboardState is single entry point for all personalized dashboard data via Promise.all
- [Phase 06]: Dashboard reflection uses findFirst active CheckInOption as technical anchor
- [Phase 06]: Highlighted container: bg-sand-dark + border-l-4 border-coral for warm prominent visual distinction
- [Phase 06]: Unified layout replaces state-based dashboard views for simpler always-visible section structure
- [Phase 07-kursus-data-layer-savedcontent]: Used prisma db push instead of prisma migrate dev due to schema drift in Supabase DB — preserves data while syncing schema
- [Phase 07-kursus-data-layer-savedcontent]: toggleBookmarkAction accepts currentlySaved boolean — caller determines state, action creates or deletes accordingly
- [Phase 07-kursus-data-layer-savedcontent]: getCourseProgress uses Promise.all([lessons, moduleCount]) — single round trip for chapter count alongside lesson data
- [Phase 07-kursus-data-layer-savedcontent]: savedLessonIds is Set<string> (not array) for O(1) has() lookup in Phase 8 LessonCard bookmark toggle
- [Phase 07-kursus-data-layer-savedcontent]: Gemt section conditionally rendered only when savedLessons.length > 0 — no empty state needed at this phase
- [Phase 08]: Used text-[var(--color-coral)] (not text-accent) for saved bookmark state to match coral design token pattern from Phase 6 dashboard
- [Phase 09-kursus-header-filter]: fill + aspect-[16/9] container used for cover image in authenticated header — responsive pattern, no fixed dimensions needed
- [Phase 09-kursus-header-filter]: coverImageUrl sanitized with .replace(/\s+/g, '') — consistent with thumbnailUrl whitespace fix from Phase 8
- [Phase 09-kursus-header-filter]: CourseFilteredView owns filter state — server page delegates chapter rendering entirely, stays async/server
- [Phase 09-kursus-header-filter]: Sets converted with Array.from() at server/client boundary — prevents Next.js serialization error
- [Phase 10-offboarding-cancel-data-foundation]: entitlementId @unique required for Prisma one-to-one relation — compound @@unique alone insufficient
- [Phase 10-offboarding-cancel-data-foundation]: No webhookSentAt field — NO-Zapier scope decision excludes all webhook code from Phase 10
- [Phase 10-offboarding-cancel-data-foundation]: CancellationReason slugs are stable identifiers — seed upserts label but never changes slug

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 8 UI depends on Phase 7 SavedContent service being available — do not start Phase 8 until Phase 7 is complete
- Prisma migration in Phase 7 must be verified against Supabase free-tier limits before running
- Confirm exact mediaType enum values in ContentUnit before building FILTER-01 filter logic in Phase 9

## Session Continuity

Last session: 2026-04-08T20:16:39.121Z
Stopped at: Completed 10-01-PLAN.md
Resume file: None
