---
phase: 07-kursus-data-layer-savedcontent
plan: 01
subsystem: database
tags: [prisma, postgres, savedcontent, bookmarks, supabase]

# Dependency graph
requires: []
provides:
  - SavedContent Prisma model with userId + contentUnitId unique constraint and savedAt index
  - bookmarkLesson, unbookmarkLesson, getSavedLessons, isLessonBookmarked service functions
  - toggleBookmarkAction server action with requireAuth
affects:
  - 07-02 (profile section consuming getSavedLessons)
  - 08-kursus-ui (bookmark toggle UI calling toggleBookmarkAction)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Service-layer pattern with prisma.savedContent upsert/deleteMany/findMany/findUnique
    - Server action delegates to service layer, uses requireAuth for authentication gate

key-files:
  created:
    - prisma/schema.prisma (SavedContent model added)
    - lib/services/savedContent.service.ts
    - app/actions/savedContent.ts
  modified:
    - prisma/schema.prisma (User and ContentUnit relation fields added)

key-decisions:
  - "Used prisma db push instead of prisma migrate dev due to existing schema drift between migration history and Supabase DB"
  - "toggleBookmarkAction accepts currentlySaved boolean — caller determines state, action applies create or delete"

patterns-established:
  - "Bookmark service: upsert for idempotent create, deleteMany for safe delete (no record-not-found error)"
  - "getSavedLessons select pattern: id, title, slug, mediaType, durationMinutes, thumbnailUrl — minimal fields for card rendering"

requirements-completed: [SAVE-01]

# Metrics
duration: 3min
completed: 2026-04-06
---

# Phase 07 Plan 01: SavedContent Data Layer Summary

**SavedContent Prisma model with bookmark CRUD service (upsert/delete/list/check) and toggleBookmarkAction server action for authenticated users**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T17:49:43Z
- **Completed:** 2026-04-06T17:52:36Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- SavedContent table created in Supabase with @@unique([userId, contentUnitId]) and @@index([userId, savedAt])
- Bookmark service with 4 functions: bookmarkLesson (upsert), unbookmarkLesson (deleteMany), getSavedLessons (findMany with contentUnit select), isLessonBookmarked (findUnique)
- Server action toggleBookmarkAction wired to requireAuth + service layer, ready for Phase 8 UI to call

## Task Commits

Each task was committed atomically:

1. **Task 1: Add SavedContent Prisma model and run migration** - `5379555` (feat)
2. **Task 2: Create bookmark service and server action** - `9a3e5ec` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `prisma/schema.prisma` - Added SavedContent model, User.savedContent relation, ContentUnit.savedContent relation
- `lib/services/savedContent.service.ts` - Bookmark CRUD service with 4 exported functions
- `app/actions/savedContent.ts` - toggleBookmarkAction server action with requireAuth

## Decisions Made
- Used `prisma db push` instead of `prisma migrate dev` because the Supabase database had schema drift (a `20260317171120_add_media_library` migration applied directly to DB was not in the local migrations directory). `db push` synced the schema without requiring a reset or loss of data.
- `toggleBookmarkAction` accepts `currentlySaved: boolean` from the caller — the UI component knows current state and passes it; the action applies create or delete accordingly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used prisma db push instead of prisma migrate dev**
- **Found during:** Task 1 (migration step)
- **Issue:** `prisma migrate dev` detected schema drift between local migration history and Supabase DB (`20260317171120_add_media_library` was applied to DB but missing locally). It required a database reset which would destroy all data.
- **Fix:** Used `prisma db push` which syncs the schema directly without touching migration history, preserving all data.
- **Files modified:** prisma/schema.prisma (schema unchanged, DB was updated)
- **Verification:** `prisma migrate status` reports "Database schema is up to date!", Prisma Client regenerated with SavedContent types, both service/action files verified via `npx tsx` import check.
- **Committed in:** 5379555 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required deviation to avoid data loss. Schema and client state are identical to plan spec. No scope creep.

## Issues Encountered
- Supabase DB had additional schema changes applied directly (media library changes) not tracked in local migrations directory. Resolved by switching migration strategy to db push.

## User Setup Required
None - no external service configuration required beyond existing DATABASE_URL and DIRECT_URL env vars.

## Next Phase Readiness
- SavedContent table exists in DB with correct constraints and indexes
- Bookmark service exports 4 functions ready for Plan 02 profile section and Phase 8 UI
- toggleBookmarkAction ready for Phase 8 bookmark toggle card component
- Phase 8 UI can call `toggleBookmarkAction(contentUnitId, currentlySaved)` from a client component
- Plan 02 can call `getSavedLessons(userId)` to display user's saved lessons in profile

---
*Phase: 07-kursus-data-layer-savedcontent*
*Completed: 2026-04-06*

## Self-Check: PASSED

- FOUND: lib/services/savedContent.service.ts
- FOUND: app/actions/savedContent.ts
- FOUND: prisma/schema.prisma
- FOUND: 07-01-SUMMARY.md
- FOUND commit: 5379555
- FOUND commit: 9a3e5ec
