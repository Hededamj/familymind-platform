---
phase: 07-kursus-data-layer-savedcontent
verified: 2026-04-06T21:00:00Z
status: gaps_found
score: 6/7 must-haves verified
gaps:
  - truth: "The course page shows a pre-computed percentComplete value (0-100) from getCourseProgress"
    status: partial
    reason: "REQUIREMENTS.md defines COURSE-01 as 'progress-bar med procent completion' — the page renders only text ('42% gennemfort'), not a visual progress bar element. The data value is correct and wired but the requirement specifies a bar, which is absent."
    artifacts:
      - path: "app/courses/[slug]/page.tsx"
        issue: "Line 114 renders '{{ courseProgress.percentComplete }}% gennemfort' as plain text. No <progress> element, no div with dynamic width/style, no visual bar UI."
    missing:
      - "A visual progress bar element (e.g. a div with style={{ width: `${percentComplete}%` }} or a <progress> element) in the hasAccess render branch of app/courses/[slug]/page.tsx"
human_verification:
  - test: "Visit /courses/[slug] as a user with course access and check that a visual progress bar is rendered above the lesson list"
    expected: "A filled bar element showing completion percentage, not just the text '42% gennemfort'"
    why_human: "Visual presence of the bar cannot be confirmed from static code analysis alone — the bar could be rendered by a child component not visible in this file"
---

# Phase 07: Kursus Data Layer + SavedContent Verification Report

**Phase Goal:** The course page has all the server-side data it needs — module metadata, computed duration, completion percentage, and a working bookmark model — so UI phases can focus purely on rendering
**Verified:** 2026-04-06T21:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A SavedContent table exists in the database with userId + contentUnitId unique constraint | VERIFIED | schema.prisma lines 396-407: `model SavedContent` with `@@unique([userId, contentUnitId])` and `@@index([userId, savedAt])`. DB is in sync (`prisma migrate status` → "Database schema is up to date!") |
| 2 | bookmarkLesson creates a record, unbookmarkLesson deletes it, getSavedLessons returns user bookmarks | VERIFIED | lib/services/savedContent.service.ts exports all four functions: upsert, deleteMany, findMany with contentUnit select, findUnique |
| 3 | toggleBookmarkAction server action calls bookmark/unbookmark with authenticated user | VERIFIED | app/actions/savedContent.ts starts with `'use server'`, calls `requireAuth()`, delegates to bookmarkLesson/unbookmarkLesson |
| 4 | The course page shows a pre-computed percentComplete value (0-100) from getCourseProgress | PARTIAL | `courseProgress.percentComplete` is computed correctly in progress.service.ts and rendered as text on line 114. However REQUIREMENTS.md COURSE-01 specifies "progress-bar med procent completion" — no visual bar element exists in the page |
| 5 | The course page shows chapter count and total estimated duration as ready-to-render values | VERIFIED | Lines 115-120 of course page render `courseProgress.chapterCount` and `courseProgress.totalDurationMinutes`. getCourseProgress computes both via `Promise.all([lessons, courseModule.count])` and `lessons.reduce` |
| 6 | The profile page has a Gemt section listing the user's bookmarked lessons | VERIFIED | app/dashboard/profile/page.tsx lines 65-88: conditional Gemt section with Bookmark icon, lesson titles as links to /content/[slug], min-h-[44px] touch targets, media type labels |
| 7 | Bookmarked lesson IDs are available as a Set on the course page for Phase 8 bookmark toggle | VERIFIED | Lines 45-56 declare `let savedLessonIds = new Set<string>()` and populate it from `getSavedLessons` via `Promise.all`. Set is declared in scope and available for Phase 8 to pass to child components |

**Score:** 6/7 truths verified (1 partial)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | SavedContent model with @@unique([userId, contentUnitId]) and @@index([userId, savedAt]) | VERIFIED | Lines 396-407: model present, both constraints present. User.savedContent and ContentUnit.savedContent relation arrays added (lines 150, 252) |
| `lib/services/savedContent.service.ts` | Bookmark CRUD service | VERIFIED | 42 lines. Exports: bookmarkLesson (upsert), unbookmarkLesson (deleteMany), getSavedLessons (findMany with contentUnit select, orderBy savedAt desc), isLessonBookmarked (findUnique) |
| `app/actions/savedContent.ts` | Server action for bookmark toggle | VERIFIED | 13 lines. `'use server'`, requireAuth, toggleBookmarkAction using currentlySaved boolean to branch |
| `lib/services/progress.service.ts` | Extended getCourseProgress returning chapterCount and totalDurationMinutes | VERIFIED | Lines 32-78: Promise.all([lessons, courseModule.count]), chapterCount = moduleCount, totalDurationMinutes = reduce with ?? 0 null coercion |
| `app/courses/[slug]/page.tsx` | Course page rendering percentComplete, chapterCount, totalDurationMinutes, savedLessonIds | PARTIAL | percentComplete, chapterCount, totalDurationMinutes all rendered as text (lines 113-121). savedLessonIds Set declared and populated. No visual progress bar element. |
| `app/dashboard/profile/page.tsx` | Profile page with Gemt section showing bookmarked lessons | VERIFIED | getSavedLessons imported and called. Gemt section with Bookmark icon, 44px touch targets, saved.contentUnit.title in Link elements |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| app/actions/savedContent.ts | lib/services/savedContent.service.ts | import { bookmarkLesson, unbookmarkLesson } | WIRED | Line 4: `import { bookmarkLesson, unbookmarkLesson } from '@/lib/services/savedContent.service'` |
| lib/services/savedContent.service.ts | prisma/schema.prisma | prisma.savedContent queries | WIRED | Lines 4, 11, 18, 37: `prisma.savedContent.upsert`, `.deleteMany`, `.findMany`, `.findUnique` |
| app/courses/[slug]/page.tsx | lib/services/progress.service.ts | getCourseProgress call | WIRED | Lines 7, 51-55: import and Promise.all call returning progress |
| app/courses/[slug]/page.tsx | lib/services/savedContent.service.ts | getSavedLessons call for savedLessonIds | WIRED | Lines 8, 51-56: import and Promise.all call populating savedLessonIds Set |
| app/dashboard/profile/page.tsx | lib/services/savedContent.service.ts | getSavedLessons call for profile list | WIRED | Lines 14, 40: import and `const savedLessons = await getSavedLessons(user.id)` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| lib/services/savedContent.service.ts | prisma.savedContent records | Supabase PostgreSQL via Prisma | Yes — live DB queries (upsert, deleteMany, findMany, findUnique) | FLOWING |
| lib/services/progress.service.ts (getCourseProgress) | lessons + moduleCount | prisma.courseLesson.findMany + prisma.courseModule.count | Yes — live DB queries in Promise.all | FLOWING |
| app/courses/[slug]/page.tsx | courseProgress, savedLessonIds | getCourseProgress + getSavedLessons | Yes — both wired to live service functions | FLOWING |
| app/dashboard/profile/page.tsx | savedLessons | getSavedLessons(user.id) | Yes — wired to live service | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| prisma migrate status shows DB in sync | `npx prisma migrate status` | "Database schema is up to date!" | PASS |
| savedContent.service.ts exports 4 functions | file read + pattern check | bookmarkLesson, unbookmarkLesson, getSavedLessons, isLessonBookmarked all present | PASS |
| toggleBookmarkAction uses requireAuth | grep check | requireAuth called on line 7, result used for user.id | PASS |
| getCourseProgress returns chapterCount + totalDurationMinutes | code read | Both in return object at lines 62-78 | PASS |
| Git commits exist for all 4 tasks | git log | 5379555, 9a3e5ec, 6d40465, e5974cb all present | PASS |

Step 7b: No migration file created (db push used) — this is expected per the SUMMARY deviation note. DB state is synced.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SAVE-01 | 07-01, 07-02 | Brugeren kan gemme/bookmark lektioner og se dem under "Gemt" i profilen | SATISFIED | toggleBookmarkAction creates/deletes bookmarks. Profile page Gemt section shows savedLessons from getSavedLessons. Lesson links point to /content/[slug] |
| COURSE-01 | 07-02 | Kursus-siden viser progress-bar med procent completion | PARTIAL | percentComplete value (0-100) is computed and displayed as text "42% gennemfort". No visual progress bar element found in the page. The data layer delivers the value correctly; the bar render is missing. |
| COURSE-02 | 07-02 | Kursus-header viser antal kapitler og total estimeret varighed | SATISFIED | chapterCount and totalDurationMinutes both computed in getCourseProgress and rendered in the course page header block (lines 115-120) |

No orphaned requirements: all three IDs (SAVE-01, COURSE-01, COURSE-02) appear in plan frontmatter and REQUIREMENTS.md maps all three to Phase 7.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| lib/services/progress.service.ts | 124-138 | getUserInProgressCourses pushes to courses without chapterCount or totalDurationMinutes, but the return type references getCourseProgress's shape | Info | Type cast at line 112 forces the push to conform but the pushed object is missing chapterCount and totalDurationMinutes. This is a minor inconsistency — getUserInProgressCourses is used for the dashboard course list which does not display chapter count, so no user-visible impact |

No TODO/FIXME/placeholder comments found in any phase 07 files. No `return null` or empty array stubs. All service functions execute real Prisma queries.

### Human Verification Required

#### 1. Visual Progress Bar for COURSE-01

**Test:** Log in as a user with an active course entitlement. Navigate to /courses/[course-slug]. Inspect the area showing completion percentage.
**Expected:** A visible horizontal bar element that is filled proportionally to the completion percentage, alongside or above the text "X% gennemfort"
**Why human:** The course page renders `percentComplete` as a text string only. No `<progress>` element, `div` with dynamic width style, or bar component is present in the JSX. However the requirement (COURSE-01) specifies "progress-bar" not just "percentage text". A human must confirm whether the current text-only display satisfies the product intent or if a visual bar is required.

### Gaps Summary

One gap was found against the REQUIREMENTS.md definition of COURSE-01:

REQUIREMENTS.md states: "Kursus-siden viser progress-bar med procent completion"

The course page in `app/courses/[slug]/page.tsx` (line 114) renders `{courseProgress.percentComplete}% gennemfort ({courseProgress.completedLessons} af {courseProgress.totalLessons} lektioner)` as a plain text string inside a `<div className="mb-6 text-sm text-muted-foreground">`. There is no bar element — no `<progress>`, no `<div>` with a dynamic width percentage, no shadcn `Progress` component import.

The data layer goal of Phase 07 is fully achieved: percentComplete is computed server-side and available in the page. The gap is a render-layer concern. Since Phase 08 (kursus-ui) is the UI phase, this gap may be intentionally deferred — but the REQUIREMENTS.md marks COURSE-01 as "Complete" for Phase 7, which is premature if "progress-bar" means a visual bar and not just a numeric value.

The gap is classified as **partial** (not failed) because the data contract is met — the value exists, is computed correctly, and is rendered. Only the visual presentation form is in question.

---

_Verified: 2026-04-06T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
