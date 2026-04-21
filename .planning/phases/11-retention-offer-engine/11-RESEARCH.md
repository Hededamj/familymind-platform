# Phase 11: Retention Offer Engine - Research

**Researched:** 2026-04-06
**Domain:** Prisma schema extension, Stripe discount API, Stripe Connect account context, eligibility engine design
**Confidence:** HIGH

---

## Summary

Phase 11 builds the configurable retention offer engine that Phase 12 (UI) and Phase 13 (admin config) depend on. The engine resolves a single best offer for a cancelling user, applies it to their Stripe subscription, and prevents abuse via maxUsesPerUser and cooldownDays. All Stripe calls must pass the tenant's `{ stripeAccount: stripeAccountId }` options object when the org has a Connect account — the exact pattern is already established in `lib/services/checkout.service.ts`.

Phase 10 is complete. The schema already has `CancellationSurvey`, `CancellationReason`, `CancellationSurveyTag`, and the `cancelSubscription` / `pauseSubscription` service functions. Phase 11 extends this foundation with three new Prisma models, four new service functions, and a test suite that mirrors the Phase 10 vi.mock pattern exactly.

The most critical decisions: (1) the `discounts` array (not legacy `coupon` string) is the correct Stripe API shape for applying discounts to existing subscriptions; (2) `cancel_at_period_end` can be set to `false` to auto-reverse a pending cancel when a user accepts an offer; (3) expiresAt for a discount acceptance is computed locally as `now + durationMonths` months and stored in our DB — we do not rely on Stripe's discount.end for this because Stripe only sets `end` for `repeating` coupons and only after the first billing cycle, not immediately; (4) the idempotency key for `acceptOffer` is `surveyId` with a unique constraint on `RetentionOfferAcceptance`.

**Primary recommendation:** Build `retention.service.ts` as a self-contained file alongside `cancellation.service.ts`. Reuse `pauseSubscription()` directly from cancellation service rather than duplicating it. The Stripe Connect context resolution pattern from `checkout.service.ts` is the canonical pattern — copy it verbatim.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OFF-ENGINE-01 | Prisma models RetentionOffer, RetentionOfferTrigger, RetentionOfferAcceptance | Schema section below — full field list with indexes |
| OFF-ENGINE-02 | resolveEligibleOffer(userId, reasonSlugs) returning highest-priority eligible offer or null | Eligibility algorithm section below |
| OFF-ENGINE-03 | applyDiscountOffer() with Stripe Connect context | Stripe API section + Connect pattern section |
| OFF-ENGINE-04 | applyPauseOffer() reusing pauseSubscription() + records RetentionOfferAcceptance | Pause reuse section |
| OFF-ENGINE-05 | Auto-reverse cancel_at_period_end when offer accepted | Cancel reversal section — verified against Stripe docs |
| OFF-ENGINE-06 | Idempotency via surveyId unique constraint | Idempotency section |
| OFF-ENGINE-07 | Vitest unit tests with vi.mock for prisma + stripe | Validation Architecture section |
</phase_requirements>

---

## 1. Existing Foundation Audit

### What Phase 10 delivered (confirmed from SUMMARY files + source read)

- `prisma/schema.prisma` has `CancellationSurvey`, `CancellationReason`, `CancellationSurveyTag` — all live in DB via `prisma db push`
- `lib/services/cancellation.service.ts` exports:
  - `cancelSubscription(input: { userId, entitlementId })` — IDOR-safe, survey-gated, sets `cancel_at_period_end: true`
  - `pauseSubscription(input: { userId, entitlementId, months: 1|2|3 })` — Stripe `pause_collection` void behavior
  - `listCancellations()` — admin read with full joins
- 9 Vitest tests GREEN in `lib/services/__tests__/cancellation.service.test.ts`
- `CancellationSurvey.entitlementId` has `@unique` (required for Prisma one-to-one)
- `CancellationSurvey` has compound `@@unique([userId, entitlementId])` for IDOR-safe findUnique

### Key schema facts for Phase 11

- `Entitlement` has `organizationId String? @db.Uuid` — this is how we reach the org's `stripeAccountId`
- `Organization` has `stripeAccountId String? @unique` and `stripeAccountStatus String`
- There is NO `Subscription` model — `Entitlement.stripeSubscriptionId` IS the Stripe subscription ID
- `CancellationSurvey.id` will be used as the idempotency anchor for `RetentionOfferAcceptance`

### Stripe Connect pattern (source: checkout.service.ts lines 32-43, 77)

```typescript
// Pattern from lib/services/checkout.service.ts
let stripeAccountId: string | undefined
if (user.organizationId) {
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { stripeAccountId: true, stripeAccountStatus: true },
  })
  if (org?.stripeAccountId && org.stripeAccountStatus === 'active') {
    stripeAccountId = org.stripeAccountId
  }
}

// Then pass as second argument to every Stripe call:
await stripe.subscriptions.update(
  subscriptionId,
  { /* params */ },
  stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
)
```

This is the exact pattern Phase 11 must replicate. The third argument to `stripe.subscriptions.update()` (and `stripe.subscriptions.retrieve()`, `stripe.coupons.retrieve()`, etc.) accepts `{ stripeAccount: string }` as a RequestOptions object.

---

## 2. Proposed Prisma Schema

### New enum

```prisma
enum RetentionOfferType {
  DISCOUNT
  PAUSE
  SUPPORT
  CONTENT_HELP
  NONE
}
```

### RetentionOffer (the configured offer template)

```prisma
model RetentionOffer {
  id              String              @id @default(uuid()) @db.Uuid
  organizationId  String?             @db.Uuid
  name            String              // Admin label, e.g. "50% off for 1 month"
  offerType       RetentionOfferType
  isActive        Boolean             @default(true)
  priority        Int                 @default(0)   // Higher = shown first when eligible

  // Abuse prevention
  maxUsesPerUser  Int                 @default(1)
  cooldownDays    Int                 @default(365)

  // DISCOUNT-specific
  stripeCouponId  String?             // Stripe coupon ID — set by admin via Phase 13 UI
  durationMonths  Int?                // How many months the discount applies (for display + expiresAt calc)

  // PAUSE-specific
  pauseMonths     Int?                // 1, 2, or 3 — passed to pauseSubscription()

  // SUPPORT-specific
  supportUrl      String?             // URL to support page / contact form
  supportMessage  String?             // Instructional text shown in UI

  // CONTENT_HELP-specific
  contentUrl      String?             // URL to relevant content / resource
  contentMessage  String?

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  triggers        RetentionOfferTrigger[]
  acceptances     RetentionOfferAcceptance[]

  @@index([organizationId, isActive, priority])
  @@index([offerType, isActive])
}
```

**Design decisions:**
- `organizationId` nullable — a null org means the offer applies to all tenants (platform-wide default). This enables FamilyMind's own default offers without requiring a Connect org.
- `priority` is on the offer itself (not the trigger), so the same offer keeps its rank regardless of which reason triggered it.
- Type-specific fields are nullable columns rather than a JSON blob — simpler queries, explicit TypeScript types, easier admin UI validation per type.

### RetentionOfferTrigger (reason-to-offer mapping)

```prisma
model RetentionOfferTrigger {
  id               String             @id @default(uuid()) @db.Uuid
  offerId          String             @db.Uuid
  cancellationReasonId String         @db.Uuid

  offer            RetentionOffer     @relation(fields: [offerId], references: [id], onDelete: Cascade)
  cancellationReason CancellationReason @relation(fields: [cancellationReasonId], references: [id])

  @@unique([offerId, cancellationReasonId])
  @@index([cancellationReasonId])
}
```

**Design decisions:**
- Simple join table — many offers can map to many reasons.
- `@@index([cancellationReasonId])` speeds up the lookup: "given these reason slugs, which offers are triggered?"
- `onDelete: Cascade` — deleting an offer removes its triggers.

### RetentionOfferAcceptance (one row per accepted offer per user per survey)

```prisma
model RetentionOfferAcceptance {
  id              String             @id @default(uuid()) @db.Uuid
  offerId         String             @db.Uuid
  surveyId        String             @unique @db.Uuid  // idempotency key: one acceptance per survey
  userId          String             @db.Uuid
  acceptedAt      DateTime           @default(now())
  offerType       RetentionOfferType // denormalized snapshot at time of acceptance
  expiresAt       DateTime?          // for DISCOUNT: now + durationMonths; for PAUSE: resumesAt

  offer           RetentionOffer     @relation(fields: [offerId], references: [id])
  // Note: surveyId FK to CancellationSurvey added below — requires relation on CancellationSurvey

  @@index([userId, acceptedAt])
  @@index([offerId, acceptedAt])
}
```

**Critical idempotency design:** `surveyId @unique` ensures at most one `RetentionOfferAcceptance` per `CancellationSurvey`. The second call to `acceptOffer({ surveyId })` finds the existing row and returns it without any Stripe call.

**Relation to add on CancellationSurvey:**
```prisma
// Add to CancellationSurvey model:
retentionAcceptance RetentionOfferAcceptance?
```

And on `RetentionOfferAcceptance`:
```prisma
survey           CancellationSurvey @relation(fields: [surveyId], references: [id])
```

**Relation to add on CancellationReason model:**
```prisma
// Add to CancellationReason model:
offerTriggers  RetentionOfferTrigger[]
```

### Migration approach

Use `prisma db push` consistent with Phase 10 (Supabase schema drift — no `migrate dev`). Add new enum with `prisma db push` which handles it correctly. The new enum `RetentionOfferType` must be added before the models that reference it.

---

## 3. Service Function Signatures

All functions go in `lib/services/retention.service.ts` (new file).

```typescript
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { pauseSubscription } from '@/lib/services/cancellation.service'

// ─── Types ───────────────────────────────────────────────────────────────────

export type RetentionOfferType = 'DISCOUNT' | 'PAUSE' | 'SUPPORT' | 'CONTENT_HELP' | 'NONE'

export interface EligibleOffer {
  id: string
  offerType: RetentionOfferType
  stripeCouponId: string | null
  durationMonths: number | null
  pauseMonths: number | null
  supportUrl: string | null
  supportMessage: string | null
  contentUrl: string | null
  contentMessage: string | null
  priority: number
}

export interface AcceptOfferInput {
  userId: string
  entitlementId: string
  surveyId: string
  offerId: string
}

export interface AcceptOfferResult {
  accepted: boolean          // true = newly accepted, false = already existed (idempotent)
  acceptanceId: string
  expiresAt: Date | null
  cancelReversed: boolean    // true = cancel_at_period_end was reversed
}

// ─── Functions ───────────────────────────────────────────────────────────────

export async function resolveEligibleOffer(
  userId: string,
  reasonSlugs: string[]
): Promise<EligibleOffer | null>

export async function acceptOffer(
  input: AcceptOfferInput
): Promise<AcceptOfferResult>

// Internal — not exported, used by acceptOffer
async function applyDiscountOffer(
  stripeSubscriptionId: string,
  stripeCouponId: string,
  stripeAccountId: string | undefined
): Promise<void>

async function applyPauseOffer(
  userId: string,
  entitlementId: string,
  pauseMonths: 1 | 2 | 3,
  surveyId: string,
  offerId: string
): Promise<Date>

async function reverseCancelAtPeriodEnd(
  stripeSubscriptionId: string,
  stripeAccountId: string | undefined
): Promise<void>

async function resolveStripeAccountId(
  userId: string
): Promise<string | undefined>
```

**Design decision: single `acceptOffer()` entry point.** The planner should NOT create separate `acceptDiscountOffer()` / `acceptPauseOffer()` server actions in the UI layer — the engine handles routing internally based on `offer.offerType`. Phase 12 UI just calls `acceptOffer({ userId, entitlementId, surveyId, offerId })`.

---

## 4. Eligibility Check Algorithm

### isOfferEligible() pseudocode

```typescript
async function isOfferEligible(
  offerId: string,
  userId: string
): Promise<boolean> {
  // 1. Fetch the offer's maxUsesPerUser and cooldownDays
  const offer = await prisma.retentionOffer.findUnique({ where: { id: offerId } })
  if (!offer || !offer.isActive) return false

  // 2. Count how many times this user has accepted this specific offer
  const acceptanceCount = await prisma.retentionOfferAcceptance.count({
    where: { offerId, userId },
  })
  if (acceptanceCount >= offer.maxUsesPerUser) return false

  // 3. Check cooldown: has the user accepted this offer within cooldownDays?
  if (offer.cooldownDays > 0 && acceptanceCount > 0) {
    const lastAcceptance = await prisma.retentionOfferAcceptance.findFirst({
      where: { offerId, userId },
      orderBy: { acceptedAt: 'desc' },
    })
    if (lastAcceptance) {
      const cooldownExpiry = new Date(lastAcceptance.acceptedAt)
      cooldownExpiry.setDate(cooldownExpiry.getDate() + offer.cooldownDays)
      if (new Date() < cooldownExpiry) return false
    }
  }

  // 4. Check no OTHER active offer acceptance exists for this user
  //    (one offer shown at a time — prevent stacking)
  const activeAcceptance = await prisma.retentionOfferAcceptance.findFirst({
    where: {
      userId,
      expiresAt: { gt: new Date() },  // still within offer window
    },
  })
  if (activeAcceptance) return false

  return true
}
```

**Active offer check (step 4):** Query `RetentionOfferAcceptance` where `userId = userId AND expiresAt > now`. If any row exists, the user already has an active retention offer — do not stack a second one. NONE-type offers have `expiresAt = null` so they do not trigger this block.

### resolveEligibleOffer() algorithm

```typescript
export async function resolveEligibleOffer(
  userId: string,
  reasonSlugs: string[]
): Promise<EligibleOffer | null> {
  if (!reasonSlugs.length) return null

  // 1. Find all CancellationReason IDs matching the provided slugs
  const reasons = await prisma.cancellationReason.findMany({
    where: { slug: { in: reasonSlugs } },
    select: { id: true },
  })
  const reasonIds = reasons.map(r => r.id)
  if (!reasonIds.length) return null

  // 2. Find all active offers triggered by any of these reasons,
  //    ordered by priority DESC (highest priority first)
  const candidates = await prisma.retentionOffer.findMany({
    where: {
      isActive: true,
      triggers: {
        some: {
          cancellationReasonId: { in: reasonIds },
        },
      },
    },
    orderBy: { priority: 'desc' },
  })

  // 3. Walk candidates in priority order, return first eligible one
  for (const candidate of candidates) {
    const eligible = await isOfferEligible(candidate.id, userId)
    if (eligible) {
      return {
        id: candidate.id,
        offerType: candidate.offerType,
        stripeCouponId: candidate.stripeCouponId,
        durationMonths: candidate.durationMonths,
        pauseMonths: candidate.pauseMonths,
        supportUrl: candidate.supportUrl,
        supportMessage: candidate.supportMessage,
        contentUrl: candidate.contentUrl,
        contentMessage: candidate.contentMessage,
        priority: candidate.priority,
      }
    }
  }

  return null
}
```

**Organization scoping:** The query above does NOT filter by `organizationId` — this means platform-wide offers (where `organizationId = null`) are visible to all tenants. If multi-tenant isolation is needed in future, add `where: { OR: [{ organizationId: null }, { organizationId: user.organizationId }] }`. For Phase 11, the simpler query is correct since all current users are on one platform instance.

---

## 5. acceptOffer() Implementation

```typescript
export async function acceptOffer(input: AcceptOfferInput): Promise<AcceptOfferResult> {
  const { userId, entitlementId, surveyId, offerId } = input

  // OFF-ENGINE-06: Idempotency — check for existing acceptance with this surveyId
  const existing = await prisma.retentionOfferAcceptance.findUnique({
    where: { surveyId },
  })
  if (existing) {
    return {
      accepted: false,
      acceptanceId: existing.id,
      expiresAt: existing.expiresAt,
      cancelReversed: false,
    }
  }

  // IDOR guard: verify entitlement belongs to user and is ACTIVE
  const entitlement = await prisma.entitlement.findFirst({
    where: { id: entitlementId, userId, status: 'ACTIVE' },
  })
  if (!entitlement?.stripeSubscriptionId) {
    throw new Error('Intet aktivt abonnement fundet')
  }

  // Fetch the offer
  const offer = await prisma.retentionOffer.findUniqueOrThrow({
    where: { id: offerId },
  })

  // Resolve Stripe Connect account for this user's org
  const stripeAccountId = await resolveStripeAccountId(userId)

  let expiresAt: Date | null = null
  let cancelReversed = false

  if (offer.offerType === 'DISCOUNT') {
    if (!offer.stripeCouponId) {
      throw new Error('Tilbud mangler Stripe coupon ID')
    }
    await applyDiscountOffer(
      entitlement.stripeSubscriptionId,
      offer.stripeCouponId,
      stripeAccountId
    )
    if (offer.durationMonths) {
      expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + offer.durationMonths)
    }
  }

  if (offer.offerType === 'PAUSE') {
    const months = (offer.pauseMonths ?? 1) as 1 | 2 | 3
    // applyPauseOffer calls pauseSubscription() which makes the Stripe call
    expiresAt = await applyPauseOffer(userId, entitlementId, months, surveyId, offerId)
  }

  // OFF-ENGINE-05: Auto-reverse cancel_at_period_end if it was set
  // Check and reverse for DISCOUNT, SUPPORT, CONTENT_HELP, NONE — not PAUSE
  // (PAUSE handles its own Stripe state; cancel was not necessarily set for pause offers)
  if (offer.offerType !== 'PAUSE') {
    const stripe = getStripe()
    const sub = await stripe.subscriptions.retrieve(
      entitlement.stripeSubscriptionId,
      {},
      stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    )
    const subData = sub as unknown as { cancel_at_period_end: boolean }
    if (subData.cancel_at_period_end) {
      await reverseCancelAtPeriodEnd(entitlement.stripeSubscriptionId, stripeAccountId)
      cancelReversed = true
    }
  }

  // Record acceptance
  const acceptance = await prisma.retentionOfferAcceptance.create({
    data: {
      offerId,
      surveyId,
      userId,
      offerType: offer.offerType,
      expiresAt,
    },
  })

  return {
    accepted: true,
    acceptanceId: acceptance.id,
    expiresAt,
    cancelReversed,
  }
}
```

---

## 6. Stripe API Details

### Applying a discount to an existing subscription (OFF-ENGINE-03)

**Verified API shape (Stripe docs, 2026-04-06):**

```typescript
async function applyDiscountOffer(
  stripeSubscriptionId: string,
  stripeCouponId: string,
  stripeAccountId: string | undefined
): Promise<void> {
  const stripe = getStripe()
  await stripe.subscriptions.update(
    stripeSubscriptionId,
    {
      discounts: [{ coupon: stripeCouponId }],
    },
    stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
  )
}
```

**Key API fact:** The parameter is `discounts: [{ coupon: 'coupon_id' }]` — an array. The legacy top-level `coupon` string parameter is NOT documented in current Stripe API. Use the `discounts` array.

**Confidence:** HIGH — verified against https://docs.stripe.com/api/subscriptions/update

**What happens to existing discounts:** Setting `discounts: [{ coupon: newCouponId }]` replaces any existing subscription-level discount with the new one. If you need to preserve existing discounts AND add a new one, use `discounts: [existingDiscountId, { coupon: newCouponId }]` with the `discount` field (existing discount ID). For retention purposes, replacing is the correct behavior.

### Cancel flag reversal (OFF-ENGINE-05)

**Verified:** Setting `cancel_at_period_end: false` on a subscription that has `cancel_at_period_end: true` reverts it. The subscription returns to normal billing.

```typescript
async function reverseCancelAtPeriodEnd(
  stripeSubscriptionId: string,
  stripeAccountId: string | undefined
): Promise<void> {
  const stripe = getStripe()
  await stripe.subscriptions.update(
    stripeSubscriptionId,
    { cancel_at_period_end: false },
    stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
  )
}
```

**Confidence:** HIGH — verified against Stripe subscription update docs (parameter documented as settable to false).

### Stripe subscription retrieve with Connect context

```typescript
const sub = await stripe.subscriptions.retrieve(
  stripeSubscriptionId,
  {},                    // expand params (empty object, not undefined, when passing options)
  stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
)
```

**Note on SDK overloads:** `stripe.subscriptions.retrieve()` has two overloads: `(id, params?, options?)`. When passing the third arg (options), must also pass second arg (params) — use `{}` for empty params.

**Stripe SDK type cast (same as Phase 10 pattern):**
```typescript
const subData = sub as unknown as { cancel_at_period_end: boolean; current_period_end: number }
```

### expiresAt computation for DISCOUNT offers

Stripe's `Discount` object has an `end` timestamp, but it is only populated for `repeating`-duration coupons AND only after the first billing cycle completes. It is not immediately available at the time of applying the discount.

**Recommendation:** Compute `expiresAt` locally as `now + durationMonths` months when recording the `RetentionOfferAcceptance`. This is reliable, synchronous, and doesn't require an extra Stripe retrieve call. Store it in our DB — it's for Phase 12 UI display and Phase 13 analytics only.

```typescript
if (offer.durationMonths) {
  expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + offer.durationMonths)
}
```

---

## 7. Stripe Connect Context Handling

### Canonical pattern (from checkout.service.ts)

```typescript
async function resolveStripeAccountId(userId: string): Promise<string | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  })
  if (!user?.organizationId) return undefined

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { stripeAccountId: true, stripeAccountStatus: true },
  })
  if (org?.stripeAccountId && org.stripeAccountStatus === 'active') {
    return org.stripeAccountId
  }
  return undefined
}
```

### Passing to every Stripe call

Every `stripe.subscriptions.*` and `stripe.coupons.*` call that touches a Connect-enabled tenant's subscription MUST pass the options object:

```typescript
stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
```

**No-op for platform subscriptions:** If `stripeAccountId` is undefined (user has no org, or org has no active Connect account), the third argument is `undefined` and Stripe uses the platform account. This is the correct fallback for FamilyMind's own users.

**Rule:** Resolve `stripeAccountId` ONCE at the start of `acceptOffer()` and thread it through all nested Stripe calls. Do NOT re-resolve inside each sub-function — that would cause extra DB queries.

---

## 8. Idempotency Strategy

### Layer 1: DB unique constraint (primary)

`RetentionOfferAcceptance.surveyId @unique` — enforced by Postgres. Two concurrent requests with the same `surveyId` will result in one succeeding and one getting a unique constraint violation. The service should catch this violation and return the existing row.

```typescript
// In acceptOffer(), after idempotency check:
try {
  const acceptance = await prisma.retentionOfferAcceptance.create({ ... })
  return { accepted: true, ... }
} catch (err: unknown) {
  // Handle Prisma unique constraint violation (P2002)
  if (isPrismaUniqueConstraintError(err)) {
    const existing = await prisma.retentionOfferAcceptance.findUnique({
      where: { surveyId },
    })
    if (existing) return { accepted: false, acceptanceId: existing.id, ... }
  }
  throw err
}
```

Alternatively, use `upsert` with `where: { surveyId }` — but `upsert` would re-apply the Stripe call on the `update` branch. The `findUnique` at the top of `acceptOffer()` is the cleanest guard: check first, skip Stripe if already exists.

### Layer 2: Stripe idempotency keys

For discount offers, the Stripe `subscriptions.update` call is safe to retry (idempotent by nature — applying the same coupon twice is a no-op if the coupon is already applied). No explicit Stripe idempotency key is needed for Phase 11.

### Layer 3: Survey-level guard

The `CancellationSurvey.@@unique([userId, entitlementId])` constraint (Phase 10) means one `surveyId` maps to exactly one user+entitlement. So `surveyId` as the idempotency key transitively prevents duplicate offers for the same cancellation event.

---

## 9. applyPauseOffer() — Reusing Phase 10

```typescript
async function applyPauseOffer(
  userId: string,
  entitlementId: string,
  pauseMonths: 1 | 2 | 3,
  surveyId: string,
  offerId: string
): Promise<Date> {
  // Reuse Phase 10's pauseSubscription() — it handles IDOR guard + Stripe call
  // Phase 10's pauseSubscription ALSO upserts CancellationSurvey.offeredPause/pauseAccepted
  const { resumesAt } = await pauseSubscription({ userId, entitlementId, months: pauseMonths })

  // Return resumesAt for use as expiresAt in the RetentionOfferAcceptance
  return resumesAt
}
```

**Important:** `pauseSubscription()` already handles:
- IDOR guard (findFirst with userId + ACTIVE)
- Stripe `pause_collection` void behavior with correct Unix seconds
- Upsert of `CancellationSurvey.offeredPause = true, pauseAccepted = true`

Phase 11 does NOT need to replicate this. The `RetentionOfferAcceptance` row is created by `acceptOffer()` after `applyPauseOffer()` returns.

**Note on cancel_at_period_end for PAUSE:** When a user accepts a pause offer, `cancel_at_period_end` may or may not be set (they might be pausing before submitting the cancel survey). The `acceptOffer()` logic skips the cancel reversal for PAUSE type offers — this is correct because: (a) if cancel was already set, the pause overrides the cancel behavior from Stripe's perspective (paused subscription doesn't fire cancel webhook), and (b) the survey may not have triggered a cancel yet. If Phase 12 UI calls cancel first and then pause, the cancel reversal should be handled separately in the UI flow. Revisit in Phase 12 planning.

---

## 10. Cancel Flag Reversal Logic (OFF-ENGINE-05)

The sequence inside `acceptOffer()` for DISCOUNT, SUPPORT, CONTENT_HELP, NONE offer types:

```
1. Check if offer idempotent (surveyId already accepted) → return early if yes
2. IDOR guard on entitlement
3. Apply offer type (applyDiscountOffer / no Stripe call for SUPPORT/CONTENT_HELP/NONE)
4. Retrieve subscription from Stripe to check cancel_at_period_end
5. If cancel_at_period_end === true → call subscriptions.update({ cancel_at_period_end: false })
6. Record RetentionOfferAcceptance
7. Return result with cancelReversed flag
```

**Why retrieve before reverse:** We check Stripe rather than our own DB to get the authoritative current state. The `CancellationSurvey.cancelledAt` being set is not sufficient — the Stripe subscription state is the source of truth.

**Why not reverse for PAUSE:** Stripe's `pause_collection` puts the subscription in a different billing state. Setting `cancel_at_period_end: false` on a paused subscription could cause unexpected behavior. The cancel intent is implicitly withdrawn by the user choosing to pause instead.

---

## 11. Webhook Extension Recommendations

### Do we need `customer.discount.deleted` webhook?

**Recommendation: NO for Phase 11.** The `customer.discount.deleted` event fires when Stripe removes a discount (e.g., after a `once` coupon is used, or when a `repeating` coupon expires). Listening to this for Phase 11 would require:
- Adding a handler to `app/api/webhooks/stripe/route.ts`
- Finding the matching `RetentionOfferAcceptance` by some correlation (non-trivial — Stripe doesn't send our internal IDs in this event)
- Updating the acceptance row

**Deferral justification:** Our `RetentionOfferAcceptance.expiresAt` is computed locally and is sufficient for Phase 13 analytics. We don't need real-time sync from Stripe for the offer's end state in Phase 11. Phase 13 admin can manually expire offers if needed. Add webhook handling in a later phase if business need arises.

### What DOES need webhook extension?

The existing webhook handler at `app/api/webhooks/stripe/route.ts` already handles `customer.subscription.deleted` → `CANCELLED` status. When a user accepts a retention offer and `cancel_at_period_end` is reversed, no new webhook event fires — the subscription just continues. No webhook changes are needed for Phase 11.

**If Phase 13 admin wants to track offer redemptions from Stripe's side:** The `customer.discount.created` event could be useful, but it's a Phase 13 concern.

---

## 12. Edge Cases and Risks

### Edge case 1: Discount already applied (not via retention flow)

**Scenario:** A user already has a promotional discount on their subscription (applied via the checkout flow's `discountCode` feature). They then attempt a retention discount.

**Behavior:** `stripe.subscriptions.update({ discounts: [{ coupon: retentionCouponId }] })` REPLACES the existing subscription-level discount. The previous discount is lost.

**Recommendation for Phase 11:** Accept this behavior. Document it. The retention discount is a higher-priority business action than a checkout promotional code. If discount stacking is needed in future, the Stripe `discounts` array supports multiple entries.

**Verification step to add to test:** Confirm no existing discount check is needed for MVP.

### Edge case 2: User has BOTH pause + discount active

**Scenario:** User pauses, then tries to get a discount (or vice versa).

**Prevention:** The `isOfferEligible()` active-offer check queries `RetentionOfferAcceptance WHERE expiresAt > now`. A pause acceptance row has `expiresAt = resumesAt` (e.g. 2 months from now). If it's not expired, the user is blocked from getting a second offer.

**Risk:** If `expiresAt` for the pause acceptance is not set (shouldn't happen, but defensive code needed), the check fails open. Ensure `applyPauseOffer()` always returns a valid `resumesAt`.

### Edge case 3: `pauseMonths` is null on a PAUSE offer

**Scenario:** Admin created a PAUSE offer but forgot to set `pauseMonths`.

**Fix:** Default to 1 in `applyPauseOffer()`:
```typescript
const months = (offer.pauseMonths ?? 1) as 1 | 2 | 3
```
Also validate `pauseMonths` in `[1, 2, 3]` range before accepting. Throw if invalid.

### Edge case 4: `stripeCouponId` null on a DISCOUNT offer

**Fix:** Throw early in `acceptOffer()` before any Stripe call:
```typescript
if (offer.offerType === 'DISCOUNT' && !offer.stripeCouponId) {
  throw new Error('Tilbud mangler Stripe coupon ID — kontakt admin')
}
```

### Edge case 5: Stripe coupon doesn't exist (deleted in Stripe dashboard)

**Scenario:** Admin deleted the coupon in Stripe after linking it in our DB.

**Behavior:** `stripe.subscriptions.update()` throws `StripeInvalidRequestError: No such coupon`.

**Fix:** Let the error propagate — the caller (server action) catches and shows an error to the user. Log it. Do NOT silently ignore.

### Edge case 6: concurrent double-click on "Accept offer" button

**Prevention:** The `surveyId @unique` constraint and the idempotency check at the top of `acceptOffer()` handle this. One request wins, the other returns the existing acceptance. Both return HTTP 200 to the user — the UI sees the same state.

### Edge case 7: Stripe subscription not found (deleted between pages)

**Scenario:** User's subscription is deleted in Stripe between resolving the offer and accepting it.

**Fix:** Stripe throws `StripeInvalidRequestError`. The IDOR guard's `prisma.entitlement.findFirst({ status: 'ACTIVE' })` might still return a row if the Stripe webhook hasn't processed yet. Let Stripe's error propagate — don't hide it.

### Edge case 8: `resolveEligibleOffer` called with unknown reason slugs

**Behavior:** `prisma.cancellationReason.findMany({ where: { slug: { in: unknownSlugs } } })` returns empty array → `reasonIds = []` → function returns `null`.

**Correct behavior:** Return null (no offer). The UI shows the NONE/skip variant. This is safe.

---

## 13. Architecture Patterns

### File structure (new files only)

```
lib/services/
└── retention.service.ts          # resolveEligibleOffer, acceptOffer (+ internal helpers)

lib/services/__tests__/
└── retention.service.test.ts     # Vitest tests

prisma/
└── schema.prisma                 # + RetentionOfferType enum, 3 new models
```

No new API routes or server actions for Phase 11 — the service layer is consumed by Phase 12 UI server actions.

### Service layer convention (same as Phase 10)

- `lib/services/retention.service.ts` exports plain async functions
- Server actions in `app/` import from this file
- No business logic in route handlers
- IDOR guard on every mutating function

### Pattern: resolveStripeAccountId as inline helper

Do NOT import from `stripe-connect.service.ts`. That service is for Connect account management (OAuth, disconnect). The resolution pattern is a simple Prisma query that is better inlined in `retention.service.ts` to keep the service self-contained and testable without mocking another service module.

---

## 14. Validation Architecture

**Framework:** Vitest 4.1.2 (installed, configured — confirmed running)
**Config file:** `vitest.config.ts` (root)
**Quick run command:** `npx vitest run lib/services/__tests__/retention.service.test.ts`
**Full suite command:** `npx vitest run`

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run lib/services/__tests__/retention.service.test.ts` |
| Full suite command | `npx vitest run` |

### vi.mock pattern (copy from cancellation.service.test.ts)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStripe = {
  subscriptions: {
    retrieve: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    retentionOffer: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), findMany: vi.fn() },
    retentionOfferAcceptance: { findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn() },
    retentionOfferTrigger: { findMany: vi.fn() },
    cancellationReason: { findMany: vi.fn() },
    entitlement: { findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
    organization: { findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/stripe', () => ({
  getStripe: () => mockStripe,
}))

// Also mock cancellation.service to avoid Stripe calls from pauseSubscription
vi.mock('@/lib/services/cancellation.service', () => ({
  pauseSubscription: vi.fn(),
}))
```

**Key pattern:** Mock `pauseSubscription` from `@/lib/services/cancellation.service` so tests for `applyPauseOffer` do not trigger the real Stripe pause call. Return a controlled `{ resumesAt: new Date() }`.

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OFF-ENGINE-02 | resolveEligibleOffer returns null when no reasons match | Unit | `npx vitest run lib/services/__tests__/retention.service.test.ts` | No — Wave 0 |
| OFF-ENGINE-02 | resolveEligibleOffer returns highest-priority eligible offer | Unit | same | No — Wave 0 |
| OFF-ENGINE-02 | resolveEligibleOffer skips offer when maxUsesPerUser exceeded | Unit | same | No — Wave 0 |
| OFF-ENGINE-02 | resolveEligibleOffer skips offer when cooldown not expired | Unit | same | No — Wave 0 |
| OFF-ENGINE-02 | resolveEligibleOffer skips offer when active offer exists | Unit | same | No — Wave 0 |
| OFF-ENGINE-03 | acceptOffer calls stripe.subscriptions.update with discounts array | Unit | same | No — Wave 0 |
| OFF-ENGINE-03 | acceptOffer passes stripeAccount option when org has Connect | Unit | same | No — Wave 0 |
| OFF-ENGINE-04 | acceptOffer calls pauseSubscription with correct months for PAUSE type | Unit | same | No — Wave 0 |
| OFF-ENGINE-05 | acceptOffer calls subscriptions.update cancel_at_period_end:false when it was true | Unit | same | No — Wave 0 |
| OFF-ENGINE-05 | acceptOffer does NOT reverse cancel if it was not set | Unit | same | No — Wave 0 |
| OFF-ENGINE-06 | acceptOffer returns existing acceptance without Stripe call on second call | Unit | same | No — Wave 0 |
| OFF-ENGINE-07 | All above covered by Vitest with vi.mock | Unit | same | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run lib/services/__tests__/retention.service.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lib/services/__tests__/retention.service.test.ts` — covers all OFF-ENGINE-* requirements
- [ ] No framework install needed — Vitest 4.1.2 already installed and configured

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Cooldown check | Custom date arithmetic | `new Date(lastAcceptance.acceptedAt); date.setDate(date.getDate() + cooldownDays)` |
| Stripe coupon validation | Custom validator | Let Stripe throw `StripeInvalidRequestError` — propagate to caller |
| Connect account resolution | Separate lookup helper import | Inline Prisma query — simpler, testable, no extra mock needed |
| Pause logic | Duplicate `pause_collection` code | Import and reuse `pauseSubscription()` from `cancellation.service.ts` |
| Discount stacking logic | Complex merge logic | Replace existing discount — `discounts: [{ coupon }]` replaces cleanly |

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies beyond Stripe npm and Prisma, both already verified in Phase 10).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Stripe npm (^20.3.1) | applyDiscountOffer, reverseCancelAtPeriodEnd | Yes | 20.3.1 | — |
| Prisma CLI | prisma db push for new models | Yes | 6.19.2 | — |
| Vitest | Testing | Yes | 4.1.2 | — |

---

## Sources

### Primary (HIGH confidence)
- `lib/services/cancellation.service.ts` — read directly; `pauseSubscription()` signature and implementation confirmed
- `lib/services/checkout.service.ts` — read directly; Stripe Connect pattern confirmed (lines 32-43, 77)
- `lib/services/stripe-connect.service.ts` — read directly; account status check pattern confirmed
- `prisma/schema.prisma` — read directly; all existing models, enums, `Organization.stripeAccountId` confirmed
- `lib/stripe.ts` — read directly; Stripe API version `2026-01-28.clover`, stripe v20.3.1
- `lib/services/__tests__/cancellation.service.test.ts` — read directly; vi.mock pattern confirmed
- Stripe Docs https://docs.stripe.com/api/subscriptions/update — `discounts` array shape, `cancel_at_period_end` reversal
- Stripe Docs https://docs.stripe.com/api/discounts/object — `end` field confirmed nullable/repeating-only
- Stripe Docs https://docs.stripe.com/api/coupons/object — `duration`, `duration_in_months` fields confirmed

### Secondary (MEDIUM confidence)
- Phase 10 SUMMARY files — confirmed Phase 10 exact deliverables (models live in DB, service functions working)
- Phase 10 RESEARCH.md — confirmed Stripe API version, SDK cast pattern, idempotency approaches

---

## Metadata

**Confidence breakdown:**
- Proposed Prisma schema: HIGH — derived directly from existing schema patterns (Organization, CancellationReason, ContentUnitTag)
- Service function signatures: HIGH — derived from reading actual service code
- Stripe Connect pattern: HIGH — read directly from checkout.service.ts source
- Stripe discount API shape: HIGH — verified against official Stripe docs
- Cancel flag reversal: HIGH — verified against official Stripe docs
- Eligibility algorithm: HIGH — simple DB queries, no unknowns
- Idempotency strategy: HIGH — unique constraint is the same approach as Phase 10
- Webhook extension: MEDIUM — "not needed for Phase 11" is a judgment call, not a hard constraint

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (Stripe API version pinned; schema patterns stable)
