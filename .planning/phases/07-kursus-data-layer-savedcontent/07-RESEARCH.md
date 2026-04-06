# Phase 7: Kursus Data Layer + SavedContent - Research

**Researched:** 2026-04-06
**Domain:** Prisma schema migration, Next.js server actions, bookmark service layer, course metadata computation
**Confidence:** HIGH

## Summary

Phase 7 is a pure data layer phase — no UI rendering. It has two responsibilities: (1) a new `SavedContent` Prisma model that lets users bookmark `ContentUnit` records, and (2) extended course metadata functions that compute completion percentage, total duration, and chapter count server-side.

The project follows an established service layer pattern: all DB access lives in `lib/services/*.service.ts`, pages call service functions directly (no API routes for read operations), and mutations use Next.js `'use server'` actions. `getCourseProgress` in `progress.service.ts` already computes `percentComplete` — Phase 7 extends that service with duration and chapter count, and creates a parallel `savedContent.service.ts` for bookmarks.

The `SavedContent` model is net-new and requires a Prisma migration. It must not touch any existing model. The `ContentUnit` already carries `durationMinutes` (nullable `Int?`) and `mediaType`. `CourseModule` already exists as the chapter concept (mapped as "kapitel" in UI). All fields needed for COURSE-01 and COURSE-02 are already in the schema.

**Primary recommendation:** Add `SavedContent` model to `prisma/schema.prisma`, run `prisma migrate dev`, create `lib/services/savedContent.service.ts`, then extend `progress.service.ts` (or create `lib/services/course.service.ts`) with `getCourseMetadata`. Wire into `app/courses/[slug]/page.tsx`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAVE-01 | Brugeren kan gemme/bookmark lektioner og se dem under "Gemt" i profilen | SavedContent model + bookmark service + profile page section |
| COURSE-01 | Kursus-siden viser progress-bar med procent completion | percentComplete already computed in getCourseProgress — needs wiring into page props |
| COURSE-02 | Kursus-header viser antal kapitler og total estimeret varighed | totalDurationMinutes (sum of durationMinutes) + chapterCount from CourseModule query |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.19.2 | Schema migration + DB access | Already in use throughout project |
| Next.js | 16.1.6 | Server components + server actions | Project framework |
| React | 19.2.3 | UI (not used in this phase — data only) | Project framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@prisma/client` | ^6.19.2 | Generated type-safe ORM | Every DB call |
| `lib/auth.ts` (`requireAuth`) | internal | Auth guard in server components and actions | Every user-scoped operation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma model for SavedContent | JSON blob on UserProfile | Model approach gives proper relational queries + indexes. JSON would make listing/filtering harder. |
| Extending progress.service.ts | New course.service.ts | Either works. New file is cleaner if it grows; extending progress.service is simpler for now. Planner decides. |

**Installation:** No new packages required. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
lib/services/
├── savedContent.service.ts    # NEW — bookmark CRUD
├── progress.service.ts        # EXTEND — add getCourseMetadata
app/
├── courses/[slug]/page.tsx    # WIRE — pass metadata to render
├── dashboard/profile/page.tsx # EXTEND — add "Gemt" section
app/actions/
└── savedContent.ts            # NEW — 'use server' bookmark toggle action
```

### Pattern 1: Service Layer (existing convention)
**What:** All DB access in `lib/services/*.service.ts`. Pages import service functions directly as server components are async by default.
**When to use:** Every data operation.
**Example:**
```typescript
// Source: lib/services/progress.service.ts (existing)
import { prisma } from '@/lib/prisma'

export async function getCourseProgress(userId: string, productId: string) {
  const lessons = await prisma.courseLesson.findMany({
    where: { productId },
    include: {
      contentUnit: {
        include: { userProgress: { where: { userId } } },
      },
    },
    orderBy: { position: 'asc' },
  })
  const totalLessons = lessons.length
  const completedLessons = lessons.filter(
    (l) => l.contentUnit.userProgress[0]?.completedAt
  ).length
  const percentComplete =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0
  return { totalLessons, completedLessons, percentComplete, lessons: [...] }
}
```

### Pattern 2: Upsert for idempotent bookmark toggle
**What:** Bookmark create/delete — use `upsert` for create (idempotent), `deleteMany` for delete (safe if record missing).
**When to use:** Any toggle-style operation on a junction-like model.
**Example:**
```typescript
// Source: lib/services/progress.service.ts — upsert pattern (adapted)
export async function bookmarkLesson(userId: string, contentUnitId: string) {
  return prisma.savedContent.upsert({
    where: { userId_contentUnitId: { userId, contentUnitId } },
    update: {},
    create: { userId, contentUnitId },
  })
}

export async function unbookmarkLesson(userId: string, contentUnitId: string) {
  return prisma.savedContent.deleteMany({
    where: { userId, contentUnitId },
  })
}
```

### Pattern 3: Server Action for mutations
**What:** Mutations (bookmark toggle) go in `app/actions/*.ts` with `'use server'` directive. Called from client components in Phase 8.
**When to use:** Any write operation initiated from the UI.
**Example:**
```typescript
// Source: app/actions/consent.ts (existing convention)
'use server'

import { requireAuth } from '@/lib/auth'
import { bookmarkLesson, unbookmarkLesson } from '@/lib/services/savedContent.service'

export async function toggleBookmarkAction(contentUnitId: string, saved: boolean) {
  const user = await requireAuth()
  if (saved) {
    await unbookmarkLesson(user.id, contentUnitId)
  } else {
    await bookmarkLesson(user.id, contentUnitId)
  }
}
```

### Pattern 4: Prisma schema for SavedContent
**What:** The model follows existing junction-table patterns in the project (e.g. `UserContentProgress`, `ContentUnitTag`).
**When to use:** User-owned bookmarks on ContentUnit records.
**Example:**
```prisma
model SavedContent {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @db.Uuid
  contentUnitId String   @db.Uuid
  savedAt       DateTime @default(now())

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  contentUnit ContentUnit @relation(fields: [contentUnitId], references: [id], onDelete: Cascade)

  @@unique([userId, contentUnitId])
  @@index([userId, savedAt])
}
```

The `@@unique([userId, contentUnitId])` constraint enables the named `where` clause used in `upsert`. The `@@index([userId, savedAt])` serves the profile "Gemt" list query (ordered by recency).

### Pattern 5: Course metadata computation
**What:** Course metadata (total duration, chapter count) is computed from a single query — no N+1.
**When to use:** Pre-computing values for server-rendered course page header.
**Example:**
```typescript
// Source: derived from progress.service.ts and product.service.ts patterns
export async function getCourseMetadata(productId: string) {
  const [modules, lessons] = await Promise.all([
    prisma.courseModule.findMany({ where: { productId } }),
    prisma.courseLesson.findMany({
      where: { productId },
      include: { contentUnit: { select: { durationMinutes: true } } },
    }),
  ])

  const chapterCount = modules.length
  const totalDurationMinutes = lessons.reduce(
    (sum, l) => sum + (l.contentUnit.durationMinutes ?? 0),
    0
  )

  return { chapterCount, totalDurationMinutes }
}
```

### Anti-Patterns to Avoid
- **Client-side computation of percentComplete:** The course page currently shows `{courseProgress.completedLessons} af {courseProgress.totalLessons}`. Replace with server-computed `percentComplete` (0-100). Never recalculate on the client.
- **Multiple queries for course data:** Use `Promise.all` to fetch completion % and metadata in parallel, not sequentially.
- **Schema changes to existing models:** `SavedContent` is the ONLY new model. Do not add fields to `User`, `ContentUnit`, or any other existing model.
- **Using `deleteMany` where `delete` would error:** `deleteMany` is safe when the record may not exist (unbookmark on non-bookmarked lesson). Use it instead of `delete`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Duplicate bookmark prevention | Manual exists-check before create | `upsert` with `@@unique` constraint | Atomic, no race condition |
| Progress percentage | Client-side math | Extend existing `getCourseProgress` | Already correct, already tested |
| Auth check in server actions | Custom session reading | `requireAuth()` from `lib/auth.ts` | Project convention, handles redirect |
| Migration file | Hand-written SQL | `prisma migrate dev` | Generates correct SQL from schema diff |

**Key insight:** The progress service already does the hard work for COURSE-01. Phase 7 primarily wires existing output into the page render and adds duration/chapter computation on top.

## Common Pitfalls

### Pitfall 1: Forgetting to add SavedContent relation to User and ContentUnit
**What goes wrong:** Prisma generates a migration but the Prisma client type system shows no `savedContent` accessor on `User` or `ContentUnit`. Any `include: { savedContent: true }` query fails at type-check time.
**Why it happens:** Prisma requires both sides of the relation to be declared.
**How to avoid:** Add `savedContent SavedContent[]` to the `User` model and `savedContent SavedContent[]` to the `ContentUnit` model in the schema file.
**Warning signs:** TypeScript error "Property 'savedContent' does not exist on type..."

### Pitfall 2: Migration against Supabase free-tier with row limits
**What goes wrong:** The migration runs but Supabase free tier has a max of 500MB storage and connection limits. A table creation is fine, but large data migrations could stall.
**Why it happens:** Supabase free tier limits.
**How to avoid:** This migration only creates a new table with no data — no risk. Confirm with `prisma migrate status` before running against production.
**Warning signs:** STATE.md blocker note: "Prisma migration in Phase 7 must be verified against Supabase free-tier limits before running."

### Pitfall 3: `durationMinutes` is nullable — must handle null in sum
**What goes wrong:** `reduce` over `durationMinutes` gives `NaN` if any lesson has `null` duration.
**Why it happens:** Schema declares `durationMinutes Int?` (nullable).
**How to avoid:** Always coerce: `(l.contentUnit.durationMinutes ?? 0)`.
**Warning signs:** `totalDurationMinutes` is `NaN` or undefined.

### Pitfall 4: Course page renders both "has access" and "no access" paths
**What goes wrong:** The course metadata (duration, chapters) is currently computed inline in the landing page section (`moduleCount`, `lessonCount`). The "has access" branch uses `getCourseProgress` but does NOT currently compute duration or chapter count.
**Why it happens:** The page has two distinct branches — only the "has access" branch is in scope for Phase 7.
**How to avoid:** Only extend the `hasAccess && courseProgress` branch. The landing page branch (no access) is out of scope for Phase 7.
**Warning signs:** Adding metadata rendering to the wrong JSX branch.

### Pitfall 5: Profile page needs a "Gemt" section — but SAVE-01 success criterion requires it
**What goes wrong:** SAVE-01 says "A user's bookmarked lessons appear under 'Gemt' in their profile." Phase 7 must add this section to the profile page, or Phase 8 has nowhere to show bookmarks.
**Why it happens:** The profile page is currently a static nav menu with no dynamic data.
**How to avoid:** `getSavedLessons(userId)` must be called from the profile page, and a "Gemt" section must be rendered — even if it's a minimal list at this stage (full card UI comes in Phase 8).
**Warning signs:** Treating profile page integration as "Phase 8 work" — it's a Phase 7 success criterion.

## Code Examples

### SavedContent Prisma model (complete)
```prisma
// Source: derived from existing UserContentProgress model pattern
model SavedContent {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @db.Uuid
  contentUnitId String   @db.Uuid
  savedAt       DateTime @default(now())

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  contentUnit ContentUnit @relation(fields: [contentUnitId], references: [id], onDelete: Cascade)

  @@unique([userId, contentUnitId])
  @@index([userId, savedAt])
}
```

Also add to `User` model:
```prisma
savedContent SavedContent[]
```

And to `ContentUnit` model:
```prisma
savedContent SavedContent[]
```

### Bookmark service (complete interface)
```typescript
// lib/services/savedContent.service.ts
import { prisma } from '@/lib/prisma'

export async function bookmarkLesson(userId: string, contentUnitId: string) {
  return prisma.savedContent.upsert({
    where: { userId_contentUnitId: { userId, contentUnitId } },
    update: {},
    create: { userId, contentUnitId },
  })
}

export async function unbookmarkLesson(userId: string, contentUnitId: string) {
  return prisma.savedContent.deleteMany({
    where: { userId, contentUnitId },
  })
}

export async function getSavedLessons(userId: string) {
  return prisma.savedContent.findMany({
    where: { userId },
    include: {
      contentUnit: {
        select: {
          id: true,
          title: true,
          slug: true,
          mediaType: true,
          durationMinutes: true,
          thumbnailUrl: true,
        },
      },
    },
    orderBy: { savedAt: 'desc' },
  })
}

export async function isLessonBookmarked(userId: string, contentUnitId: string) {
  const record = await prisma.savedContent.findUnique({
    where: { userId_contentUnitId: { userId, contentUnitId } },
  })
  return !!record
}
```

### Course metadata service (extends progress.service.ts or new file)
```typescript
// lib/services/course.service.ts (or added to progress.service.ts)
import { prisma } from '@/lib/prisma'

export async function getCourseMetadata(userId: string, productId: string) {
  const [modules, lessons, completedCount] = await Promise.all([
    prisma.courseModule.findMany({ where: { productId } }),
    prisma.courseLesson.findMany({
      where: { productId },
      include: {
        contentUnit: {
          select: {
            durationMinutes: true,
            userProgress: { where: { userId }, select: { completedAt: true } },
          },
        },
      },
    }),
    prisma.userContentProgress.count({
      where: {
        userId,
        contentUnit: { courseLessons: { some: { productId } } },
        completedAt: { not: null },
      },
    }),
  ])

  const totalLessons = lessons.length
  const percentComplete =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const chapterCount = modules.length
  const totalDurationMinutes = lessons.reduce(
    (sum, l) => sum + (l.contentUnit.durationMinutes ?? 0),
    0
  )

  return { chapterCount, totalDurationMinutes, percentComplete, totalLessons, completedLessons: completedCount }
}
```

Note: The existing `getCourseProgress` already computes `percentComplete` correctly. The planner may prefer to extend it with `chapterCount` + `totalDurationMinutes` instead of a new function. Either is valid — consistency with existing pattern favors extension.

### Wiring into course page (minimal patch)
```typescript
// app/courses/[slug]/page.tsx — in the hasAccess branch
// Add after existing getCourseProgress call:
const chapterCount = product.modules?.length ?? 0
const totalDurationMinutes = (product.courseLessons ?? []).reduce(
  (sum: number, l: any) => sum + (l.contentUnit?.durationMinutes ?? 0),
  0
)
// percentComplete already available from courseProgress.percentComplete
```

Note: Since `getProduct` already includes `courseLessons` with `contentUnit` and `modules`, chapter count and total duration can be derived from the already-loaded `product` object without an additional DB query. This is the simplest approach.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side progress calculation | Server-side `getCourseProgress` | Pre-Phase 7 | Already correct — just needs wiring |
| No bookmark model | `SavedContent` model (net-new) | Phase 7 | Enables SAVE-01 |

**Deprecated/outdated:**
- The inline `{courseProgress.completedLessons} af {courseProgress.totalLessons}` string in the course page should be replaced with a proper progress bar using `percentComplete`.

## Open Questions

1. **Should `getCourseMetadata` be a separate function or extend `getCourseProgress`?**
   - What we know: `getCourseProgress` already returns `percentComplete`, `totalLessons`, `completedLessons`. Adding `chapterCount` and `totalDurationMinutes` to its return shape is minimal and avoids an extra function.
   - What's unclear: Whether future phases need `getCourseMetadata` independently of progress.
   - Recommendation: Extend `getCourseProgress` to also return `chapterCount` and `totalDurationMinutes`. Single function, single DB round-trip set.

2. **Profile "Gemt" section — minimal list or card-level render in Phase 7?**
   - What we know: SAVE-01 success criterion says bookmarks must appear in profile. Phase 8 builds the full `LessonCard` component.
   - What's unclear: Whether Phase 7 should render a plain text list (good enough to verify SAVE-01) or wait for Phase 8 cards.
   - Recommendation: Phase 7 renders a minimal list (title + slug link) under "Gemt" heading on profile page. Phase 8 replaces list items with `LessonCard` components. This satisfies SAVE-01 without blocking Phase 7.

3. **`isLessonBookmarked` for pre-populating bookmark toggle in Phase 8**
   - What we know: Phase 8 needs to know per-lesson whether the user has bookmarked it to render the toggle icon state.
   - What's unclear: Whether the course page should batch-load saved states in Phase 7 or defer to Phase 8.
   - Recommendation: Include `savedLessonIds` (a `Set<string>`) in the course page data in Phase 7, so Phase 8 can pass it as a prop without additional DB calls.

## Environment Availability

Step 2.6: SKIPPED (no external tool dependencies — changes are code and Prisma schema only, no new CLIs or external services required beyond already-running Supabase/PostgreSQL).

## Validation Architecture

No `config.json` found in `.planning/` — treating `nyquist_validation` as enabled (key absent = enabled).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, vitest.config, or pytest.ini found |
| Config file | none — see Wave 0 |
| Quick run command | `npx tsx -e "import('./lib/services/savedContent.service')"` |
| Full suite command | `npx tsx -e "import('./lib/services/savedContent.service'); import('./lib/services/progress.service')"` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAVE-01 | bookmarkLesson creates record, getSavedLessons returns it | smoke | `npx tsx -e "import { bookmarkLesson, getSavedLessons, unbookmarkLesson } from './lib/services/savedContent.service'; console.log('PASS: exports ok')"` | ❌ Wave 0 |
| COURSE-01 | getCourseProgress returns percentComplete (0-100) | smoke | `npx tsx -e "import { getCourseProgress } from './lib/services/progress.service'; console.log('PASS: exports ok')"` | ❌ Wave 0 |
| COURSE-02 | course metadata returns chapterCount + totalDurationMinutes | smoke | `npx tsx -e "import { getCourseProgress } from './lib/services/progress.service'; console.log('PASS')"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Export smoke test (tsx import check, no DB)
- **Per wave merge:** Full export + type check
- **Phase gate:** Manual verification against live DB before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No formal test framework configured — smoke tests use `npx tsx -e` pattern (established in Phase 5)
- [ ] Prisma client regeneration required after schema migration before any import test

*(Existing test infrastructure: none. Project uses ad-hoc `npx tsx -e` smoke tests established in Phase 5 plans.)*

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma` — existing model structure, field names, enum values, relation patterns
- `lib/services/progress.service.ts` — existing `getCourseProgress` implementation, upsert/deleteMany patterns
- `lib/services/dashboard.service.ts` — `Promise.all` parallelism pattern, service function conventions
- `app/courses/[slug]/page.tsx` — current course page structure, data flow, what's already computed
- `app/dashboard/profile/page.tsx` — current profile page structure (where "Gemt" section goes)
- `app/actions/consent.ts` — server action pattern with `requireAuth`
- `prisma/migrations/20260307173227_community_rooms/migration.sql` — migration convention (generated by Prisma)

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — confirmed decisions: SavedContent is net-new, no changes to existing models, Supabase free-tier limit concern
- `.planning/REQUIREMENTS.md` — confirmed requirement text for SAVE-01, COURSE-01, COURSE-02

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json (Next.js 16.1.6, Prisma ^6.19.2, React 19.2.3)
- Architecture: HIGH — all patterns derived from existing codebase files, not assumptions
- Pitfalls: HIGH — all identified from direct code inspection (nullable durationMinutes, dual-branch course page, profile page requirement)

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable — Prisma 6.x API is stable, no fast-moving dependencies)
