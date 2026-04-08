# Phase 8: Lektionskort + Kapitel-layout - Research

**Researched:** 2026-04-06
**Domain:** React component UI — lesson cards, chapter sections, horizontal scroll, bookmark toggle
**Confidence:** HIGH

## Summary

Phase 8 is a pure UI rendering phase. All server-side data is already available from Phase 7: `savedLessonIds` (Set<string>), `courseProgress.lessons`, modules, and the `toggleBookmarkAction` server action. The job is to replace the current `LessonRow` + border-divided list inside `app/courses/[slug]/page.tsx` with two new components: `LessonCard` (thumbnail + badge + duration + bookmark toggle) and `ChapterSection` (named section with hidden-scrollbar horizontal card row).

The key technical domains are: (1) Next.js `next/image` with a Bunny CDN hostname already whitelisted in `next.config.ts`, (2) CSS-only hidden scrollbar pattern using `overflow-x-auto` + `scrollbar-hide` utility (pure Tailwind, no library), (3) optimistic client-side bookmark toggle using `useState` + server action call without `useTransition` (the existing `DashboardCheckIn` pattern fits), and (4) the project's established component conventions — rounded-2xl borders, `min-h-[44px]` touch targets, Tailwind 4, lucide-react icons, no inline env() needed here.

No new packages are required. The `getThumbnailUrl` helper in `lib/bunny.ts` already constructs `https://${cdnHostname}/${videoId}/thumbnail.jpg`. The `thumbnailUrl` field on `ContentUnit` stores this value directly. The `next/image` remote pattern `*.b-cdn.net` already covers Bunny CDN hostnames. Phase 8 is entirely client + server component composition — zero schema changes, zero new services.

**Primary recommendation:** Build `LessonCard` as a `'use client'` component (needs useState for bookmark toggle), and `ChapterSection` as a server component that maps lessons and passes props. Replace the inline `LessonRow` function in the course page with `ChapterSection` instances.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CARD-01 | Lektionskort viser video-thumbnail fra Bunny CDN eller fallback-billede | `thumbnailUrl` field on ContentUnit; `getThumbnailUrl(bunnyVideoId)` in lib/bunny.ts; `*.b-cdn.net` already in next.config.ts remotePatterns |
| CARD-02 | Lektionskort viser titel, type-badge (VIDEO/TEXT/PDF/AUDIO) og varighed | `mediaType` MediaType enum and `durationMinutes` Int? already on ContentUnit; Badge component in components/ui/badge.tsx; existing mediaTypeIcons map in course page |
| CARD-03 | Lektionskort har bookmark/gem-ikon der toggles on/off | `toggleBookmarkAction(contentUnitId, currentlySaved)` ready; `savedLessonIds.has(id)` O(1) check; pattern: useState + server action call, same as DashboardCheckIn |
| CHAP-01 | Hvert kapitel vises som en sektion med overskrift og horisontal scroll af lektionskort | ChapterSection wraps module.title heading + horizontal-scrolling card row |
| CHAP-02 | Horisontal scroll har usynlig scrollbar og smooth scroll-behavior | Pure CSS: `overflow-x-auto scroll-smooth` + Tailwind `[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]` |
| CHAP-03 | Lektioner uden modul grupperes under "Øvrige lektioner" | Filter `lessons.filter(l => !l.moduleId)` after module loop; render as ChapterSection with title="Øvrige lektioner" |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js `next/image` | 16.1.6 (built-in) | Thumbnail rendering with CDN optimization | Already in project; Bunny CDN hostname whitelisted |
| Tailwind CSS 4 | ^4 | Layout, scrollbar hiding, responsive styles | Project standard — all components use it |
| lucide-react | ^0.564.0 | Bookmark icon (Bookmark / BookmarkCheck or filled variant) | Already imported throughout codebase |
| `components/ui/badge` | shadcn (project) | VIDEO / TEXT / PDF / AUDIO type badge | Already used on course page for typeLabel |

### No New Packages Needed

Phase 8 requires zero new npm installs. Every tool needed is already in the project:
- Horizontal scroll: pure CSS (`overflow-x-auto` + scrollbar-hiding utility classes)
- Optimistic toggle: `useState` in a `'use client'` component + server action
- Thumbnail image: `next/image` with `*.b-cdn.net` already whitelisted

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS scrollbar hide | `react-horizontal-scrolling-menu` | Overkill — CSS-only is sufficient for this use case, no drag needed |
| `useState` bookmark toggle | `useOptimistic` (React 19) | `useOptimistic` is cleaner but requires `useTransition` wrapper; `useState` pattern already established in `DashboardCheckIn` — prefer consistency |
| `next/image` | `<img>` | `next/image` is project standard (used in CourseTile, course page, etc.) |

## Architecture Patterns

### Recommended File Structure
```
app/courses/[slug]/
├── _components/
│   ├── LessonCard.tsx        # 'use client' — bookmark toggle state
│   └── ChapterSection.tsx    # server component — section wrapper + card row
└── page.tsx                  # updated to use ChapterSection instead of LessonRow
```

This follows the Next.js App Router `_components` colocation pattern. `_components` is not a route segment (underscore prefix) and is the established convention for page-level components.

### Pattern 1: LessonCard (client component with optimistic bookmark toggle)

**What:** A card component that receives lesson data + initial bookmark state + server action. Uses `useState` to toggle bookmark visually immediately, then calls server action asynchronously.

**When to use:** Any interactive UI component that needs to call a server action and show immediate feedback without a page reload.

**Example:**
```typescript
// Source: established project pattern from app/dashboard/_components/dashboard-check-in.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toggleBookmarkAction } from '@/app/actions/savedContent'

interface LessonCardProps {
  lesson: {
    id: string
    slug: string
    title: string
    mediaType: string
    durationMinutes: number | null
    thumbnailUrl: string | null
    bunnyVideoId: string | null
  }
  initialSaved: boolean
  courseSlug: string
}

export function LessonCard({ lesson, initialSaved, courseSlug }: LessonCardProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsSaved(!isSaved) // optimistic update
    await toggleBookmarkAction(lesson.id, isSaved)
  }

  const thumbnail = lesson.thumbnailUrl
  // fallback: plain colored placeholder

  return (
    <Link
      href={`/content/${lesson.slug}?course=${courseSlug}`}
      className="relative flex w-[160px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-sand">
        {thumbnail ? (
          <Image src={thumbnail} alt={lesson.title} fill className="object-cover" sizes="160px" />
        ) : (
          <div className="flex h-full items-center justify-center bg-sand">
            {/* fallback icon */}
          </div>
        )}
        {/* Bookmark button */}
        <button
          onClick={handleBookmark}
          className="absolute right-2 top-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm"
          aria-label={isSaved ? 'Fjern bogmærke' : 'Gem lektion'}
        >
          <Bookmark className={`size-4 ${isSaved ? 'fill-current text-accent' : 'text-muted-foreground'}`} />
        </button>
      </div>
      {/* Card body */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{lesson.title}</p>
        <div className="mt-auto flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{lesson.mediaType}</Badge>
          {lesson.durationMinutes && (
            <span className="text-xs text-muted-foreground">{lesson.durationMinutes} min</span>
          )}
        </div>
      </div>
    </Link>
  )
}
```

### Pattern 2: ChapterSection (server component with hidden scrollbar row)

**What:** A section with a heading and a horizontally-scrollable row of `LessonCard` components. No JavaScript for scrolling — pure CSS.

**When to use:** Any horizontal card row that should scroll without showing a scrollbar.

**Example:**
```typescript
// Source: CSS scrollbar-hiding is Tailwind 4 arbitrary property pattern
import { LessonCard } from './LessonCard'

interface ChapterSectionProps {
  title: string
  lessons: Array<{...}>
  savedLessonIds: Set<string>
  courseSlug: string
}

export function ChapterSection({ title, lessons, savedLessonIds, courseSlug }: ChapterSectionProps) {
  return (
    <section>
      <h2 className="mb-3 font-medium">{title}</h2>
      <div className="flex gap-3 overflow-x-auto scroll-smooth pb-2
        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            initialSaved={savedLessonIds.has(lesson.id)}
            courseSlug={courseSlug}
          />
        ))}
      </div>
    </section>
  )
}
```

**CSS scrollbar hiding with Tailwind 4 arbitrary properties:**
```
[scrollbar-width:none]          → Firefox
[&::-webkit-scrollbar]:hidden   → Chrome/Safari/Edge
```
These are standard Tailwind 4 arbitrary property/variant classes — no custom CSS needed.

### Pattern 3: Course page restructuring (replacing LessonRow)

**What:** The `hasAccess` branch in `app/courses/[slug]/page.tsx` currently uses an inline `LessonRow` function and a module loop. Replace this with `ChapterSection` components.

**Grouping logic:**
```typescript
// Lessons with a module → one ChapterSection per module (sorted by position)
// Lessons with no moduleId → one ChapterSection with title "Øvrige lektioner"
const unassignedLessons = lessons.filter((l: any) => !l.moduleId)
```

### Anti-Patterns to Avoid

- **Wrapping `toggleBookmarkAction` in `useTransition`**: The pattern established in `DashboardCheckIn` uses plain async/await with `useState`. Keep consistency — do not introduce `useTransition` unless the planner decides otherwise.
- **Using `getThumbnailUrl()` server-side on the course page**: `getThumbnailUrl` calls `getBunnyConfig()` which throws if env vars are missing. The `thumbnailUrl` field on `ContentUnit` already stores the resolved URL — pass it directly from the DB record. No need to call `getThumbnailUrl` in the card.
- **Making `ChapterSection` a client component**: It only passes data down to `LessonCard`. Keep it a server component — only `LessonCard` needs `'use client'`.
- **Scrollbar hide via JavaScript**: The GSAP/Framer Motion horizontal scroll patterns from the scroll-experience skill are overkill. Pure CSS achieves the requirement with zero bundle cost.
- **Card width with `w-full`**: Cards in a flex row must have a fixed/min width (e.g. `w-[160px]` or `w-[180px]`) with `shrink-0` — otherwise they collapse. This is a common mistake with horizontal flex scroll.
- **Thumbnail fallback with broken `<img>` tag**: Always render a styled placeholder div when `thumbnailUrl` is null. The `next/image` component does not handle null src gracefully.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scrollbar hiding | Custom CSS or JS scroll library | Tailwind arbitrary properties `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` | Two classes, zero JS, works in all modern browsers |
| Thumbnail URL construction | Calling `getThumbnailUrl()` in card | Use `lesson.thumbnailUrl` directly from DB | Already stored; calling bunny.ts from a client component would expose env vars |
| Optimistic bookmark state | `useOptimistic` / complex state machines | `useState` + async server action call | Established project pattern; sufficient for this use case |
| Type badge text | Custom label resolver | Direct `mediaType` value (VIDEO/TEXT/PDF/AUDIO) | Already maps to enum values; capitalise in display |

**Key insight:** The entire phase is CSS composition + passing Phase 7 data down to leaf components. There is no new logic to build — only rendering.

## Common Pitfalls

### Pitfall 1: thumbnailUrl is null for non-video lessons
**What goes wrong:** PDF and TEXT lessons have no Bunny video, so `thumbnailUrl` is null and `bunnyVideoId` is null. Passing null to `next/image` src causes a runtime error.
**Why it happens:** ContentUnit schema has `thumbnailUrl String?` (nullable).
**How to avoid:** Always render a fallback `<div>` when `thumbnailUrl` is null. Pattern: `{thumbnailUrl ? <Image ...> : <FallbackDiv />}`.
**Warning signs:** "Invalid src prop" error in Next.js dev console.

### Pitfall 2: Horizontal flex children collapse without shrink-0
**What goes wrong:** Cards become tiny or disappear because flex children try to shrink to fit the container.
**Why it happens:** CSS flexbox default is `flex-shrink: 1`. Without a fixed width and `shrink-0`, all cards compress.
**How to avoid:** Add both `w-[160px] shrink-0` (or similar) to `LessonCard` root element.
**Warning signs:** All cards appear as a narrow column or are invisible.

### Pitfall 3: Bookmark button tap area is too small
**What goes wrong:** The bookmark icon button is harder to tap on mobile than expected.
**Why it happens:** Icon is `size-4` (16px); touch target requirement is 44px.
**How to avoid:** Wrap icon in a button with `min-h-[44px] min-w-[44px]` — established project convention from STATE.md.
**Warning signs:** Missed taps in testing on physical device.

### Pitfall 4: `e.stopPropagation()` missing on bookmark button inside a Link
**What goes wrong:** Tapping the bookmark button navigates to the lesson page instead of toggling.
**Why it happens:** The bookmark button is inside a `<Link>` element. Click events bubble up.
**How to avoid:** Call `e.preventDefault()` and `e.stopPropagation()` in the bookmark button's onClick handler.
**Warning signs:** App navigates to lesson page on bookmark tap.

### Pitfall 5: ChapterSection data shape mismatch
**What goes wrong:** TypeScript error on `lesson.contentUnit.id` vs `lesson.id` — the lesson in the course page is a `CourseLesson` (join table row), and `contentUnit` is the nested relation.
**Why it happens:** `lessons` from `product.courseLessons` are `CourseLesson` records with a nested `contentUnit` field. The `savedLessonIds` Set contains `contentUnitId` values, not `courseLessonId`.
**How to avoid:** Pass `lesson.contentUnit` (not `lesson`) to `LessonCard`. The `LessonCard` `initialSaved` prop should check `savedLessonIds.has(lesson.contentUnit.id)`.
**Warning signs:** All bookmark icons show as unsaved even after bookmarking.

## Code Examples

### Scrollbar hiding (Tailwind 4 arbitrary properties)
```typescript
// Source: Tailwind 4 arbitrary property variant syntax — verified against Tailwind 4 docs
<div className="flex gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  {/* cards */}
</div>
```

### next/image with Bunny CDN (already whitelisted)
```typescript
// Source: next.config.ts line — hostname: '*.b-cdn.net' already in remotePatterns
<Image
  src={lesson.thumbnailUrl}
  alt={lesson.title}
  fill
  className="object-cover"
  sizes="160px"
/>
```

### Bookmark icon toggle pattern
```typescript
// Source: established pattern from app/dashboard/_components/dashboard-check-in.tsx
import { Bookmark } from 'lucide-react'

// Filled vs outlined: use fill-current class to fill the Bookmark icon
<Bookmark className={`size-4 ${isSaved ? 'fill-current text-accent' : 'text-muted-foreground'}`} />
```

### Grouping "Øvrige lektioner"
```typescript
// After rendering module sections:
const unassignedLessons = lessons.filter((l: any) => !l.moduleId)
if (unassignedLessons.length > 0) {
  // render ChapterSection with title="Øvrige lektioner"
}
```

### Data shape from course page (what ChapterSection receives)
```typescript
// lesson.contentUnit is the actual ContentUnit:
{
  id: string           // uuid — used for savedLessonIds.has(id)
  title: string
  slug: string
  mediaType: 'VIDEO' | 'TEXT' | 'PDF' | 'AUDIO'
  durationMinutes: number | null
  thumbnailUrl: string | null   // already resolved Bunny CDN URL
  bunnyVideoId: string | null   // NOT needed for Phase 8 (thumbnailUrl is sufficient)
}
```

Note: `product.courseLessons` are `CourseLesson` rows sorted by `position`. Each has `lesson.contentUnit` nested. The existing course page code already uses `lesson.contentUnit.title`, `lesson.contentUnit.mediaType`, `lesson.contentUnit.slug` — same shape Phase 8 needs.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — phase is pure UI component composition using already-wired Phase 7 data and existing project libraries).

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts (root) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CARD-01 | Thumbnail renders or fallback div shown | manual-only | Visual browser check | n/a |
| CARD-02 | Title, badge, duration visible on card | manual-only | Visual browser check | n/a |
| CARD-03 | Bookmark icon toggles saved/unsaved state | manual-only | Visual tap test on device | n/a |
| CHAP-01 | Chapter sections render with correct module title | manual-only | Visual browser check | n/a |
| CHAP-02 | Horizontal scroll with no visible scrollbar | manual-only | Visual browser/device check | n/a |
| CHAP-03 | Unassigned lessons appear under "Øvrige lektioner" | manual-only | Visual browser check | n/a |

All Phase 8 requirements are **visual rendering requirements** (component shape, CSS scroll behavior, thumbnail display). They are not unit-testable in a Node.js vitest environment (no DOM renderer configured). Verification is by visual inspection in the browser and on a mobile device.

### Sampling Rate
- **Per task commit:** Visual check in browser dev tools + mobile emulator
- **Per wave merge:** Physical device test (iOS Safari + Android Chrome)
- **Phase gate:** All 5 success criteria visually confirmed before `/gsd:verify-work`

### Wave 0 Gaps
None — no test files needed. All requirements verified visually. Vitest infrastructure exists but is not applicable to CSS/rendering requirements.

## Sources

### Primary (HIGH confidence)
- `app/courses/[slug]/page.tsx` — current LessonRow pattern, data shape, mediaTypeIcons map
- `lib/bunny.ts` — getThumbnailUrl returns `https://${cdnHostname}/${videoId}/thumbnail.jpg`
- `next.config.ts` — `*.b-cdn.net` already in remotePatterns
- `prisma/schema.prisma` — ContentUnit fields: thumbnailUrl, bunnyVideoId, mediaType, durationMinutes
- `app/actions/savedContent.ts` — toggleBookmarkAction signature: (contentUnitId, currentlySaved)
- `lib/services/savedContent.service.ts` — getSavedLessons select fields confirmed
- `.planning/phases/07-kursus-data-layer-savedcontent/07-02-SUMMARY.md` — savedLessonIds Set<string> wired on course page
- `app/dashboard/_components/dashboard-check-in.tsx` — useState + server action optimistic pattern
- `app/globals.css` — design tokens: --color-coral, --color-accent, --color-sand, border-radius conventions

### Secondary (MEDIUM confidence)
- Tailwind 4 arbitrary property syntax for scrollbar hiding — `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` — consistent with how env() overrides are handled elsewhere in the project (inline style prop for dynamic calc, arbitrary classes for static CSS)

### Tertiary (LOW confidence)
- None — all findings are from verified project source files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json, no new installs needed
- Architecture: HIGH — data shape verified from live source files, server action signature verified
- Pitfalls: HIGH — derived from actual code in page.tsx and schema (e.g. nullable thumbnailUrl, CourseLesson vs ContentUnit id confusion)

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable — no external API changes expected)
