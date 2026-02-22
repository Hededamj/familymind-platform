# Production Readiness (Fase A+B) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make FamilyMind 2.0 deploy-ready on Vercel with correct timezone handling, idempotent seed, error tracking, and loading states.

**Architecture:** All changes are infrastructure/config — no new features. Sentry for error tracking, timezone-aware cron scheduling, upsert-based seeding, and Next.js loading/error boundaries.

**Tech Stack:** Sentry (Next.js SDK), Prisma 6, Vercel Cron, Next.js 16 App Router

---

## Fase A: Deploy-klar

### Task 1: Install and configure Sentry

**Files:**
- Modify: `package.json` (add @sentry/nextjs)
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Modify: `next.config.ts` (wrap with withSentryConfig)
- Modify: `.env.example` (add SENTRY_DSN, SENTRY_AUTH_TOKEN)
- Create: `app/global-error.tsx` (Sentry error boundary for root layout)

**Step 1: Install Sentry SDK**

Run:
```bash
npm install @sentry/nextjs
```

**Step 2: Create Sentry client config**

Create `sentry.client.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  enabled: process.env.NODE_ENV === 'production',
})
```

**Step 3: Create Sentry server config**

Create `sentry.server.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
})
```

**Step 4: Create Sentry edge config**

Create `sentry.edge.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
})
```

**Step 5: Wrap next.config.ts with Sentry**

Modify `next.config.ts`:
```typescript
import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.b-cdn.net',
      },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  tunnelRoute: '/monitoring',
})
```

**Step 6: Create global error boundary**

Create `app/global-error.tsx`:
```tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Noget gik galt</h2>
          <p>Vi har registreret fejlen og arbejder på at løse den.</p>
          <button onClick={reset}>Prøv igen</button>
        </div>
      </body>
    </html>
  )
}
```

**Step 7: Add env vars to .env.example**

Add to `.env.example`:
```
# Sentry (error tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

**Step 8: Verify build**

Run: `npx next build`
Expected: Build succeeds (Sentry init is no-op without DSN in dev)

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Sentry error tracking with client/server/edge configs"
```

---

### Task 2: Stripe webhook end-to-end verification script

This task creates a manual test checklist and a smoke-test script for verifying Stripe integration locally using the Stripe CLI.

**Files:**
- Create: `scripts/test-stripe-webhook.sh`

**Step 1: Create the test script**

Create `scripts/test-stripe-webhook.sh`:
```bash
#!/bin/bash
# Stripe Webhook Local Test Script
# Prerequisites: stripe CLI installed, .env.local configured
#
# Usage:
#   1. Start dev server: npm run dev
#   2. In another terminal: stripe listen --forward-to localhost:3000/api/webhooks/stripe
#   3. In a third terminal: bash scripts/test-stripe-webhook.sh
#
# This triggers test events via Stripe CLI.

set -e

echo "=== FamilyMind Stripe Webhook Test ==="
echo ""
echo "Ensure your dev server is running on localhost:3000"
echo "Ensure stripe listen is forwarding to localhost:3000/api/webhooks/stripe"
echo ""

# Test 1: checkout.session.completed
echo "[1/3] Triggering checkout.session.completed..."
stripe trigger checkout.session.completed
echo "  -> Check server logs for entitlement creation"
echo ""

# Test 2: customer.subscription.updated
echo "[2/3] Triggering customer.subscription.updated..."
stripe trigger customer.subscription.updated
echo "  -> Check server logs for subscription status update"
echo ""

# Test 3: customer.subscription.deleted
echo "[3/3] Triggering customer.subscription.deleted..."
stripe trigger customer.subscription.deleted
echo "  -> Check server logs for subscription cancellation"
echo ""

echo "=== Manual verification checklist ==="
echo "[ ] Entitlement created in database after checkout.session.completed"
echo "[ ] Entitlement status updated after subscription.updated"
echo "[ ] Entitlement cancelled after subscription.deleted"
echo "[ ] No duplicate entitlements on retry (idempotency)"
echo "[ ] Bundle purchase creates entitlements for all included products"
```

**Step 2: Commit**

```bash
git add scripts/test-stripe-webhook.sh
git commit -m "chore: add Stripe webhook local test script"
```

---

## Fase B: Før rigtige brugere

### Task 3: Fix UTC → CET/CEST in engagement cron

The engagement cron uses `getUTCHours()` and `getUTCDay()` to match notification schedules. Danish users are in CET (UTC+1) / CEST (UTC+2). Schedules stored as "08:00" mean 08:00 Danish time, but are matched against UTC.

**Files:**
- Modify: `app/api/cron/engagement/route.ts` (lines 187-204)
- Create: `lib/utils/timezone.ts`

**Step 1: Create timezone utility**

Create `lib/utils/timezone.ts`:
```typescript
/**
 * Get the current time in Danish timezone (Europe/Copenhagen).
 * Handles CET (UTC+1) and CEST (UTC+2) automatically.
 */
export function getDanishTime(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('da-DK', {
    timeZone: 'Europe/Copenhagen',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00'
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? ''

  // Map Danish weekday name to JS day number (0=Sunday)
  const dayMap: Record<string, number> = {
    søndag: 0,
    mandag: 1,
    tirsdag: 2,
    onsdag: 3,
    torsdag: 4,
    fredag: 5,
    lørdag: 6,
  }

  return {
    dayOfWeek: dayMap[weekday.toLowerCase()] ?? new Date().getDay(),
    hour: parseInt(hour, 10),
    timeStr: `${hour}:00`,
  }
}
```

**Step 2: Update engagement cron to use Danish time**

Modify `app/api/cron/engagement/route.ts` — replace lines 187-190:

Replace:
```typescript
const now = new Date()
const currentDayOfWeek = now.getUTCDay() // 0 = Sunday
const currentHour = now.getUTCHours()
const currentTimeStr = `${String(currentHour).padStart(2, '0')}:00`
```

With:
```typescript
import { getDanishTime } from '@/lib/utils/timezone'

const danishTime = getDanishTime()
const currentDayOfWeek = danishTime.dayOfWeek
const currentHour = danishTime.hour
const currentTimeStr = danishTime.timeStr
```

Note: The import must go to the top of the file with other imports.

**Step 3: Verify build**

Run: `npx next build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add lib/utils/timezone.ts app/api/cron/engagement/route.ts
git commit -m "fix: use Danish timezone (CET/CEST) in engagement cron scheduling"
```

---

### Task 4: Make seed file idempotent

Every `.create()` in `prisma/seed.ts` must become `.upsert()` so the seed can run multiple times safely.

**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Rewrite seed.ts with upserts**

The pattern for each entity is:
```typescript
// Before (non-idempotent):
prisma.foo.create({ data: { key: 'x', ... } })

// After (idempotent):
prisma.foo.upsert({
  where: { key: 'x' },
  update: {},  // Don't overwrite existing customizations
  create: { key: 'x', ... },
})
```

Apply this transformation to ALL create calls in `prisma/seed.ts`:

1. **CheckInOption** — upsert on `value` (add `@@unique` or use `where` on a findFirst + create-if-not-exist pattern since CheckInOption has no natural unique field other than `id`). Use a helper: check if option with same `value` exists, skip if so.

2. **DashboardMessage** — upsert on `stateKey` (unique).

3. **EmailTemplate** — upsert on `templateKey` (unique).

4. **NotificationSchedule** — no single unique field. Use `where` on composite `type + dayOfWeek + timeOfDay` via findFirst + create.

5. **ReEngagementTier** — upsert on `tierNumber` (unique).

6. **MilestoneDefinition** — no natural unique. Use findFirst on `name` + create.

7. **OnboardingQuestion** — no natural unique. Use findFirst on `questionText` + create.

8. **ContentTag** — upsert on `slug` (unique).

9. **OnboardingOption** — depends on parent questionId. Skip if question already has options.

10. **SiteSetting** — upsert on `key` (unique).

11. **Journey + phases + days** — upsert on `slug` (unique). If journey exists, skip phase/day creation.

For entities without a unique field, use the pattern:
```typescript
async function seedIfNotExists<T>(
  model: { findFirst: Function; create: Function },
  where: object,
  data: object
): Promise<T> {
  const existing = await model.findFirst({ where })
  if (existing) return existing as T
  return model.create({ data }) as Promise<T>
}
```

**Step 2: Verify seed runs twice without error**

Run (requires DATABASE_URL):
```bash
npx prisma db seed
npx prisma db seed  # Second run should succeed
```

**Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "fix: make seed file idempotent with upserts"
```

---

### Task 5: Add loading.tsx and error.tsx for key routes

**Files:**
- Create: `app/dashboard/loading.tsx`
- Create: `app/dashboard/error.tsx`
- Create: `app/journeys/[slug]/loading.tsx`
- Create: `app/journeys/[slug]/error.tsx`
- Create: `app/admin/loading.tsx`
- Create: `app/admin/error.tsx`

**Step 1: Create dashboard loading state**

Create `app/dashboard/loading.tsx`:
```tsx
import { Card, CardContent } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col px-4 py-6 pb-24 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>

        {/* Journey card skeleton */}
        <Card>
          <CardContent className="py-6">
            <div className="space-y-3">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-10 w-32 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Content cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Create dashboard error boundary**

Create `app/dashboard/error.tsx`:
```tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <h2 className="mb-2 text-lg font-semibold">Noget gik galt</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Vi kunne ikke indlæse dit dashboard. Prøv igen om et øjeblik.
          </p>
          <Button onClick={reset}>Prøv igen</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 3: Create journey loading state**

Create `app/journeys/[slug]/loading.tsx`:
```tsx
import { Card, CardContent } from '@/components/ui/card'

export default function JourneyLoading() {
  return (
    <div className="flex min-h-screen flex-col px-4 py-6 pb-24 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

**Step 4: Create journey error boundary**

Create `app/journeys/[slug]/error.tsx`:
```tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function JourneyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <h2 className="mb-2 text-lg font-semibold">Kunne ikke indlæse forløbet</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Prøv igen eller gå tilbage til dit dashboard.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={reset} variant="outline">Prøv igen</Button>
            <Button asChild>
              <Link href="/dashboard">Til dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 5: Create admin loading state**

Create `app/admin/loading.tsx`:
```tsx
export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  )
}
```

**Step 6: Create admin error boundary**

Create `app/admin/error.tsx`:
```tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="p-6 text-center">
      <h2 className="mb-2 text-lg font-semibold">Fejl i admin</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {error.message || 'Noget gik galt. Prøv igen.'}
      </p>
      <Button onClick={reset}>Prøv igen</Button>
    </div>
  )
}
```

**Step 7: Verify build**

Run: `npx next build`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add app/dashboard/loading.tsx app/dashboard/error.tsx app/journeys/\[slug\]/loading.tsx app/journeys/\[slug\]/error.tsx app/admin/loading.tsx app/admin/error.tsx
git commit -m "feat: add loading skeletons and error boundaries for dashboard, journey, and admin"
```

---

### Task 6: Add critical database indices

The schema is missing indices on frequently queried paths. Add them to prevent slow queries under load.

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add indices**

Add the following `@@index` directives to the Prisma schema:

```prisma
// On Entitlement model — queried by userId + status frequently
@@index([userId, status])
@@index([stripeSubscriptionId])

// On UserJourney — queried by userId + status
@@index([userId, status])

// On UserDayCheckIn — queried by userJourneyId
@@index([userJourneyId])

// On UserContentProgress — queried by userId + completedAt
@@index([userId, completedAt])

// On Notification — queried by userId + readAt
@@index([userId, readAt])

// On UserNotificationLog — queried by userId + type + key
@@index([userId, type])

// On CohortMember — queried by userId + cohortId
@@index([userId])
```

**Step 2: Verify schema is valid**

Run: `npx prisma validate`
Expected: "The schema is valid."

**Step 3: Generate updated client**

Run: `npx prisma generate`

**Step 4: Verify build**

Run: `npx next build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "perf: add database indices on hot query paths"
```

---

## Deploy Checklist (manual — not code tasks)

After all tasks are committed and pushed:

1. **Create Vercel project** linked to GitHub repo
2. **Set environment variables** on Vercel (all from `.env.example`)
3. **Run database migration**: `npx prisma migrate deploy` (or `prisma db push` for initial)
4. **Run seed**: `npx prisma db seed`
5. **Configure Stripe webhook endpoint** pointing to `https://your-domain.com/api/webhooks/stripe`
6. **Create Sentry project** and set DSN
7. **Verify first deploy** — check Sentry for errors, check cron logs
8. **Test Stripe checkout** with test card `4242 4242 4242 4242`
