# User Management Admin Panel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full user management admin panel with search, filtering, tags, entitlement administration, and engagement insights.

**Architecture:** New admin section at `/admin/users` following existing patterns (service layer, server actions, shadcn/ui). Two new Prisma models (AdminTag, UserTag) + lastActiveAt field on User. All server actions validated with Zod, guarded with `requireAdmin()`. Status (Trial/Aktiv/Inaktiv/Churned) is computed at query time, never stored.

**Tech Stack:** Next.js 16, React 19, Prisma 6, Zod 4, shadcn/ui, Resend, Tailwind CSS 4

**CTO Review:** After Task 6, request CTO review before merge. Focus areas: IDOR, XSS, SQL injection via Prisma, input validation, indices, rate limiting.

**Worktree:** `.worktrees/user-management` (branch: `feature/user-management`)

---

## Task 1: Schema — AdminTag, UserTag, lastActiveAt

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration via `npx prisma migrate dev`

**Step 1: Add AdminTag and UserTag models to schema**

Add after existing models in `prisma/schema.prisma`:

```prisma
model AdminTag {
  id        String    @id @default(uuid()) @db.Uuid
  name      String    @unique
  color     String    @default("#6B7280")
  createdAt DateTime  @default(now())
  users     UserTag[]
}

model UserTag {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  tagId     String   @db.Uuid
  createdAt DateTime @default(now())

  user User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tag  AdminTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([userId, tagId])
  @@index([userId])
  @@index([tagId])
}
```

**Step 2: Add fields to User model**

Add to the User model:

```prisma
lastActiveAt    DateTime?
tags            UserTag[]
```

**Step 3: Run migration**

```bash
npx prisma migrate dev --name add-admin-tags-and-last-active
```

Expected: Migration creates `AdminTag`, `UserTag` tables and adds `lastActiveAt` column to `User`.

**Step 4: Verify schema**

```bash
npx prisma generate
```

Expected: Prisma Client generated successfully.

**Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add AdminTag, UserTag models and lastActiveAt field"
```

---

## Task 2: Tag Service + Validators

**Files:**
- Create: `lib/services/admin-tag.service.ts`
- Create: `lib/validators/admin-tag.ts`

**Step 1: Create tag validators**

File: `lib/validators/admin-tag.ts`

```ts
import { z } from 'zod'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

export const createTagSchema = z.object({
  name: z.string().min(1, 'Navn er påkrævet').max(50, 'Maks 50 tegn').trim(),
  color: z.string().regex(HEX_COLOR, 'Ugyldig hex-farve').default('#6B7280'),
})

export const updateTagSchema = createTagSchema.partial()
```

**Step 2: Create tag service**

File: `lib/services/admin-tag.service.ts`

```ts
import { prisma } from '@/lib/prisma'
import { createTagSchema, updateTagSchema } from '@/lib/validators/admin-tag'
import type { z } from 'zod'

type CreateTagInput = z.infer<typeof createTagSchema>
type UpdateTagInput = z.infer<typeof updateTagSchema>

export async function listTags() {
  return prisma.adminTag.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function createTag(data: CreateTagInput) {
  const validated = createTagSchema.parse(data)
  return prisma.adminTag.create({ data: validated })
}

export async function updateTag(id: string, data: UpdateTagInput) {
  const validated = updateTagSchema.parse(data)
  return prisma.adminTag.update({ where: { id }, data: validated })
}

export async function deleteTag(id: string) {
  return prisma.adminTag.delete({ where: { id } })
}

const MAX_BULK_TAG_USERS = 200

export async function addTagToUsers(tagId: string, userIds: string[]) {
  if (userIds.length > MAX_BULK_TAG_USERS) {
    throw new Error(`Maks ${MAX_BULK_TAG_USERS} brugere per bulk-operation`)
  }
  // Verify tag exists
  await prisma.adminTag.findUniqueOrThrow({ where: { id: tagId } })

  return prisma.$transaction(
    userIds.map((userId) =>
      prisma.userTag.upsert({
        where: { userId_tagId: { userId, tagId } },
        create: { userId, tagId },
        update: {},
      })
    )
  )
}

export async function removeTagFromUsers(tagId: string, userIds: string[]) {
  if (userIds.length > MAX_BULK_TAG_USERS) {
    throw new Error(`Maks ${MAX_BULK_TAG_USERS} brugere per bulk-operation`)
  }
  return prisma.userTag.deleteMany({
    where: { tagId, userId: { in: userIds } },
  })
}
```

**Step 3: Commit**

```bash
git add lib/services/admin-tag.service.ts lib/validators/admin-tag.ts
git commit -m "feat: tag service with Zod validation and bulk operations"
```

---

## Task 3: Tag Settings Page

**Files:**
- Create: `app/admin/settings/tags/page.tsx`
- Create: `app/admin/settings/tags/actions.ts`
- Create: `app/admin/settings/tags/_components/admin-tag-form.tsx`
- Create: `app/admin/settings/tags/_components/admin-tag-list.tsx`
- Modify: `app/admin/settings/page.tsx` — add tags card to settings hub

**Step 1: Create server actions**

File: `app/admin/settings/tags/actions.ts`

```ts
'use server'

import { requireAdmin } from '@/lib/auth'
import * as tagService from '@/lib/services/admin-tag.service'
import { createTagSchema, updateTagSchema } from '@/lib/validators/admin-tag'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

type CreateInput = z.input<typeof createTagSchema>
type UpdateInput = z.input<typeof updateTagSchema>

export async function createTagAction(data: CreateInput) {
  await requireAdmin()
  const result = await tagService.createTag(data)
  revalidatePath('/admin/settings/tags')
  return result
}

export async function updateTagAction(id: string, data: UpdateInput) {
  await requireAdmin()
  const result = await tagService.updateTag(id, data)
  revalidatePath('/admin/settings/tags')
  return result
}

export async function deleteTagAction(id: string) {
  await requireAdmin()
  await tagService.deleteTag(id)
  revalidatePath('/admin/settings/tags')
}
```

**Step 2: Create tag form component (client)**

File: `app/admin/settings/tags/_components/admin-tag-form.tsx`

A client component with:
- Input for tag name (max 50 chars)
- Color picker (6 preset colors + custom hex input)
- Submit button
- Uses `useTransition()` for pending state
- Calls `createTagAction`
- Toast on success/error

**Step 3: Create tag list component (client)**

File: `app/admin/settings/tags/_components/admin-tag-list.tsx`

A client component showing:
- Table: Tag name (with color badge), Bruger-antal, Actions (edit/delete)
- Inline edit via Dialog
- Delete confirmation Dialog
- Uses `useTransition()` + `toast()`

**Step 4: Create settings page (server)**

File: `app/admin/settings/tags/page.tsx`

```tsx
import { requireAdmin } from '@/lib/auth'
import { listTags } from '@/lib/services/admin-tag.service'
import { Separator } from '@/components/ui/separator'
import { AdminTagForm } from './_components/admin-tag-form'
import { AdminTagList } from './_components/admin-tag-list'

export default async function AdminTagsPage() {
  await requireAdmin()
  const tags = await listTags()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bruger-tags</h1>
        <p className="text-muted-foreground">
          Opret og administrer tags til segmentering af brugere
        </p>
      </div>
      <AdminTagForm />
      <Separator />
      <AdminTagList tags={tags} />
    </div>
  )
}
```

**Step 5: Add tags to settings hub**

Modify `app/admin/settings/page.tsx`: Add a new entry to `settingsSections`:

```ts
{
  href: '/admin/settings/tags',
  title: 'Bruger-tags',
  description: 'Opret tags til segmentering og markedsføring',
  icon: Tag, // import from lucide-react
},
```

**Step 6: Verify page loads**

```bash
# Start dev server and navigate to /admin/settings/tags
npx next dev
```

Expected: Page renders with empty tag list and create form.

**Step 7: Commit**

```bash
git add app/admin/settings/tags/ app/admin/settings/page.tsx
git commit -m "feat: admin tag settings page with CRUD"
```

---

## Task 4: Admin User Service

This is the core service powering the user list and detail pages.

**Files:**
- Create: `lib/services/admin-user.service.ts`
- Create: `lib/validators/admin-user.ts`

**Step 1: Create validators**

File: `lib/validators/admin-user.ts`

```ts
import { z } from 'zod'

export const userListFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  status: z.enum(['TRIAL', 'ACTIVE', 'INACTIVE', 'CHURNED']).optional(),
  tagId: z.string().uuid().optional(),
  journeyId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
})

export const grantAccessSchema = z.object({
  userId: z.string().uuid(),
  productId: z.string().uuid(),
})

export const bulkEmailSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
  subject: z.string().min(1, 'Emne er påkrævet').max(200),
  body: z.string().min(1, 'Besked er påkrævet').max(10000),
})
```

**Step 2: Create admin user service**

File: `lib/services/admin-user.service.ts`

Key functions:

```ts
import { prisma } from '@/lib/prisma'
import { userListFiltersSchema } from '@/lib/validators/admin-user'
import type { z } from 'zod'
import type { Prisma } from '@prisma/client'

type UserListFilters = z.infer<typeof userListFiltersSchema>

const INACTIVE_THRESHOLD_DAYS = 14

// Helper: build Prisma WHERE clause from validated filters
function buildUserWhere(filters: UserListFilters): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {}
  const now = new Date()
  const inactiveThreshold = new Date(now.getTime() - INACTIVE_THRESHOLD_DAYS * 86400000)

  // Text search — parameterized via Prisma (no SQL injection)
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  // Role filter
  if (filters.role) {
    where.role = filters.role
  }

  // Tag filter
  if (filters.tagId) {
    where.tags = { some: { tagId: filters.tagId } }
  }

  // Journey filter
  if (filters.journeyId) {
    where.userJourneys = {
      some: { journeyId: filters.journeyId, status: 'ACTIVE' },
    }
  }

  // Status filter — computed from entitlements + lastActiveAt
  if (filters.status) {
    const hasActiveEntitlement = {
      entitlements: {
        some: {
          status: 'ACTIVE' as const,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      },
    }
    const noActiveEntitlement = {
      NOT: hasActiveEntitlement,
    }
    const hadEntitlement = {
      entitlements: { some: {} },
    }

    switch (filters.status) {
      case 'TRIAL':
        // Has account, never had any entitlement
        Object.assign(where, {
          entitlements: { none: {} },
        })
        break
      case 'ACTIVE':
        // Active entitlement + recent activity
        Object.assign(where, {
          ...hasActiveEntitlement,
          lastActiveAt: { gte: inactiveThreshold },
        })
        break
      case 'INACTIVE':
        // Active entitlement but no recent activity
        Object.assign(where, {
          ...hasActiveEntitlement,
          OR: [
            { lastActiveAt: null },
            { lastActiveAt: { lt: inactiveThreshold } },
          ],
        })
        break
      case 'CHURNED':
        // Had entitlements, none active now
        Object.assign(where, {
          ...noActiveEntitlement,
          ...hadEntitlement,
        })
        break
    }
  }

  return where
}

export async function listUsers(filters: UserListFilters) {
  const validated = userListFiltersSchema.parse(filters)
  const where = buildUserWhere(validated)
  const skip = (validated.page - 1) * validated.pageSize

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        entitlements: {
          where: {
            status: 'ACTIVE',
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          select: { id: true, status: true, source: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: validated.pageSize,
    }),
    prisma.user.count({ where }),
  ])

  return {
    users,
    total,
    page: validated.page,
    pageSize: validated.pageSize,
    totalPages: Math.ceil(total / validated.pageSize),
  }
}

export async function getUserStats() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)
  const inactiveThreshold = new Date(now.getTime() - INACTIVE_THRESHOLD_DAYS * 86400000)

  const activeEntitlementFilter = {
    status: 'ACTIVE' as const,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  }

  const [total, active, trial, newUsers, churned] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({
      where: {
        entitlements: { some: activeEntitlementFilter },
        lastActiveAt: { gte: inactiveThreshold },
      },
    }),
    prisma.user.count({
      where: { entitlements: { none: {} } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.user.count({
      where: {
        NOT: { entitlements: { some: activeEntitlementFilter } },
        entitlements: { some: {} },
      },
    }),
  ])

  return { total, active, trial, newUsers, churned }
}

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tags: { include: { tag: true } },
      entitlements: {
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      },
      userJourneys: {
        include: {
          journey: true,
          currentDay: true,
          checkIns: { orderBy: { completedAt: 'desc' }, take: 10 },
        },
        orderBy: { startedAt: 'desc' },
      },
      cohortMemberships: {
        include: {
          cohort: { include: { journey: { select: { title: true } } } },
        },
      },
      userProfile: true,
      _count: {
        select: {
          discussionPosts: true,
          discussionReplies: true,
          notifications: true,
        },
      },
    },
  })
  return user
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  })
}

export async function getUserActivity(userId: string, limit = 20) {
  // Fetch recent activities from multiple tables and merge chronologically
  const [journeyStarts, checkIns, posts, replies] = await Promise.all([
    prisma.userJourney.findMany({
      where: { userId },
      select: { startedAt: true, journey: { select: { title: true } } },
      orderBy: { startedAt: 'desc' },
      take: limit,
    }),
    prisma.userDayCheckIn.findMany({
      where: { userJourney: { userId } },
      select: {
        completedAt: true,
        mood: true,
        userJourney: {
          select: { journey: { select: { title: true } } },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    }),
    prisma.discussionPost.findMany({
      where: { authorId: userId },
      select: {
        createdAt: true,
        cohort: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.discussionReply.findMany({
      where: { authorId: userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
  ])

  // Merge into unified activity feed
  type Activity = { date: Date; type: string; description: string }
  const activities: Activity[] = []

  for (const j of journeyStarts) {
    activities.push({
      date: j.startedAt,
      type: 'journey_start',
      description: `Startede forløbet "${j.journey.title}"`,
    })
  }
  for (const c of checkIns) {
    activities.push({
      date: c.completedAt,
      type: 'check_in',
      description: `Check-in: ${c.mood ?? '—'} (${c.userJourney.journey.title})`,
    })
  }
  for (const p of posts) {
    activities.push({
      date: p.createdAt,
      type: 'post',
      description: `Indlæg i ${p.cohort.name ?? 'kohorte'}`,
    })
  }
  for (const r of replies) {
    activities.push({
      date: r.createdAt,
      type: 'reply',
      description: 'Svarede på et indlæg',
    })
  }

  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit)
}

export async function updateLastActive(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  })
}
```

**Security notes:**
- All search/filter input is validated through Zod before hitting Prisma
- Prisma parameterizes all queries — no raw SQL, no injection risk
- `buildUserWhere()` constructs type-safe Prisma WHERE clauses
- All functions require `userId` as UUID (validated by Zod upstream)

**Step 3: Commit**

```bash
git add lib/services/admin-user.service.ts lib/validators/admin-user.ts
git commit -m "feat: admin user service with filtering, stats, and activity feed"
```

---

## Task 5: User List Page

**Files:**
- Create: `app/admin/users/page.tsx`
- Create: `app/admin/users/actions.ts`
- Create: `app/admin/users/_components/user-stats.tsx`
- Create: `app/admin/users/_components/user-filters.tsx`
- Create: `app/admin/users/_components/user-table.tsx`
- Create: `app/admin/users/_components/bulk-actions.tsx`
- Modify: `app/admin/layout.tsx` — add "Brugere" nav item (first position)

**Step 1: Create server actions**

File: `app/admin/users/actions.ts`

```ts
'use server'

import { requireAdmin } from '@/lib/auth'
import * as adminUserService from '@/lib/services/admin-user.service'
import * as tagService from '@/lib/services/admin-tag.service'
import { updateUserRoleSchema, grantAccessSchema, bulkEmailSchema } from '@/lib/validators/admin-user'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

export async function updateUserRoleAction(userId: string, data: z.input<typeof updateUserRoleSchema>) {
  await requireAdmin()
  const validated = updateUserRoleSchema.parse(data)
  const result = await adminUserService.updateUserRole(userId, validated.role)
  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return result
}

export async function addTagToUsersAction(tagId: string, userIds: string[]) {
  await requireAdmin()
  await tagService.addTagToUsers(tagId, userIds)
  revalidatePath('/admin/users')
}

export async function removeTagFromUsersAction(tagId: string, userIds: string[]) {
  await requireAdmin()
  await tagService.removeTagFromUsers(tagId, userIds)
  revalidatePath('/admin/users')
}

export async function grantAccessAction(data: z.input<typeof grantAccessSchema>) {
  await requireAdmin()
  const validated = grantAccessSchema.parse(data)
  const { createEntitlement } = await import('@/lib/services/entitlement.service')
  const result = await createEntitlement({
    userId: validated.userId,
    productId: validated.productId,
    source: 'GIFT',
  })
  revalidatePath(`/admin/users/${validated.userId}`)
  return result
}

export async function revokeEntitlementAction(entitlementId: string, userId: string) {
  await requireAdmin()
  const { revokeEntitlement } = await import('@/lib/services/entitlement.service')
  const result = await revokeEntitlement(entitlementId)
  revalidatePath(`/admin/users/${userId}`)
  return result
}

export async function bulkEmailAction(data: z.input<typeof bulkEmailSchema>) {
  await requireAdmin()
  const validated = bulkEmailSchema.parse(data)

  // Fetch user emails
  const { prisma } = await import('@/lib/prisma')
  const users = await prisma.user.findMany({
    where: { id: { in: validated.userIds } },
    select: { email: true },
  })

  // Send via Resend in batches
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const BATCH_SIZE = 50

  let sent = 0
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map((user) =>
        resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: user.email,
          subject: validated.subject,
          text: validated.body,
        })
      )
    )
    sent += batch.length
  }

  return { sent }
}
```

**Step 2: Create stats component (server)**

File: `app/admin/users/_components/user-stats.tsx`

Server component rendering 5 stat cards (Total, Aktive, Trial, Nye, Churned). Each card is a Link that sets the `status` search param — clicking "Churned" navigates to `/admin/users?status=CHURNED`.

**Step 3: Create filters component (client)**

File: `app/admin/users/_components/user-filters.tsx`

Client component with:
- Search input with debounce (300ms) — updates `search` URL param
- Select dropdowns for Role, Status, Tags, Forløb — update URL params
- "Ryd filtre" button that clears all params
- Uses `useRouter()` + `useSearchParams()` wrapped in `<Suspense>`

Tags and journeys data passed as props from parent server component.

**Step 4: Create user table component (client)**

File: `app/admin/users/_components/user-table.tsx`

Client component with:
- Checkbox column for bulk selection (header checkbox selects all)
- Columns: Navn, Email, Status (color badge), Tags (badges), Sidst aktiv (relative time)
- Row click navigates to `/admin/users/[id]`
- Pagination controls at bottom (Forrige / Næste + page indicator)

Status badge colors:
- Trial: `bg-blue-100 text-blue-800`
- Aktiv: `bg-green-100 text-green-800`
- Inaktiv: `bg-yellow-100 text-yellow-800`
- Churned: `bg-red-100 text-red-800`

**Step 5: Create bulk actions toolbar (client)**

File: `app/admin/users/_components/bulk-actions.tsx`

Client component that:
- Shows when `selectedUserIds.length > 0`
- Buttons: Tilføj tag, Fjern tag, Send email, Eksportér
- Tag operations use Dialog with tag selector dropdown
- Email uses Dialog with subject + body textarea + confirmation showing recipient count
- All actions use `useTransition()` + `toast()`

**Step 6: Create list page (server)**

File: `app/admin/users/page.tsx`

```tsx
import { requireAdmin } from '@/lib/auth'
import { listUsers, getUserStats } from '@/lib/services/admin-user.service'
import { listTags } from '@/lib/services/admin-tag.service'
import { prisma } from '@/lib/prisma'
import { UserStats } from './_components/user-stats'
import { UserFilters } from './_components/user-filters'
import { UserTable } from './_components/user-table'
import { Suspense } from 'react'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  await requireAdmin()
  const params = await searchParams

  const [result, stats, tags, journeys] = await Promise.all([
    listUsers({
      search: params.search,
      role: params.role as 'USER' | 'ADMIN' | undefined,
      status: params.status as 'TRIAL' | 'ACTIVE' | 'INACTIVE' | 'CHURNED' | undefined,
      tagId: params.tagId,
      journeyId: params.journeyId,
      page: params.page ? parseInt(params.page) : 1,
    }),
    getUserStats(),
    listTags(),
    prisma.journey.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Brugere</h1>
        <p className="text-muted-foreground">
          Administrer brugere, tags og adgang
        </p>
      </div>

      <UserStats stats={stats} />

      <Suspense>
        <UserFilters tags={tags} journeys={journeys} />
      </Suspense>

      <UserTable
        users={result.users}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        tags={tags}
      />
    </div>
  )
}
```

**Step 7: Add nav item to admin layout**

Modify `app/admin/layout.tsx` — add as FIRST item in `navItems`:

```ts
{ href: '/admin/users', label: 'Brugere', icon: UserSearch },
```

Import `UserSearch` from `lucide-react` (distinct from existing `Users` icon used for Kohorter).

**Step 8: Install any missing shadcn components**

Check if `checkbox` and `popover` components exist. If not:

```bash
npx shadcn@latest add checkbox popover
```

**Step 9: Verify page loads**

Start dev server, navigate to `/admin/users`. Expected: Stats cards, empty/populated user table, filters.

**Step 10: Commit**

```bash
git add app/admin/users/ app/admin/layout.tsx components/ui/
git commit -m "feat: user list page with search, filters, stats, and bulk actions"
```

---

## Task 6: User Detail Page

**Files:**
- Create: `app/admin/users/[id]/page.tsx`
- Create: `app/admin/users/[id]/_components/user-header.tsx`
- Create: `app/admin/users/[id]/_components/overview-tab.tsx`
- Create: `app/admin/users/[id]/_components/purchases-tab.tsx`
- Create: `app/admin/users/[id]/_components/journeys-tab.tsx`
- Create: `app/admin/users/[id]/_components/community-tab.tsx`
- Create: `app/admin/users/[id]/_components/notifications-tab.tsx`

**Step 1: Create detail page (server)**

File: `app/admin/users/[id]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getUserDetail, getUserActivity } from '@/lib/services/admin-user.service'
import { listTags } from '@/lib/services/admin-tag.service'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import { UserHeader } from './_components/user-header'
import { OverviewTab } from './_components/overview-tab'
import { PurchasesTab } from './_components/purchases-tab'
import { JourneysTab } from './_components/journeys-tab'
import { CommunityTab } from './_components/community-tab'
import { NotificationsTab } from './_components/notifications-tab'

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const { tab } = await searchParams

  const [user, activity, allTags] = await Promise.all([
    getUserDetail(id),
    getUserActivity(id),
    listTags(),
  ])

  if (!user) notFound()

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 size-4" />
          Tilbage til brugere
        </Link>
      </Button>

      <UserHeader user={user} allTags={allTags} />

      <Tabs defaultValue={tab ?? 'overview'}>
        <TabsList>
          <TabsTrigger value="overview">Oversigt</TabsTrigger>
          <TabsTrigger value="purchases">Køb</TabsTrigger>
          <TabsTrigger value="journeys">Forløb</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="notifications">Notifikationer</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab user={user} activity={activity} />
        </TabsContent>
        <TabsContent value="purchases">
          <PurchasesTab user={user} />
        </TabsContent>
        <TabsContent value="journeys">
          <JourneysTab user={user} />
        </TabsContent>
        <TabsContent value="community">
          <CommunityTab user={user} />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Step 2: Create user header (client)**

File: `app/admin/users/[id]/_components/user-header.tsx`

Shows:
- User name (h1), email, `Oprettet {date}`
- Computed status badge (Trial/Aktiv/Inaktiv/Churned)
- Role dropdown (USER/ADMIN) — calls `updateUserRoleAction` on change
- Tag badges with × remove button + "Tilføj tag" dropdown
- Tags use the AdminTag color for badge background

XSS note: User name and email are rendered as text content (not `dangerouslySetInnerHTML`). React auto-escapes.

**Step 3: Create overview tab**

File: `app/admin/users/[id]/_components/overview-tab.tsx`

- Two summary cards in 2-column grid:
  - **Abonnement**: Active entitlement product name, price, start date. Or "Intet aktivt abonnement"
  - **Engagement**: Active journey count, total check-ins, community post count
- Activity timeline below: Chronological list of activities with date, icon per type, description
- Uses `formatDate()` helper consistent with existing admin pages

**Step 4: Create purchases tab**

File: `app/admin/users/[id]/_components/purchases-tab.tsx`

- Table: Produkt, Kilde (badge), Status (badge), Startdato, Udløb
- Actions per row: Revoke (with confirmation dialog)
- "Giv adgang" button at top — Dialog with product selector dropdown, calls `grantAccessAction`
- Source badges: SUBSCRIPTION=default, PURCHASE=secondary, GIFT=outline, B2B_LICENSE=default

**Step 5: Create journeys tab**

File: `app/admin/users/[id]/_components/journeys-tab.tsx`

- Active journeys: Card per journey with title, progress bar (current day / total days), started date
- Completed journeys: Simpler list with title + completed date
- Empty state: "Brugeren har ikke startet nogen forløb"

**Step 6: Create community tab**

File: `app/admin/users/[id]/_components/community-tab.tsx`

- Cohort memberships table: Kohorte-navn, Forløb, Tilmeldt dato
- Stats: Antal indlæg, antal svar
- Bans section (if any): Kohort, Årsag, Dato

**Step 7: Create notifications tab**

File: `app/admin/users/[id]/_components/notifications-tab.tsx`

- Fetch notifications and notification logs for this user (server component or inline query)
- Table: Type, Titel, Dato, Læst (ja/nej)
- Notification logs: Type (engagement/reengagement), Key, Sendt dato

**Step 8: Verify detail page**

Navigate to `/admin/users/[id]` for a known user. All 5 tabs should render.

**Step 9: Commit**

```bash
git add app/admin/users/[id]/
git commit -m "feat: user detail page with overview, purchases, journeys, community, notifications tabs"
```

---

## Task 7: lastActiveAt Tracking

**Files:**
- Create: `lib/track-activity.ts`
- Modify: `app/dashboard/page.tsx` — call tracker
- Modify: `app/journeys/[slug]/page.tsx` — call tracker (if exists)

**Step 1: Create lightweight tracking function**

File: `lib/track-activity.ts`

```ts
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * Updates lastActiveAt for the current user.
 * Fire-and-forget — errors are silently caught to avoid disrupting page loads.
 * Throttled: only updates if last update was >5 minutes ago.
 */
export async function trackActivity() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { lastActiveAt: true },
    })

    // Throttle: skip if updated within 5 minutes
    if (dbUser?.lastActiveAt) {
      const diff = Date.now() - dbUser.lastActiveAt.getTime()
      if (diff < 5 * 60 * 1000) return
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })
  } catch {
    // Silent catch — tracking should never break user experience
  }
}
```

**Step 2: Add to dashboard page**

Add at the top of the dashboard server component (after auth check):

```ts
import { trackActivity } from '@/lib/track-activity'

// Inside the component, after auth:
trackActivity() // fire-and-forget, no await
```

**Step 3: Add to other key pages**

Add the same `trackActivity()` call to:
- Journey detail pages
- Community feed pages

**Step 4: Commit**

```bash
git add lib/track-activity.ts app/dashboard/page.tsx
git commit -m "feat: track lastActiveAt for user activity status"
```

---

## Task 8: CTO Review + Security Hardening

**This task is a review checkpoint, not implementation.**

**Step 1: Self-review checklist**

Before requesting CTO review, verify:

- [ ] All server actions call `requireAdmin()` as first line
- [ ] All user input validated with Zod (search, filters, tag names, email body)
- [ ] No raw SQL — all queries via Prisma (parameterized)
- [ ] No `dangerouslySetInnerHTML` anywhere
- [ ] Tag names sanitized (`.trim()`, max length)
- [ ] Bulk operations have hard limits (200 tags, 100 emails)
- [ ] `$transaction` used for multi-write operations
- [ ] Proper DB indices on new models (@@index on UserTag.userId, UserTag.tagId)
- [ ] `revalidatePath()` called after all mutations
- [ ] Danish text uses proper æøå, not ASCII
- [ ] Empty states handled for all lists/tables
- [ ] No N+1 queries in list views (use `include` in Prisma)

**Step 2: Request CTO review**

Use `superpowers:requesting-code-review` skill.

Focus areas for reviewer:
1. **IDOR**: Can a non-admin access any of these routes? (Should be blocked by `requireAdmin()`)
2. **XSS**: User names, tag names, email content — all auto-escaped by React?
3. **Input validation**: Any path where unvalidated input reaches Prisma?
4. **Performance**: N+1 in `listUsers`? Stats queries hitting indices?
5. **Rate limiting**: Bulk email has batch limit, but is there request-level rate limiting?
6. **Data integrity**: Can admin accidentally delete their own admin role?

**Step 3: Apply review fixes**

Implement any issues found during CTO review.

**Step 4: Final commit and merge preparation**

```bash
git add -A
git commit -m "fix: CTO review — security hardening and fixes"
```
