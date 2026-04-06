---
phase: 08-lektionskort-kapitel-layout
plan: "02"
subsystem: courses-ui
tags: [chapter-section, horizontal-scroll, progress-bar, lesson-card, mobile]
dependency_graph:
  requires: [08-01-SUMMARY.md]
  provides: [ChapterSection component, restructured course page with chapter layout]
  affects: [app/courses/[slug]/page.tsx, app/courses/[slug]/_components/ChapterSection.tsx]
tech_stack:
  added: []
  patterns: [horizontal-scroll-hidden-scrollbar, server-component, contentUnit-mapping, coral-sand-progress-bar]
key_files:
  created:
    - app/courses/[slug]/_components/ChapterSection.tsx
  modified:
    - app/courses/[slug]/page.tsx
decisions:
  - "ChapterSection is a server component (no 'use client') — LessonCard handles client interactivity"
  - "Horizontal scrollbar hidden via [scrollbar-width:none] (Firefox) + [&::-webkit-scrollbar]:hidden (Chrome/Safari/Edge)"
  - "contentUnit fields mapped in page.tsx before passing to ChapterSection — ChapterSection receives clean lesson shape, not raw CourseLesson"
  - "Progress bar uses bg-[var(--color-coral)] fill on bg-[var(--color-sand)] track — matches coral design token pattern"
  - "Removed unused imports (redirect, Badge, CheckCircle, mediaTypeIcons) to keep file clean"
metrics:
  duration: "~3 min"
  completed: "2026-04-06"
  tasks: 2
  files: 2
---

# Phase 08 Plan 02: ChapterSection Layout Summary

ChapterSection server component and restructured course page with horizontal-scrolling chapter sections, hidden scrollbar, progress bar (coral/sand), and "Øvrige lektioner" for unassigned lessons — replacing the old vertical LessonRow layout.

## What Was Built

### ChapterSection.tsx (new)

Server component at `app/courses/[slug]/_components/ChapterSection.tsx`:
- Named `<section>` with `<h2>` heading matching module title
- Horizontal scroll row: `flex gap-3 overflow-x-auto scroll-smooth pb-2`
- Scrollbar hidden: `[scrollbar-width:none]` (Firefox) + `[&::-webkit-scrollbar]:hidden` (Chrome/Safari/Edge)
- Returns null for empty lesson arrays (CHAP-02 compliance)
- Passes `savedLessonIds.has(lesson.id)` to each LessonCard

### page.tsx (restructured)

Replaced the `LessonRow` inline function and border-divided vertical list with:
- Visual progress bar: `h-2 rounded-full bg-[var(--color-sand)]` track + `bg-[var(--color-coral)]` fill at `percentComplete%`
- Module-based ChapterSection instances sorted by position
- Unassigned lessons in a "Øvrige lektioner" ChapterSection (CHAP-03)
- No-modules fallback: single "Lektioner" ChapterSection with all lessons
- contentUnit fields mapped in page.tsx before passing to ChapterSection

## Decisions Made

- ChapterSection is a pure server component — LessonCard owns all client state (optimistic bookmark toggle)
- contentUnit mapping done in parent (page.tsx), not in ChapterSection — keeps ChapterSection props clean and reusable
- Progress bar uses existing coral/sand design tokens — no new CSS variables needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Cleanup] Removed unused imports after LessonRow removal**
- **Found during:** Task 2
- **Issue:** After removing LessonRow and mediaTypeIcons, the imports `redirect`, `Badge`, `CheckCircle`, `FileText`, `Headphones`, `Type`, `PlayCircle` were no longer used in the file
- **Fix:** Removed unused imports; kept only `notFound`, `Button`, `Check`, `ChapterSection`
- **Files modified:** app/courses/[slug]/page.tsx
- **Commit:** d6fbf0f

## Known Stubs

None — ChapterSection renders live data from the course page data fetch.

## Self-Check: PASSED
