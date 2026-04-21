# Community Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ombyg community fra lukket kohorte-only model til en tre-lags value ladder med offentlige, SEO-indekserbare community-rum, prompt-kø-system, MODERATOR-rolle, og alumni-badges — alt admin-konfigurerbart og white-label-klart.

**Architecture:** Udvid eksisterende community.service.ts med rum-logik. Tilføj nye Prisma-modeller (CommunityRoom, RoomPromptQueue, CommunitySettings). DiscussionPost får nullable roomId (enten room ELLER cohort). Nye offentlige routes under `/community/` kræver ingen auth. Alle tærskler, frekvenser og tekster er admin-konfigurerbare via SiteSetting eller dedikerede modeller.

**Tech Stack:** Next.js 16 (App Router), Prisma 6, Supabase Auth, Tailwind CSS 4, shadcn/ui, Zod v4 for validation. SEO via generateMetadata + JSON-LD structured data.

**Design doc:** `docs/plans/2026-03-07-community-redesign.md` (godkendt 2026-03-07)

---

## Oversigt

| Task | Beskrivelse | Filer (primære) |
|------|-------------|-----------------|
| 1 | Prisma schema: nye modeller + udvidelser | `prisma/schema.prisma` |
| 2 | Seed: standard-rum + community settings | `prisma/seed.ts` |
| 3 | MODERATOR-rolle + auth-udvidelse | `prisma/schema.prisma`, `lib/auth.ts` |
| 4 | Community room service | `lib/services/community.service.ts` |
| 5 | Slug-generering utility | `lib/slugify.ts` |
| 6 | Offentlig community: rum-oversigt | `app/community/page.tsx` |
| 7 | Offentlig community: rum-feed | `app/community/[roomSlug]/page.tsx` |
| 8 | Offentlig community: enkelt opslag | `app/community/[roomSlug]/[postSlug]/page.tsx` |
| 9 | SEO: JSON-LD, sitemap, breadcrumbs | `app/community/`, `app/sitemap.ts` |
| 10 | Community actions (post, reply, react) | `app/community/actions.ts` |
| 11 | Community UI-komponenter | `app/community/_components/` |
| 12 | Admin: rum-CRUD | `app/admin/community/rooms/` |
| 13 | Admin: prompt-kø | `app/admin/community/prompts/` |
| 14 | Admin: community-indstillinger | `app/admin/settings/community/` |
| 15 | Cron: room prompt poster | `app/api/cron/room-prompts/route.ts` |
| 16 | Alumni-adgang + badges | `lib/services/community.service.ts`, diverse |
| 17 | Middleware + navigation | `middleware.ts`, `app/admin/_components/admin-nav.tsx` |
| 18 | Community-digest udvidelse | `app/api/cron/community-digest/route.ts` |

---

## Task 1: Prisma schema — nye modeller + udvidelser

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Tilføj MODERATOR til UserRole enum**

Find `enum UserRole` (linje 18-21) og tilføj:

```prisma
enum UserRole {
  USER
  MODERATOR
  ADMIN
}
```

**Step 2: Tilføj CommunityRoom model**

Tilføj efter Community / Cohort Models sektionen:

```prisma
model CommunityRoom {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String?  @db.Uuid
  name            String
  slug            String   @unique
  description     String?
  icon            String?  // lucide icon name, e.g. "MessageCircle"
  sortOrder       Int      @default(0)
  isPublic        Boolean  @default(true)
  isArchived      Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  posts           DiscussionPost[]
  promptQueue     RoomPromptQueue[]

  @@index([isArchived, sortOrder])
}
```

**Step 3: Tilføj RoomPromptQueue model**

```prisma
model RoomPromptQueue {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String?  @db.Uuid
  roomId          String   @db.Uuid
  promptText      String
  priority        Int      @default(0)
  postedAt        DateTime?
  isPaused        Boolean  @default(false)
  createdAt       DateTime @default(now())

  room            CommunityRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId, postedAt, isPaused])
}
```

**Step 4: Udvid DiscussionPost med roomId, slug, isPublic**

Find `model DiscussionPost` (linje 690-713) og tilføj felter:

```prisma
model DiscussionPost {
  id              String   @id @default(uuid()) @db.Uuid
  cohortId        String?  @db.Uuid        // nullable nu — enten cohort ELLER room
  roomId          String?  @db.Uuid        // nyt: åbent rum
  organizationId  String?  @db.Uuid        // nyt: white label
  authorId        String   @db.Uuid
  dayId           String?  @db.Uuid
  promptId        String?  @db.Uuid
  body            String
  slug            String?  @unique         // nyt: SEO-venlig slug
  isPrompt        Boolean  @default(false)
  isPinned        Boolean  @default(false)
  isHidden        Boolean  @default(false)
  isPublic        Boolean  @default(true)  // nyt: GDPR opt-out
  isFeatured      Boolean  @default(false) // nyt: admin fremhævning
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  cohort    Cohort?           @relation(fields: [cohortId], references: [id], onDelete: Cascade)
  room      CommunityRoom?    @relation(fields: [roomId], references: [id], onDelete: Cascade)
  author    User              @relation(fields: [authorId], references: [id], onDelete: Cascade)
  day       JourneyDay?       @relation(fields: [dayId], references: [id])
  prompt    DiscussionPrompt? @relation(fields: [promptId], references: [id])
  replies   DiscussionReply[]
  reactions PostReaction[]
  reports   ContentReport[]   @relation("PostReports")

  @@index([cohortId, createdAt])
  @@index([roomId, createdAt])
  @@index([authorId])
  @@index([slug])
}
```

**Vigtigt:** `cohortId` ændres fra required til nullable. Eksisterende data har altid cohortId sat, så dette er backward-compatible.

**Step 5: Kør migration**

```bash
npx prisma migrate dev --name community-rooms
```

**Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add CommunityRoom, RoomPromptQueue models + extend DiscussionPost"
```

---

## Task 2: Seed — standard-rum + community settings

**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Tilføj community settings til seed**

Tilføj upserts for SiteSetting-nøgler der styrer community:

```typescript
// Community settings
const communitySettings = [
  { key: 'community_index_min_chars', value: '50', description: 'Minimum tegn i opslag før Google-indeksering' },
  { key: 'community_index_min_replies', value: '1', description: 'Minimum antal svar før Google-indeksering' },
  { key: 'community_digest_includes_rooms', value: 'true', description: 'Inkludér åbne rum i community-digest' },
  { key: 'community_digest_frequency', value: 'weekly', description: 'Community-digest frekvens (daily/weekly/monthly/off)' },
  { key: 'community_notify_reply_inapp', value: 'true', description: 'In-app notifikation ved svar på opslag' },
  { key: 'community_notify_reply_email', value: 'false', description: 'Email-notifikation ved svar (bruger opt-in)' },
  { key: 'community_prompt_time', value: '08:00', description: 'Tidspunkt for auto-posting af prompts (HH:MM)' },
  { key: 'community_prompt_author_id', value: '', description: 'Bruger-ID for prompt-forfatter (tom = første admin)' },
]

for (const setting of communitySettings) {
  await prisma.siteSetting.upsert({
    where: { key: setting.key },
    update: {},
    create: setting,
  })
}
```

**Step 2: Tilføj de 4 standard-rum**

```typescript
const defaultRooms = [
  { name: 'Hverdagen som forælder', slug: 'hverdagen', description: 'Del hverdagens op- og nedture', icon: 'Heart', sortOrder: 0 },
  { name: 'Spørgsmål & svar', slug: 'spoergsmaal', description: 'Stil spørgsmål til andre forældre', icon: 'HelpCircle', sortOrder: 1 },
  { name: 'Wins & fremskridt', slug: 'wins', description: 'Del dine sejre, store som små', icon: 'Trophy', sortOrder: 2 },
  { name: 'Tips & ressourcer', slug: 'tips', description: 'Del artikler, bøger, værktøjer', icon: 'Lightbulb', sortOrder: 3 },
]

for (const room of defaultRooms) {
  await prisma.communityRoom.upsert({
    where: { slug: room.slug },
    update: {},
    create: room,
  })
}
```

**Step 3: Kør seed**

```bash
npx prisma db seed
```

**Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed community rooms and settings"
```

---

## Task 3: MODERATOR-rolle + auth-udvidelse

**Files:**
- Modify: `lib/auth.ts`

**Step 1: Tilføj requireModeratorOrAdmin helper**

```typescript
/**
 * Require moderator or admin role. Redirects to /dashboard if neither.
 */
export async function requireModeratorOrAdmin() {
  const user = await requireAuth()
  if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') redirect('/dashboard')
  return user
}
```

**Step 2: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: add MODERATOR role and requireModeratorOrAdmin auth helper"
```

---

## Task 4: Community room service

**Files:**
- Modify: `lib/services/community.service.ts`

**Step 1: Tilføj room CRUD funktioner**

Tilføj øverst i filen, efter eksisterende imports:

```typescript
import { generatePostSlug } from '@/lib/slugify'
```

Tilføj nye funktioner:

```typescript
// --- Community Rooms ---

export async function listRooms(includeArchived = false) {
  return prisma.communityRoom.findMany({
    where: includeArchived ? {} : { isArchived: false },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { posts: { where: { isHidden: false } } } },
    },
  })
}

export async function getRoomBySlug(slug: string) {
  return prisma.communityRoom.findUnique({
    where: { slug },
    include: {
      _count: { select: { posts: { where: { isHidden: false } } } },
    },
  })
}

export async function createRoom(data: {
  name: string
  slug: string
  description?: string
  icon?: string
  isPublic?: boolean
  sortOrder?: number
  organizationId?: string
}) {
  return prisma.communityRoom.create({ data })
}

export async function updateRoom(
  id: string,
  data: {
    name?: string
    slug?: string
    description?: string
    icon?: string
    isPublic?: boolean
    sortOrder?: number
    isArchived?: boolean
  }
) {
  return prisma.communityRoom.update({ where: { id }, data })
}

export async function deleteRoom(id: string) {
  return prisma.communityRoom.update({
    where: { id },
    data: { isArchived: true },
  })
}
```

**Step 2: Tilføj room feed funktion**

```typescript
export async function getRoomFeed(
  roomId: string,
  cursor?: string,
  userId?: string
) {
  const posts = await prisma.discussionPost.findMany({
    where: { roomId, isHidden: false },
    take: FEED_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ isPinned: 'desc' }, { isFeatured: 'desc' }, { createdAt: 'desc' }],
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { replies: true, reactions: true } },
      reactions: userId
        ? { where: { userId }, select: { id: true, emoji: true } }
        : false,
    },
  })

  const hasMore = posts.length > FEED_PAGE_SIZE
  const items = hasMore ? posts.slice(0, FEED_PAGE_SIZE) : posts
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined

  return { items, nextCursor, hasMore }
}
```

**Step 3: Tilføj createRoomPost funktion**

```typescript
export async function createRoomPost(
  roomId: string,
  authorId: string,
  body: string,
  isPublic = true
) {
  const slug = generatePostSlug(body)

  return prisma.discussionPost.create({
    data: {
      roomId,
      authorId,
      body,
      slug,
      isPublic,
      cohortId: null,
    },
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { replies: true, reactions: true } },
    },
  })
}
```

**Step 4: Tilføj getPostBySlug for offentlig visning**

```typescript
export async function getPostBySlug(slug: string) {
  return prisma.discussionPost.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true } },
      room: { select: { id: true, name: true, slug: true } },
      replies: {
        where: { isHidden: false },
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { reactions: true } },
        },
      },
      _count: { select: { replies: true, reactions: true } },
    },
  })
}
```

**Step 5: Tilføj room reply med notifikation**

Opdater `createReply` til at håndtere både kohorte- og rum-opslag. Tilføj settings-check for notifikationer:

```typescript
// I eksisterende createReply, efter linje der sender notification:
// Tjek community settings for om notifikationer er slået til
const notifyInApp = await getSiteSetting('community_notify_reply_inapp')
const notifyEmail = await getSiteSetting('community_notify_reply_email')

// Kun send hvis settings er 'true'
if (post.authorId !== authorId) {
  const authorName = reply.author.name ?? 'Nogen'
  const snippet = body.length > 100 ? body.slice(0, 100) + '…' : body

  if (notifyInApp !== 'false') {
    const actionUrl = post.roomId && post.room
      ? `/community/${post.room.slug}/${post.slug}`
      : `/journeys/community/${post.cohortId}/${postId}`

    await createInAppNotification(
      post.authorId,
      'COMMUNITY_REPLY',
      `${authorName} svarede på dit indlæg`,
      snippet,
      actionUrl
    )
  }

  if (notifyEmail === 'true') {
    await sendTemplatedEmail(post.authorId, 'community_reply', {
      replierName: authorName,
      replySnippet: snippet,
      postSnippet: post.body.length > 80 ? post.body.slice(0, 80) + '…' : post.body,
    })
  }
}
```

**Step 6: Tilføj room weekly stats**

```typescript
export async function getRoomWeeklyStats(roomId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [newPosts, newReplies, activeMembers] = await Promise.all([
    prisma.discussionPost.count({
      where: {
        roomId,
        isHidden: false,
        isPrompt: false,
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.discussionReply.count({
      where: {
        isHidden: false,
        createdAt: { gte: weekAgo },
        post: { roomId },
      },
    }),
    prisma.discussionPost.findMany({
      where: {
        roomId,
        isPrompt: false,
        createdAt: { gte: weekAgo },
      },
      select: { authorId: true },
      distinct: ['authorId'],
    }).then((posts) => posts.length),
  ])

  return { newPosts, newReplies, activeMembers }
}
```

**Step 7: Tilføj prompt-kø funktioner**

```typescript
// --- Room Prompt Queue ---

export async function listRoomPrompts(roomId: string) {
  return prisma.roomPromptQueue.findMany({
    where: { roomId },
    orderBy: [{ postedAt: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
    include: { room: { select: { name: true, slug: true } } },
  })
}

export async function createRoomPrompt(data: {
  roomId: string
  promptText: string
  priority?: number
  organizationId?: string
}) {
  return prisma.roomPromptQueue.create({ data })
}

export async function updateRoomPrompt(
  id: string,
  data: { promptText?: string; priority?: number; isPaused?: boolean }
) {
  return prisma.roomPromptQueue.update({ where: { id }, data })
}

export async function deleteRoomPrompt(id: string) {
  return prisma.roomPromptQueue.delete({ where: { id } })
}

export async function getNextUnpostedPrompt(roomId: string) {
  return prisma.roomPromptQueue.findFirst({
    where: {
      roomId,
      postedAt: null,
      isPaused: false,
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  })
}

export async function markPromptAsPosted(id: string) {
  return prisma.roomPromptQueue.update({
    where: { id },
    data: { postedAt: new Date() },
  })
}
```

**Step 8: Tilføj alumni badge helper**

```typescript
// --- Alumni Badges ---

export async function getUserCompletedJourneys(userId: string) {
  return prisma.userJourney.findMany({
    where: { userId, status: 'COMPLETED' },
    include: {
      journey: { select: { id: true, title: true, slug: true } },
    },
  })
}
```

**Step 9: Commit**

```bash
git add lib/services/community.service.ts
git commit -m "feat: community room service — CRUD, feed, prompts, alumni"
```

---

## Task 5: Slug-generering utility

**Files:**
- Create: `lib/slugify.ts`

**Step 1: Opret slugify utility**

```typescript
/**
 * Generate a SEO-friendly post slug from body text.
 * Format: [uuid-prefix-8]-[first-8-words-slugified]
 * Example: a3f2b1c9-hvornaar-skal-barnet-sove-alene
 */
export function generatePostSlug(body: string): string {
  const uuid = crypto.randomUUID().slice(0, 8)

  const slug = body
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .join('-')
    .slice(0, 80) // max length

  return `${uuid}-${slug || 'opslag'}`
}
```

**Bemærk:** Slugs bruger ASCII for URL-kompatibilitet (æ→ae osv.), selvom platform-tekst er på dansk med æøå. Dette er standard SEO-praksis for danske URLs.

**Step 2: Commit**

```bash
git add lib/slugify.ts
git commit -m "feat: add post slug generator for SEO-friendly URLs"
```

---

## Task 6: Offentlig community — rum-oversigt

**Files:**
- Create: `app/community/page.tsx`
- Create: `app/community/layout.tsx`

**Step 1: Opret community layout**

```typescript
// app/community/layout.tsx
import { getTenantConfig } from '@/lib/services/tenant.service'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantConfig()
  return {
    title: `Fællesskab — ${tenant.brandName}`,
    description: `Deltag i fællesskabet hos ${tenant.brandName}. Stil spørgsmål, del erfaringer og find støtte fra andre forældre.`,
  }
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

**Step 2: Opret rum-oversigt page**

Offentlig side — ingen auth krævet. Viser alle aktive, offentlige rum med post-count og seneste aktivitet. Inkluderer CTA til registrering for ikke-loggede brugere.

Hent rum via `listRooms()`. Hent current user med `getCurrentUser()` (nullable). Vis CTA baseret på auth-state.

**Step 3: Commit**

```bash
git add app/community/
git commit -m "feat: public community room overview page"
```

---

## Task 7: Offentlig community — rum-feed

**Files:**
- Create: `app/community/[roomSlug]/page.tsx`

**Step 1: Opret rum-feed page**

Offentlig side. Hent rum via `getRoomBySlug(slug)`. Hent feed via `getRoomFeed(room.id)`. Vis opslag med forfatter-fornavn, tidspunkt, reply-count. Inkluderer post-form for loggede brugere, CTA for ikke-loggede.

Breadcrumbs: Fællesskab > [Rum-navn]

**Step 2: Commit**

```bash
git add app/community/[roomSlug]/
git commit -m "feat: public community room feed page with breadcrumbs"
```

---

## Task 8: Offentlig community — enkelt opslag

**Files:**
- Create: `app/community/[roomSlug]/[postSlug]/page.tsx`

**Step 1: Opret enkelt-opslags page**

Offentlig side. Hent post via `getPostBySlug(postSlug)`. Vis opslag med alle svar. Tjek `isPublic` — hvis false, vis 404. Tjek indekseringskriterier fra SiteSetting.

Breadcrumbs: Fællesskab > [Rum-navn] > [Opslags-uddrag]

Tilføj `generateMetadata()` med:
- `<title>` fra første 60 tegn af body
- `<meta description>` fra første 160 tegn
- `robots: noindex` hvis opslag ikke opfylder indekserings-tærskel

**Step 2: Commit**

```bash
git add app/community/[roomSlug]/[postSlug]/
git commit -m "feat: public single post page with SEO metadata"
```

---

## Task 9: SEO — JSON-LD, sitemap, breadcrumbs

**Files:**
- Create: `app/community/_components/json-ld.tsx`
- Create: `app/community/_components/breadcrumbs.tsx`
- Modify: `app/sitemap.ts` (opret hvis ikke eksisterer)

**Step 1: Opret JSON-LD komponent**

Server component der renderer `<script type="application/ld+json">` med `DiscussionForumPosting` schema for opslag og `CollectionPage` for rum.

**Step 2: Opret breadcrumbs komponent**

Server component der renderer breadcrumb-navigation med `BreadcrumbList` JSON-LD schema.

**Step 3: Opret/udvid sitemap**

Dynamisk sitemap der inkluderer:
- `/community` (høj prioritet)
- `/community/[room-slug]` for hvert aktivt rum
- `/community/[room-slug]/[post-slug]` for opslag der opfylder indekseringskrav (>= min chars, >= min replies, isPublic=true, isHidden=false)

Hent tærskelværdier fra SiteSetting.

**Step 4: Commit**

```bash
git add app/community/_components/ app/sitemap.ts
git commit -m "feat: SEO — JSON-LD structured data, breadcrumbs, dynamic sitemap"
```

---

## Task 10: Community actions (post, reply, react)

**Files:**
- Create: `app/community/actions.ts`

**Step 1: Opret server actions for åbent community**

```typescript
'use server'

import { requireAuth, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import * as communityService from '@/lib/services/community.service'
import { z } from 'zod'

export async function createRoomPostAction(
  roomId: string,
  body: string,
  roomSlug: string,
  isPublic: boolean = true
) {
  const id = z.string().uuid().parse(roomId)
  const user = await requireAuth()

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Indlægget må ikke være tomt' }
  if (trimmed.length > 5000) return { error: 'Indlægget er for langt (maks 5000 tegn)' }

  const post = await communityService.createRoomPost(id, user.id, trimmed, isPublic)
  revalidatePath(`/community/${roomSlug}`)
  return { post }
}

export async function createRoomReplyAction(
  postId: string,
  body: string,
  roomSlug: string,
  postSlug: string
) {
  z.string().uuid().parse(postId)
  const user = await requireAuth()

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Svaret må ikke være tomt' }
  if (trimmed.length > 2000) return { error: 'Svaret er for langt (maks 2000 tegn)' }

  const reply = await communityService.createReply(postId, user.id, trimmed)
  revalidatePath(`/community/${roomSlug}`)
  revalidatePath(`/community/${roomSlug}/${postSlug}`)
  return { reply }
}

export async function toggleRoomReactionAction(
  emoji: string,
  roomSlug: string,
  postId?: string,
  replyId?: string
) {
  const user = await requireAuth()
  const added = await communityService.toggleReaction(user.id, emoji, postId, replyId)
  revalidatePath(`/community/${roomSlug}`)
  return { added }
}

export async function deleteRoomPostAction(postId: string, roomSlug: string) {
  z.string().uuid().parse(postId)
  const user = await requireAuth()

  const post = await communityService.getPostWithReplies(postId)
  if (!post) return { error: 'Indlæg ikke fundet' }
  if (post.author.id !== user.id && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
    return { error: 'Ikke autoriseret' }
  }

  await communityService.deletePost(postId)
  revalidatePath(`/community/${roomSlug}`)
  return { success: true }
}

export async function reportRoomContentAction(
  reason: string,
  roomSlug: string,
  postId?: string,
  replyId?: string
) {
  const user = await requireAuth()
  if (!reason.trim()) return { error: 'Angiv venligst en årsag' }

  await communityService.createReport(user.id, reason.trim(), postId, replyId)
  return { success: true }
}

export async function getRoomFeedAction(roomId: string, cursor?: string) {
  z.string().uuid().parse(roomId)
  const user = await getCurrentUser()
  return communityService.getRoomFeed(roomId, cursor, user?.id)
}
```

**Step 2: Commit**

```bash
git add app/community/actions.ts
git commit -m "feat: community room server actions with Zod validation"
```

---

## Task 11: Community UI-komponenter

**Files:**
- Create: `app/community/_components/room-card.tsx`
- Create: `app/community/_components/room-post-card.tsx`
- Create: `app/community/_components/room-post-form.tsx`
- Create: `app/community/_components/room-reply-form.tsx`
- Create: `app/community/_components/room-feed-list.tsx`
- Create: `app/community/_components/community-cta.tsx`
- Create: `app/community/_components/alumni-badge.tsx`

**Step 1: Opret komponenter**

- `room-card.tsx` — Kort der viser rum-info (navn, beskrivelse, ikon, post-count) på oversigts-siden
- `room-post-card.tsx` — Enkelt opslag i feedet (forfatter-fornavn, body, reply-count, tidspunkt, reaktioner)
- `room-post-form.tsx` — Client component med textarea + isPublic toggle + submit
- `room-reply-form.tsx` — Client component til at svare på opslag
- `room-feed-list.tsx` — Client component med infinite scroll / "Indlæs flere" der kalder `getRoomFeedAction`
- `community-cta.tsx` — Kontekstuel CTA: "Opret gratis konto" for anonyme, "Start et forløb" for gratis brugere der ser kohorte-indhold
- `alumni-badge.tsx` — Badge komponent der viser "Har gennemført [Forløbsnavn]"

**Vigtigt:** Offentlige sider viser kun `author.name?.split(' ')[0]` (fornavn) — aldrig email eller fuldt navn (GDPR, design doc S2).

**Step 2: Commit**

```bash
git add app/community/_components/
git commit -m "feat: community UI components — cards, forms, feed, CTA, badges"
```

---

## Task 12: Admin — rum-CRUD

**Files:**
- Create: `app/admin/community/rooms/page.tsx`
- Create: `app/admin/community/rooms/[id]/edit/page.tsx`
- Create: `app/admin/community/rooms/new/page.tsx`
- Create: `app/admin/community/rooms/_components/room-form.tsx`
- Create: `app/admin/community/rooms/actions.ts`

**Step 1: Opret admin rum-oversigt**

Tabel med alle rum (inkl. arkiverede). Kolonner: navn, slug, opslag-antal, status (aktiv/arkiveret/privat), sortering. Actions: rediger, arkivér.

**Step 2: Opret rum-formular**

Formular med: navn, slug (auto-genereret fra navn, redigerbar), beskrivelse, ikon (dropdown med lucide-ikoner), synlighed (offentlig/privat), sorteringsrækkefølge.

**Step 3: Opret server actions**

CRUD actions med Zod-validering + `z.string().uuid().parse()` på alle IDs. `requireAdmin()` på alle actions.

**Step 4: Commit**

```bash
git add app/admin/community/
git commit -m "feat: admin community room CRUD"
```

---

## Task 13: Admin — prompt-kø

**Files:**
- Create: `app/admin/community/prompts/page.tsx`
- Create: `app/admin/community/prompts/_components/prompt-queue-manager.tsx`
- Create: `app/admin/community/prompts/actions.ts`

**Step 1: Opret prompt-kø admin-side**

Viser alle prompts grupperet pr. rum. Kolonner: tekst (trunkeret), rum, prioritet, status (ventende/postet/pauset), postet-tidspunkt. Actions: rediger, pause/genoptag, slet.

Formular til at oprette nye prompts: tekst, vælg rum (dropdown), prioritet (tal).

Bulk-import: Textarea hvor admin kan paste mange prompts (én pr. linje) + vælg rum.

**Step 2: Opret server actions**

CRUD actions med Zod-validering. `requireAdmin()` på alle.

**Step 3: Commit**

```bash
git add app/admin/community/prompts/
git commit -m "feat: admin prompt queue management with bulk import"
```

---

## Task 14: Admin — community-indstillinger

**Files:**
- Create: `app/admin/settings/community/page.tsx`
- Create: `app/admin/settings/community/_components/community-settings-form.tsx`
- Create: `app/admin/settings/community/actions.ts`

**Step 1: Opret community settings page**

Formular der læser/skriver SiteSetting-nøgler fra Task 2:

- **Notifikationer:** In-app ved svar (toggle), email ved svar (toggle)
- **Digest:** Inkludér åbne rum (toggle), frekvens (select: daglig/ugentlig/månedlig/fra)
- **Indeksering:** Min. tegn (number input), min. svar (number input)
- **Prompt-kø:** Tidspunkt (time input), forfatter (bruger-select dropdown)

**Step 2: Opret server actions**

Læs og skriv SiteSetting med Zod-validering. `requireAdmin()`.

**Step 3: Tilføj link fra admin settings oversigt**

I `app/admin/settings/page.tsx`, tilføj "Fællesskab" kort med link til `/admin/settings/community`.

**Step 4: Commit**

```bash
git add app/admin/settings/community/ app/admin/settings/page.tsx
git commit -m "feat: admin community settings — notifications, digest, indexing, prompts"
```

---

## Task 15: Cron — room prompt poster

**Files:**
- Create: `app/api/cron/room-prompts/route.ts`
- Modify: `vercel.json`

**Step 1: Opret cron route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { getSiteSetting } from '@/lib/services/settings.service'
import { prisma } from '@/lib/prisma'
import * as communityService from '@/lib/services/community.service'

const BATCH_SIZE = 20

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check configured posting time
  const configuredTime = await getSiteSetting('community_prompt_time') || '08:00'
  const now = new Date()
  const currentHour = now.getUTCHours() // Vercel cron runs in UTC
  const [configHour] = configuredTime.split(':').map(Number)
  // Allow 1-hour window for cron timing flexibility
  // Note: configuredTime is in Danish time (UTC+1/+2), adjust accordingly

  // Get prompt author
  let authorId = await getSiteSetting('community_prompt_author_id')
  if (!authorId) {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })
    if (!admin) {
      return NextResponse.json({ message: 'No admin user found', posted: 0 })
    }
    authorId = admin.id
  }

  // Get all active, non-archived rooms
  const rooms = await prisma.communityRoom.findMany({
    where: { isArchived: false },
    select: { id: true, slug: true },
  })

  let posted = 0
  let skipped = 0

  for (let i = 0; i < rooms.length; i += BATCH_SIZE) {
    const batch = rooms.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async (room) => {
        const nextPrompt = await communityService.getNextUnpostedPrompt(room.id)
        if (!nextPrompt) return 'skipped'

        await communityService.createRoomPost(
          room.id,
          authorId!,
          nextPrompt.promptText,
          true // isPublic
        )

        await communityService.markPromptAsPosted(nextPrompt.id)
        return 'posted'
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value === 'posted') posted++
        else skipped++
      }
    }
  }

  return NextResponse.json({
    message: 'Room prompts cron completed',
    roomsChecked: rooms.length,
    posted,
    skipped,
  })
}
```

**Step 2: Tilføj cron schedule til vercel.json**

```json
{ "path": "/api/cron/room-prompts", "schedule": "0 7 * * *" }
```

**Step 3: Commit**

```bash
git add app/api/cron/room-prompts/ vercel.json
git commit -m "feat: cron job for auto-posting room prompts from queue"
```

---

## Task 16: Alumni-adgang + badges

**Files:**
- Modify: `app/journeys/[slug]/community/page.tsx`
- Modify: `lib/services/community.service.ts`

**Step 1: Fjern hard-block på afsluttede forløb**

I `app/journeys/[slug]/community/page.tsx` (linje 27-29), ændr check fra "skal have aktivt forløb" til "skal have eller have haft forløbet":

```typescript
// Eksisterende check:
// const activeJourney = await getUserActiveJourney(user.id)
// if (!activeJourney || activeJourney.journeyId !== journey.id) {

// Ny check: bruger skal have en UserJourney (aktiv ELLER completed)
const userJourney = await prisma.userJourney.findFirst({
  where: {
    userId: user.id,
    journeyId: journey.id,
    status: { in: ['ACTIVE', 'COMPLETED'] },
  },
})
if (!userJourney) {
  redirect(`/journeys/${slug}`)
}
```

**Step 2: Alumni badge i community-sider**

I rum-feed og opslags-sider, hent brugerens afsluttede forløb via `getUserCompletedJourneys()` og vis badge-komponent ved siden af forfatter-navnet.

**Step 3: Commit**

```bash
git add app/journeys/[slug]/community/ lib/services/community.service.ts app/community/
git commit -m "feat: alumni access to cohort discussions + journey badges"
```

---

## Task 17: Middleware + navigation

**Files:**
- Modify: `middleware.ts`
- Modify: `app/admin/_components/admin-nav.tsx`

**Step 1: Opdater middleware**

`/community` routes skal IKKE kræve auth (de er offentlige). Middleware matcher allerede kun specifikke prefixes, men verificér at `/community` ikke er i listen af protected routes.

Nuværende protected routes (linje 36):
```typescript
if ((path.startsWith('/dashboard') || path.startsWith('/admin') || path.startsWith('/onboarding') || path.startsWith('/journeys')) && !user) {
```

`/community` er IKKE i denne liste, så den er allerede offentlig. Ingen ændring nødvendig.

**Step 2: Opdater admin-navigation**

I `app/admin/_components/admin-nav.tsx`, erstat det eksisterende community-link og tilføj nye:

```typescript
// Ændr Medlemmer-sektionen:
{
  label: 'Medlemmer',
  items: [
    { href: '/admin/users', label: 'Brugere', icon: Users },
    { href: '/admin/cohorts', label: 'Kohorter', icon: UsersRound },
    { href: '/admin/settings/tags', label: 'Segmentering', icon: Tags },
  ],
},
// Tilføj ny sektion:
{
  label: 'Fællesskab',
  items: [
    { href: '/admin/community/rooms', label: 'Rum', icon: MessageSquare },
    { href: '/admin/community/prompts', label: 'Prompts', icon: Sparkles },
    { href: '/admin/moderation', label: 'Moderering', icon: Shield },
  ],
},
```

Tilføj imports: `UsersRound, Sparkles, Shield` fra lucide-react.

**Step 3: Commit**

```bash
git add middleware.ts app/admin/_components/admin-nav.tsx
git commit -m "feat: admin nav with community section, verify public community routes"
```

---

## Task 18: Community-digest udvidelse

**Files:**
- Modify: `app/api/cron/community-digest/route.ts`

**Step 1: Udvid digest til at inkludere åbne rum**

Tjek SiteSetting `community_digest_includes_rooms`. Hvis true:
- Hent stats for alle aktive rum via `getRoomWeeklyStats()`
- Inkludér rum-stats i digest-emailen
- Send til alle registrerede brugere (ikke kun kohorte-medlemmer)

Tjek SiteSetting `community_digest_frequency` for frekvens (ændr tidsstempel-check fra hardcodet 7 dage til konfigureret interval).

**Step 2: Commit**

```bash
git add app/api/cron/community-digest/
git commit -m "feat: extend community digest to include open room activity"
```

---

## Opgave-rækkefølge og afhængigheder

```
Task 1 (schema) → Task 2 (seed) → Task 3 (auth)
                                         ↓
Task 5 (slugify) ─────────────────→ Task 4 (service)
                                         ↓
                              ┌──────────┼──────────┐
                              ↓          ↓          ↓
                         Task 6      Task 10     Task 12
                         (oversigt)  (actions)   (admin rum)
                              ↓          ↓          ↓
                         Task 7      Task 11     Task 13
                         (rum-feed)  (UI)        (admin prompts)
                              ↓                     ↓
                         Task 8                 Task 14
                         (post)                 (admin settings)
                              ↓                     ↓
                         Task 9                 Task 15
                         (SEO)                  (cron)
                              ↓
                         Task 16 (alumni)
                              ↓
                         Task 17 (middleware+nav)
                              ↓
                         Task 18 (digest)
```

Opgaver uden indbyrdes afhængighed kan køres parallelt (f.eks. Task 6-8 og Task 12-14).
