# Phase 9: Kursus-header + Filter — Research

**Researched:** 2026-04-06
**Domain:** Next.js App Router — client/server component boundary, cover image rendering, client-side filter state
**Confidence:** HIGH

---

## Summary

Phase 9 has two distinct problems: (1) adding a cover image to the existing course header card, and (2) introducing a client-side content-type filter that hides/shows lessons across all chapter sections. Both are purely UI changes — no new data fetching or Prisma work is required. All the data is already present.

The cover image (`Product.coverImageUrl`) is already fetched by `getProduct()`, already rendered on the unauthenticated landing page, and already whitelisted in `next.config.ts` for Bunny CDN (`*.b-cdn.net`). The only work is surfacing it inside the authenticated course header card that Phase 8 built.

The filter is the architecturally interesting problem. `page.tsx` is a server component. `ChapterSection` is also a server component. `LessonCard` is the only client component (`'use client'`). Filtering by mediaType requires React state, which means introducing a new client component — a `CourseFilteredView` wrapper — that receives all lessons from the server, owns the active-filter state, and renders `ChapterSection` components with already-filtered lesson arrays. This avoids converting the entire page to a client component and keeps data fetching on the server.

**Primary recommendation:** Extract the authenticated course view into a `CourseFilteredView` client component. The server page passes all lesson data as props; the client component owns filter state and re-groups filtered lessons per chapter before rendering `ChapterSection` components.

---

## Standard Stack

### Core (already in project — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js Image | 15.x | Optimised cover image rendering | Already used in page.tsx for landing cover image |
| React useState | 18.x | Filter tab active state | Client-side only, no server round-trip needed |
| Tailwind CSS | 4.x | Styling tabs and header layout | Project standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui (existing) | — | Tab styling base if desired | Can use plain buttons; shadcn Tabs adds keyboard nav |
| lucide-react | — | Icons for filter tabs | Already imported in LessonCard |

**No new packages required for this phase.**

---

## Architecture Patterns

### Current component tree (Phase 8 result)

```
page.tsx                           ← async Server Component
  └─ ChapterSection.tsx            ← Server Component (no 'use client')
       └─ LessonCard.tsx           ← Client Component ('use client')
```

### Recommended structure after Phase 9

```
page.tsx                           ← async Server Component (unchanged — fetches data)
  └─ CourseFilteredView.tsx        ← NEW Client Component ('use client')
       ├─ CourseHeader.tsx         ← sub-component (can be inline or extracted)
       │    └─ cover image, title, description, progress bar, chapter count
       ├─ FilterTabs.tsx           ← sub-component (Alle / Video / Artikler / Lyd)
       └─ ChapterSection.tsx       ← Server Component called from client — this works fine
            └─ LessonCard.tsx      ← Client Component
```

`page.tsx` builds the full lesson arrays and passes them to `CourseFilteredView` as a prop. `CourseFilteredView` owns `activeFilter` state, filters the lesson lists, and re-groups by chapter before rendering.

### Pattern 1: Client wrapper for server-fetched data

```typescript
// app/courses/[slug]/_components/CourseFilteredView.tsx
'use client'

import { useState } from 'react'
import { ChapterSection } from './ChapterSection'

type MediaFilter = 'ALL' | 'VIDEO' | 'ARTIKLER' | 'LYD'

// Lesson type with mediaType included (already passed from page.tsx)
interface ChapterData {
  id: string
  title: string
  lessons: LessonItem[]
}

export function CourseFilteredView({
  chapters,
  unassignedLessons,
  courseSlug,
  savedLessonIds,
  completedLessonIds,
}: CourseFilteredViewProps) {
  const [activeFilter, setActiveFilter] = useState<MediaFilter>('ALL')

  function filterLesson(lesson: LessonItem): boolean {
    if (activeFilter === 'ALL') return true
    if (activeFilter === 'VIDEO') return lesson.mediaType === 'VIDEO'
    if (activeFilter === 'ARTIKLER') return lesson.mediaType === 'TEXT' || lesson.mediaType === 'PDF'
    if (activeFilter === 'LYD') return lesson.mediaType === 'AUDIO'
    return true
  }

  // Filter lessons per chapter, skip chapters with 0 matches
  const filteredChapters = chapters
    .map(ch => ({ ...ch, lessons: ch.lessons.filter(filterLesson) }))
    .filter(ch => ch.lessons.length > 0)

  const filteredUnassigned = unassignedLessons.filter(filterLesson)

  return (
    <>
      <FilterTabs active={activeFilter} onChange={setActiveFilter} />
      <div className="space-y-8 mt-4">
        {filteredChapters.map(ch => (
          <ChapterSection key={ch.id} title={ch.title} lessons={ch.lessons} ... />
        ))}
        {filteredUnassigned.length > 0 && (
          <ChapterSection title="Øvrige lektioner" lessons={filteredUnassigned} ... />
        )}
        {filteredChapters.length === 0 && filteredUnassigned.length === 0 && (
          <EmptyFilterState filter={activeFilter} />
        )}
      </div>
    </>
  )
}
```

Key insight: `ChapterSection` receives only the pre-filtered lessons. It does not need to know about the filter — it already has an early return when `lessons.length === 0`, so chapters with no matching lessons disappear cleanly.

### Pattern 2: Cover image in the header card

The landing page already renders `product.coverImageUrl` correctly with `next/image`. The same pattern applies inside the authenticated header card. Two layout options are viable:

**Option A — Full-bleed image above the text card (recommended for mobile):**
```tsx
<div className="mb-8 overflow-hidden rounded-2xl">
  {product.coverImageUrl && (
    <div className="relative aspect-[16/9] w-full">
      <Image
        src={product.coverImageUrl}
        alt={product.title}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, 672px"
        priority
      />
    </div>
  )}
  {/* existing sand-gradient content area below the image */}
  <div className="bg-gradient-to-br from-[var(--color-sand)] to-white p-5 sm:p-6">
    ...
  </div>
</div>
```

**Option B — Image as background with gradient overlay (cinematic):**
```tsx
<div className="relative mb-8 overflow-hidden rounded-2xl">
  {product.coverImageUrl && (
    <>
      <div className="relative aspect-[16/9] w-full">
        <Image src={product.coverImageUrl} alt="" fill className="object-cover" />
      </div>
      {/* gradient fade from image into content */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--color-sand)] to-transparent" />
    </>
  )}
  <div className="relative ...">
    ...title, description, progress...
  </div>
</div>
```

Option A is simpler, more robust at small screen widths, and easier to implement. Option B is more dramatic but can cause legibility issues. **Recommend Option A for Phase 9.**

Without `coverImageUrl`, the card stays exactly as Phase 8 left it (sand gradient only). No visual regression.

### Pattern 3: Filter tab component

```tsx
// FilterTabs — purely visual, owned by CourseFilteredView
const FILTERS = [
  { id: 'ALL',      label: 'Alle' },
  { id: 'VIDEO',    label: 'Video' },
  { id: 'ARTIKLER', label: 'Artikler' },
  { id: 'LYD',      label: 'Lyd' },
] as const

function FilterTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {FILTERS.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors
            ${active === f.id
              ? 'bg-[var(--color-coral)] text-white'
              : 'bg-[var(--color-sand)] text-muted-foreground hover:bg-[var(--color-sand-dark)]'
            }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
```

Pill-style tabs on a scrollable row handle narrow screens without wrapping. No dependency on shadcn Tabs needed (which adds keyboard nav complexity for minimal gain here).

### Anti-Patterns to Avoid

- **Converting page.tsx to a client component:** Eliminates server-side data fetching benefits. All DB calls happen on the server — keep them there.
- **Filtering at ChapterSection level via a prop:** Requires threading filter state through every component in the tree. Centralise in the client wrapper instead.
- **Re-fetching data on filter change:** All 4 media types are already loaded. Filter is purely in-memory.
- **Showing empty ChapterSection components:** The existing `if (lessons.length === 0) return null` in ChapterSection handles this correctly — the caller just needs to pass already-filtered lessons.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Aspect ratio image container | Custom CSS aspect hacks | `aspect-[16/9]` Tailwind class + `fill` on Image | Already works in project |
| Horizontal tab overflow scroll | Custom JS scroll logic | `overflow-x-auto` + `scrollbar-none` | Same pattern as horizontal chapter scroll in Phase 8 CHAP-02 |
| Responsive image sizing | Manual srcset | `sizes` prop on `next/image` | Bunny CDN serves correct size via Next.js optimisation |

---

## Filter Tab Design — AUDIO Decision

**Question from brief:** Should AUDIO be its own tab or grouped?

**Finding:** `LessonCard` already labels AUDIO as "Lyd" and uses a violet gradient. The project already treats it as a first-class media type. Including it as a "Lyd" tab is consistent with existing card labelling and makes it discoverable.

**Recommendation:** Four tabs — Alle / Video / Artikler / Lyd.

- "Artikler" = TEXT + PDF (both are written reading formats; combining them is the intuitive grouping for a parent audience)
- "Lyd" = AUDIO only
- "Video" = VIDEO only

This means every mediaType value in the enum is covered by a filter tab, with no orphaned content.

---

## Cover Image — Where It Lives

| Location | How coverImageUrl is used |
|----------|--------------------------|
| `Product` model (Prisma) | `coverImageUrl String?` — nullable, stored as absolute URL |
| `getProduct(slug)` query | Included in the product object returned — already available in `page.tsx` |
| Unauthenticated landing page | `page.tsx` lines 229-241 — `<Image src={product.coverImageUrl} ...>` inside a `-mt-8` card |
| `next.config.ts` | `remotePatterns` includes `*.b-cdn.net` — covers Bunny CDN. Other CDN hosts (e.g. Vercel blob, Cloudflare) are NOT whitelisted. |

If an admin stores a cover image from a domain other than `*.b-cdn.net` or `*.vercel.app`, Next.js Image will throw a domain error. This is an existing constraint — not new to Phase 9 — but worth noting. No fix is needed within this phase.

---

## Data Shape — What page.tsx Must Pass to CourseFilteredView

Currently `page.tsx` builds lessons inline per module. To pass to the client wrapper, extract chapters as a typed array. The shape needed:

```typescript
// Structure to pass as prop to CourseFilteredView
type ChapterData = {
  id: string      // module.id (for key)
  title: string   // module.title
  lessons: LessonItem[]
}

type LessonItem = {
  id: string
  slug: string
  title: string
  mediaType: string          // 'VIDEO' | 'AUDIO' | 'PDF' | 'TEXT'
  durationMinutes: number | null
  thumbnailUrl: string | null
}
```

`page.tsx` already constructs this data — it just needs to be collected into a `chapters` array instead of being rendered inline. This is a refactor of ~30 lines, not new logic.

---

## Empty State

When a filter produces no results across all chapters, show a minimal inline message rather than a blank scroll area:

```tsx
function EmptyFilterState({ filter }: { filter: string }) {
  const label = filter === 'VIDEO' ? 'videoer'
    : filter === 'ARTIKLER' ? 'artikler'
    : filter === 'LYD' ? 'lydlektioner'
    : 'lektioner'
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">
      Ingen {label} i dette forløb
    </div>
  )
}
```

---

## Common Pitfalls

### Pitfall 1: Passing Sets (savedLessonIds, completedLessonIds) to a client component

**What goes wrong:** `Set` objects can't be serialised over the server/client boundary via props. The page already uses `new Set<string>()`. If `CourseFilteredView` is a client component and receives a `Set` as prop from the server page, Next.js will throw a serialisation error.

**How to avoid:** Pass the IDs as `string[]` arrays from the server. The client wrapper constructs the Sets itself:

```typescript
// page.tsx passes:
savedLessonIds={Array.from(savedLessonIds)}
completedLessonIds={Array.from(completedLessonIds)}

// CourseFilteredView constructs:
const savedSet = useMemo(() => new Set(savedLessonIds), [savedLessonIds])
const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds])
```

**Warning signs:** Runtime error "Only plain objects, and a few built-ins, can be passed to Client Components from Server Components."

### Pitfall 2: coverImageUrl with whitespace/newline from import

**What goes wrong:** `page.tsx` already sanitises `contentUnit.thumbnailUrl` (see `resolveThumbnail`). The same bug may affect `product.coverImageUrl` if imported via CSV. The existing pattern is `.replace(/\s+/g, '')`.

**How to avoid:** Apply the same sanitisation before passing to `<Image src={}>`:
```tsx
src={product.coverImageUrl?.replace(/\s+/g, '') ?? ''}
```

**Warning signs:** Next.js Image error with URL containing `\n`.

### Pitfall 3: Forgetting to handle the "no modules" fallback with filter

**What goes wrong:** `page.tsx` has three branches for rendering lessons: module-based, unassigned, and "no modules at all" (single flat chapter). If only the first two are threaded through `CourseFilteredView`, courses without modules will show blank content.

**How to avoid:** `CourseFilteredView` should handle all three cases. Pass a `noModules: boolean` flag or unify: if `chapters` array is empty, treat all lessons as unassigned.

---

## Code Examples

### Verified: How page.tsx currently uses coverImageUrl (lines 229-241)

```tsx
// Unauthenticated landing page — existing pattern in page.tsx
{product.coverImageUrl && (
  <section className="px-4 sm:px-8">
    <div className="mx-auto -mt-8 max-w-4xl overflow-hidden rounded-2xl shadow-lg">
      <Image
        src={product.coverImageUrl}
        alt={product.title}
        width={1200}
        height={675}
        className="h-full w-full object-cover"
      />
    </div>
  </section>
)}
```

For the authenticated header, replace `width`/`height` with `fill` inside an `aspect-[16/9]` container (responsive, no fixed pixel dimensions needed).

### Verified: ChapterSection already handles empty lessons

```tsx
// ChapterSection.tsx line 25
if (lessons.length === 0) return null
```

This means passing an empty filtered array to ChapterSection is safe — it will render nothing without an explicit empty-state check at the ChapterSection level.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Pages Router: client fetch for filters | App Router: server fetches all data, client component filters in-memory | No loading states needed for filter — instant |
| Wrapping entire page in `'use client'` | Only the interactive subtree is a client component | Server rendering preserved for SEO and initial load |

---

## Open Questions

1. **Should the cover image be 16:9 or a taller ratio?**
   - What we know: Landing page uses `width={1200} height={675}` (16:9). Most course cover images in the wild are 16:9.
   - What's unclear: Whether admin-uploaded images are consistently 16:9 or vary.
   - Recommendation: Use `aspect-[16/9]` with `object-cover` — crops gracefully if ratio differs.

2. **Should filter tabs persist across page navigations (e.g. user goes to a lesson and back)?**
   - What we know: Currently no URL-based filter state. Tabs would reset on back-navigation.
   - What's unclear: Whether this is important enough to warrant URL search params.
   - Recommendation: Not for Phase 9. Simple useState is sufficient. URL-based filter is a v2 enhancement.

3. **What if a course has only one media type (e.g. all VIDEO)?**
   - What we know: Filter tabs would show tabs for empty categories.
   - What's unclear: Whether unused tabs should be hidden or shown disabled.
   - Recommendation: Show all 4 tabs regardless. Consistent UI is less confusing than dynamic tab sets. Empty state handles no-results gracefully.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely UI code changes. No external tools, CLIs, databases, or services beyond the already-running Next.js dev server are required.

---

## Validation Architecture

nyquist_validation is not explicitly set to false in .planning/config.json (key is absent) — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected in project (no jest.config, vitest.config, or pytest.ini found) |
| Config file | None |
| Quick run command | Manual browser test |
| Full suite command | Manual browser test |

No automated test infrastructure exists in this project. All validation for Phase 9 is manual/visual.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COURSE-03 | Cover image appears in header when `coverImageUrl` is set | visual/manual | — | N/A |
| FILTER-01 | Clicking Video tab hides TEXT/PDF/AUDIO lessons across all chapters | visual/manual | — | N/A |
| FILTER-01 | Clicking Artikler tab shows only TEXT and PDF lessons | visual/manual | — | N/A |
| FILTER-01 | Clicking Alle tab restores all lessons | visual/manual | — | N/A |
| FILTER-01 | Empty state appears when filter produces no results | visual/manual | — | N/A |

### Wave 0 Gaps

None — no test files to create. Manual verification is the gate.

---

## Sources

### Primary (HIGH confidence)
- Direct code read: `app/courses/[slug]/page.tsx` — confirmed coverImageUrl usage pattern, current header structure, Set usage for savedLessonIds/completedLessonIds
- Direct code read: `app/courses/[slug]/_components/ChapterSection.tsx` — confirmed server component, lessons.length === 0 guard
- Direct code read: `app/courses/[slug]/_components/LessonCard.tsx` — confirmed 'use client', mediaType values and labels used
- Direct code read: `prisma/schema.prisma` — confirmed `Product.coverImageUrl String?`, `MediaType` enum (VIDEO/AUDIO/PDF/TEXT)
- Direct code read: `next.config.ts` — confirmed `*.b-cdn.net` is the only Bunny CDN pattern whitelisted
- Direct code read: `lib/services/progress.service.ts` — confirmed courseProgress data shape
- Direct code read: `app/globals.css` — confirmed CSS custom properties (--color-sand, --color-coral, --color-sand-dark)

### Secondary (MEDIUM confidence)
- Next.js App Router docs pattern: Server component passes serialisable props to client component — Set serialisation constraint is a well-documented Next.js limitation

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Cover image implementation: HIGH — exact pattern already exists in the same file (landing page branch)
- Filter architecture: HIGH — client/server boundary constraint is confirmed by reading the actual components
- Filter tab design (AUDIO as "Lyd"): HIGH — directly follows existing LessonCard label ("Lyd") and mediaType enum
- Set serialisation pitfall: HIGH — Next.js documented constraint, confirmed by reading how Sets are currently used in page.tsx

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable Next.js App Router patterns)
