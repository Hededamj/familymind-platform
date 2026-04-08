# Phase 09 Validation Strategy

**Phase:** 09-kursus-header-filter
**Type:** Visual / UI
**Verification gate:** Human checkpoint

## Why Human Verification

This phase is **purely visual UI work**. Both requirements (COURSE-03 cover image, FILTER-01 content-type filter tabs) produce changes that can only be meaningfully validated by a human looking at the rendered course page.

- No automated test framework exists in this project (no jest, vitest, or playwright configured)
- Requirements are about visual presence, layout, and user interaction — not business logic
- The research phase (09-RESEARCH.md) explicitly confirmed: "All validation for Phase 9 is manual/visual"

## Automated Checks (gate to human review)

Before handing off to human verification, every task runs:

```bash
npx tsc --noEmit
```

This catches:
- Type errors in CourseFilteredView prop shapes
- Set/Array serialization boundary mistakes at compile time (when typed explicitly)
- Missing imports
- Broken references in page.tsx after restructuring

`tsc` passing is a necessary (not sufficient) condition for phase completion.

## Human Checkpoint Criteria

After both plans execute cleanly and `npx tsc --noEmit` passes, a human verifies by loading `/courses/{slug}` as an authenticated user with course access:

### COURSE-03 — Cover image
1. Course with `coverImageUrl` set: cover image appears at top of header card, above the title, in 16:9 aspect ratio
2. Course without `coverImageUrl`: header renders the sand-gradient card exactly as Phase 8 left it (no visual regression)
3. Cover image loads without domain whitelist errors (must be a `*.b-cdn.net` URL)

### FILTER-01 — Content-type filter
1. Four pill-style tabs visible below the header card: Alle / Video / Artikler / Lyd
2. "Alle" is active by default (coral background)
3. Tapping "Video" hides all non-VIDEO lessons across every chapter
4. Tapping "Artikler" shows only TEXT and PDF lessons
5. Tapping "Lyd" shows only AUDIO lessons
6. Tapping "Alle" restores the full list
7. Chapters with zero matching lessons disappear from view (instead of showing empty sections)
8. When a filter produces zero results, the message "Ingen {type} i dette forløb" appears
9. No runtime error in browser console about Set serialization ("Only plain objects...")
10. Tabs are at least 44px tall (touch-target compliance from Phase 3)

## Gap Closure Flow

If human verification fails:
1. Human describes the visual/functional issue
2. Run `/gsd:plan-phase 09 --gaps` to create a gap closure plan
3. Plan will reference specific truths that failed and fix the underlying artifact
