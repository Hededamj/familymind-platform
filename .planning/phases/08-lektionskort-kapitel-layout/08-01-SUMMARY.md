---
phase: 08-lektionskort-kapitel-layout
plan: "01"
subsystem: courses-ui
tags: [lesson-card, bookmark, thumbnail, optimistic-ui, mobile]
dependency_graph:
  requires: [07-02-SUMMARY.md]
  provides: [LessonCard component for ChapterSection in Plan 02]
  affects: [app/courses/[slug]/page.tsx (consumed by ChapterSection)]
tech_stack:
  added: []
  patterns: [optimistic-useState-toggle, next-image-fill, lucide-react-icons, shadcn-badge]
key_files:
  created:
    - app/courses/[slug]/_components/LessonCard.tsx
  modified: []
decisions:
  - "Used text-[var(--color-coral)] (not text-accent) for saved bookmark state — matches border-coral pattern from Phase 6 dashboard"
  - "typeLabels map defined as module-level const outside component — avoids recreation on each render"
  - "Bookmark button is a <button> inside <Link> — e.preventDefault + e.stopPropagation prevents link navigation on bookmark tap"
metrics:
  duration: "~1 min"
  completed: "2026-04-06"
  tasks: 1
  files: 1
---

# Phase 08 Plan 01: LessonCard Component Summary

LessonCard client component with Bunny CDN thumbnail or PlayCircle fallback, type badge, duration, and optimistic coral bookmark toggle at 44px touch target in a fixed 160px shrink-0 card.

## What Was Built

Created `app/courses/[slug]/_components/LessonCard.tsx` — a `'use client'` component that is the visual building block for the Phase 8 course page redesign.

**Component features:**
- Root `<Link>` wrapping entire card, href=`/content/${lesson.slug}?course=${courseSlug}`, fixed `w-[160px] shrink-0` for horizontal scroll
- Thumbnail area: `<Image fill sizes="160px" className="object-cover">` when thumbnailUrl is present; `<PlayCircle>` fallback div when null
- Bookmark button: `absolute right-1 top-1`, `min-h-[44px] min-w-[44px]`, `bg-white/80 backdrop-blur-sm`, with coral fill on saved state
- Optimistic toggle: `useState(initialSaved)`, `e.preventDefault()`, `e.stopPropagation()`, then `toggleBookmarkAction(lesson.id, isSaved)`
- Card body: `line-clamp-2` title, `<Badge variant="secondary">` with typeLabel map, durationMinutes display

## Decisions Made

- Used `text-[var(--color-coral)]` with `fill-current` for saved bookmark (not `text-accent`) — matches the coral design token used in dashboard highlight patterns
- Bookmark `<button>` inside `<Link>` with `preventDefault + stopPropagation` — standard pattern to prevent link activation on bookmark tap

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — component is complete and wires directly to `toggleBookmarkAction`.

## Self-Check: PASSED
