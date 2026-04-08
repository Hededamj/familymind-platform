---
phase: 09-kursus-header-filter
verified: 2026-04-06T00:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 09: Kursus Header + Filter Verification Report

**Phase Goal:** Course page has proper header with cover image and content-type filter tabs that narrow the lesson list
**Verified:** 2026-04-06
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Cover image renders above header when product.coverImageUrl exists | VERIFIED | page.tsx line 115: `{product.coverImageUrl && (` wraps `<div className="relative aspect-[16/9] w-full">` with `<Image fill>` |
| 2 | coverImageUrl is sanitized before passing to next/image | VERIFIED | page.tsx line 118: `src={product.coverImageUrl.replace(/\s+/g, '')}` |
| 3 | Header renders unchanged when coverImageUrl is absent | VERIFIED | Conditional block — no coverImageUrl means the image wrapper is simply skipped; gradient+title+progress always render |
| 4 | User sees four filter tabs: Alle, Video, Artikler, Lyd | VERIFIED | CourseFilteredView.tsx lines 32-37: FILTERS array with all four labels |
| 5 | Clicking a filter hides non-matching lessons across chapters | VERIFIED | matchesFilter() at line 39-45; filteredChapters re-computed on activeFilter state change; chapters with 0 results removed via `.filter(ch => ch.lessons.length > 0)` |
| 6 | Sets are serialized as arrays at server/client boundary | VERIFIED | page.tsx line 166-167: `Array.from(savedLessonIds)` and `Array.from(completedLessonIds)` — Sets reconstructed in client via useMemo (lines 64-65 of CourseFilteredView.tsx) |
| 7 | Empty state shown when filter produces zero results | VERIFIED | CourseFilteredView.tsx line 117-121: `{!hasResults && <div>Ingen {emptyLabel(activeFilter)} i dette forløb</div>}` |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/courses/[slug]/_components/CourseFilteredView.tsx` | Client component owning filter state | VERIFIED | 125 lines, `'use client'` on line 1, useState + useMemo, four tabs, filtering logic, empty state |
| `app/courses/[slug]/page.tsx` | Server component passing arrays (not Sets) to CourseFilteredView | VERIFIED | Imports CourseFilteredView, passes `Array.from(savedLessonIds)` and `Array.from(completedLessonIds)` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| page.tsx | CourseFilteredView | `import { CourseFilteredView }` + `<CourseFilteredView ...>` call | WIRED | page.tsx line 12 (import), line 161 (render) |
| page.tsx | CourseFilteredView (serialization) | `Array.from(savedLessonIds)` / `Array.from(completedLessonIds)` | WIRED | Lines 166-167 — no raw Set crossing the boundary |
| CourseFilteredView | ChapterSection | Pre-filtered lesson arrays per chapter | WIRED | Lines 96-115: filteredChapters.map renders ChapterSection; filteredUnassigned also passed to ChapterSection |
| page.tsx authenticated branch | cover image | `{product.coverImageUrl && ...}` conditional with `<Image fill>` inside `aspect-[16/9]` | WIRED | Lines 115-125 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| CourseFilteredView | chapters, unassignedLessons | Server: `chaptersData` built from `product.courseLessons` + `product.modules` (Prisma query via getProduct) | Yes — maps real DB lesson records | FLOWING |
| CourseFilteredView | savedLessonIds | Server: `getSavedLessons(user.id)` DB query, converted with `Array.from()` | Yes | FLOWING |
| CourseFilteredView | completedLessonIds | Server: `getCourseProgress(user.id, product.id)` DB query, converted with `Array.from()` | Yes | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — filter tabs require browser interaction (useState/onClick). No runnable entry point to test client-side state transitions programmatically without a running server.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| COURSE-03 | 09-01-PLAN.md | Kursus-header viser cover-billede hvis tilgængeligt | SATISFIED | page.tsx: conditional `<Image fill>` in `aspect-[16/9]` wrapper with URL sanitization |
| FILTER-01 | 09-02-PLAN.md | Content-type filter tabs filtrerer lektioner | SATISFIED | CourseFilteredView.tsx: four tabs, matchesFilter logic for VIDEO/TEXT/PDF/AUDIO, chapter hiding, empty state |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No TODOs, placeholders, hardcoded empty returns, or stub patterns found in the phase's files.

---

### Human Verification Required

#### 1. Cover image visual rendering

**Test:** Navigate to `/courses/{slug}` as authenticated user with access, where the product has a coverImageUrl set.
**Expected:** A 16:9 cover image appears at the top of the header card, above the title and progress bar.
**Why human:** next/image CDN resolution and visual layout cannot be verified without a running browser.

#### 2. Filter tab interaction

**Test:** On the authenticated course page, click each tab (Video, Artikler, Lyd, Alle) in sequence.
**Expected:** Lessons visibly disappear/reappear based on their mediaType. Chapters with no matching lessons vanish entirely. Empty-state message appears when the filter produces zero results.
**Why human:** useState interactivity requires a browser; client-side rendering cannot be asserted from static analysis.

#### 3. No runtime Set serialization error

**Test:** Open the course page as authenticated user with browser devtools console open.
**Expected:** No "Only plain objects, arrays, and primitives can be passed to Client Components" error.
**Why human:** Next.js serialization errors surface at runtime, not statically.

---

### Gaps Summary

No gaps found. All seven observable truths are verified by the actual code. Both requirements (COURSE-03, FILTER-01) are satisfied. The Set serialization boundary is correctly handled with `Array.from()` on the server side and `useMemo(() => new Set(...))` on the client side. Three items are routed to human testing due to their visual/interactive nature.

---

_Verified: 2026-04-06_
_Verifier: Claude (gsd-verifier)_
