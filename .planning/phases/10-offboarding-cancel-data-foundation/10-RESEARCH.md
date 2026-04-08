# Phase 10: Cancel-data Foundation + Zapier Bridge - Research

**Researched:** 2026-04-06
**Domain:** Prisma schema extension, Stripe subscription management (pause_collection), outbound webhook design
**Confidence:** HIGH

---

## Summary

Phase 10 introduces the data plumbing for the entire offboarding intelligence feature. There is no existing in-app cancellation flow: today users are sent to the Stripe Billing Portal (`/api/billing/portal`), which means zero structured cancellation data is captured. The phase must (1) create a `CancellationSurvey` model + seed reason tags, (2) write a `cancelSubscription()` service that gates Stripe cancel behind survey completion, (3) write a `pauseSubscription()` service using Stripe's `pause_collection` API, and (4) create an outbound webhook route that POSTs survey data to a Zapier URL so the existing New Zenler re-engagement automation keeps firing.

The subscription data structure is clear from the audit: subscriptions live in Stripe and are mirrored locally via `Entitlement.stripeSubscriptionId`. There is no separate `Subscription` model - the entitlement IS the subscription record. Cancel is currently handled passively via Stripe webhooks (no active server-side cancel API call is made by the app itself). This phase must introduce the first active Stripe cancel call from within the app.

**Primary recommendation:** Implement `CancellationReason` as a Prisma lookup table (not enum) so admin can extend tags without a migration. Store `tags String[]` as a Postgres text array on `CancellationSurvey`. Fire the outbound Zapier webhook immediately after survey is saved, before calling Stripe cancel, so Zapier receives data even if Stripe cancel fails.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OFF-DATA-01 | Prisma model `CancellationSurvey` with all specified fields | Schema section + existing Entitlement pattern |
| OFF-DATA-02 | Seed predefined `CancellationReason` tags | Seed file pattern from prisma/seed.ts; lookup table recommendation |
| OFF-DATA-03 | `cancelSubscription()` validates survey before Stripe cancel | Entitlement + stripe.subscriptions.cancel API; state machine section |
| OFF-DATA-04 | `pauseSubscription()` using `pause_collection` for 1/2/3 months | Stripe docs verified; gotchas documented |
| OFF-DATA-05 | Outbound webhook POSTs to configurable Zapier URL | Webhook design section; security model |
</phase_requirements>

---

## 1. Existing Subscription / Cancel Code Audit

### How subscriptions are stored

There is no `Subscription` model. The `Entitlement` model (line 385-415, `prisma/schema.prisma`) doubles as the subscription record:

- `Entitlement.stripeSubscriptionId` — nullable string, populated for recurring purchases
- `Entitlement.status` — `ACTIVE | EXPIRED | CANCELLED`
- `Entitlement.cancelledAt` — nullable DateTime, set when status is CANCELLED
- `Entitlement.source` — `SUBSCRIPTION` for recurring, `PURCHASE` for one-time

There is no `Entitlement.stripeCustomerId`. To cancel or pause a Stripe subscription you must retrieve the subscription from Stripe first (`stripe.subscriptions.retrieve(stripeSubscriptionId)`) to get the customer ID. See the billing portal route for this exact pattern.

### How cancel is currently wired

**Today:** `POST /api/billing/portal` redirects the user to the Stripe Billing Portal. Stripe then fires `customer.subscription.deleted` or `customer.subscription.updated` webhooks, which the existing webhook handler (`app/api/webhooks/stripe/route.ts` lines 98-115) translates into `updateEntitlementStatus(subscription.id, 'CANCELLED')`.

**What this means for Phase 10:** The app never calls `stripe.subscriptions.cancel()` directly today. Phase 10 introduces the first active cancel call. The existing webhook handler will still receive the `customer.subscription.deleted` event and mark the entitlement CANCELLED — that's the correct final state and requires no changes to the webhook handler. The new `cancelSubscription()` service just needs to call `stripe.subscriptions.cancel(stripeSubscriptionId)` (or `update` with `cancel_at_period_end: true`) and let the webhook handle the DB update.

### Key files

| File | Role |
|------|------|
| `app/api/billing/portal/route.ts` | Current cancel entry point — will be supplemented, not replaced |
| `app/api/webhooks/stripe/route.ts` | Handles `customer.subscription.deleted` — no changes needed |
| `lib/services/entitlement.service.ts` | `updateEntitlementStatus()` called by webhook — no changes needed |
| `lib/stripe.ts` | Lazy singleton `getStripe()` — use as-is |
| `lib/services/checkout.service.ts` | Pattern reference: how to resolve the Stripe account for tenant-aware calls |

### Subscription lookup pattern

To find a user's active subscription:

```typescript
// lib/services/entitlement.service.ts — existing pattern
const entitlement = await prisma.entitlement.findFirst({
  where: {
    userId: user.id,
    status: 'ACTIVE',
    stripeSubscriptionId: { not: null },
  },
})
// entitlement.stripeSubscriptionId is the Stripe subscription ID
```

---

## 2. Proposed Prisma Schema

### CancellationReason (lookup table)

```prisma
model CancellationReason {
  id    String @id @default(uuid()) @db.Uuid
  slug  String @unique   // e.g. "pris", "tid"
  label String           // e.g. "For dyrt", "Mangler tid"

  surveys CancellationSurveyTag[]
}
```

**Why lookup table, not enum:** Prisma enums require a migration to add values. A lookup table lets an admin (or developer) add new reason slugs via `prisma db seed` or direct DB insert without touching the schema. The Phase 12 churn analytics dashboard will GROUP BY tag slug, which works identically with a lookup table. This mirrors the existing `ContentTag` / `ContentUnitTag` pattern already in the schema.

### CancellationSurveyTag (join table)

```prisma
model CancellationSurveyTag {
  surveyId String @db.Uuid
  reasonId String @db.Uuid

  survey CancellationSurvey   @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  reason CancellationReason   @relation(fields: [reasonId], references: [id])

  @@id([surveyId, reasonId])
}
```

### CancellationSurvey (main model)

```prisma
model CancellationSurvey {
  id               String    @id @default(uuid()) @db.Uuid
  userId           String    @db.Uuid
  entitlementId    String    @db.Uuid    // FK to Entitlement (not raw subscriptionId)
  submittedAt      DateTime  @default(now())
  cancelledAt      DateTime?             // set after Stripe cancel succeeds
  primaryReasonId  String?   @db.Uuid   // FK to CancellationReason
  feedback         String?               // free-text
  wouldReturn      Boolean?
  offeredPause     Boolean   @default(false)
  pauseAccepted    Boolean   @default(false)
  webhookSentAt    DateTime?             // timestamp for Zapier outbound delivery

  user          User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  entitlement   Entitlement        @relation(fields: [entitlementId], references: [id])
  primaryReason CancellationReason? @relation("PrimaryReason", fields: [primaryReasonId], references: [id])
  tags          CancellationSurveyTag[]

  @@unique([userId, entitlementId])   // one survey per subscription per user
  @@index([userId, submittedAt])
  @@index([cancelledAt])
}
```

**Design notes:**

- `entitlementId` (FK to `Entitlement`) is used instead of raw `subscriptionId` string, so the survey is always linked to a first-class local record. The Stripe subscription ID is accessible via `entitlement.stripeSubscriptionId`.
- `@@unique([userId, entitlementId])` prevents duplicate surveys for the same subscription — this is the idempotency guard for double-submissions.
- `webhookSentAt` tracks Zapier delivery for debugging/retry visibility.
- `cancelledAt` on the survey is set AFTER Stripe cancel succeeds, distinct from `submittedAt`. The Phase 12 churn dashboard should query `cancelledAt`, matching the existing `analytics.service.ts` pattern which already queries `Entitlement.cancelledAt`.

**Relation addition to User model:**

```prisma
cancellationSurveys CancellationSurvey[]
```

**Relation addition to Entitlement model:**

```prisma
cancellationSurvey CancellationSurvey?
```

---

## 3. Tag Storage Recommendation

**Decision: Lookup table (`CancellationReason` model) with a join table.**

| Option | Pros | Cons |
|--------|------|------|
| Prisma enum | Type-safe, no join needed | Requires migration to add tags; can't add from admin UI |
| `String[]` Postgres array | Simple, no join table | Can't enforce valid slugs; harder to aggregate in Phase 12 |
| Lookup table + join table | Extensible, FK integrity, clean GROUP BY for analytics | Slightly more complex queries |

The lookup table wins for Phase 12 compatibility: `SELECT reason_slug, COUNT(*) FROM CancellationSurveyTag JOIN CancellationReason ...` is a natural GROUP BY. The `ContentTag` / `ContentUnitTag` pattern already used in the schema validates this approach.

### Seed data (prisma/seed.ts addition)

```typescript
const CANCELLATION_REASONS = [
  { slug: 'pris',                  label: 'For dyrt' },
  { slug: 'tid',                   label: 'Mangler tid' },
  { slug: 'fandt-alternativ',      label: 'Fandt et alternativ' },
  { slug: 'indhold-matcher-ikke',  label: 'Indholdet passer ikke til mig' },
  { slug: 'personlig-situation',   label: 'Personlig situation' },
  { slug: 'forbedret',             label: 'Tingene er gået bedre' },
  { slug: 'teknisk',               label: 'Tekniske problemer' },
]

for (const reason of CANCELLATION_REASONS) {
  await prisma.cancellationReason.upsert({
    where: { slug: reason.slug },
    update: { label: reason.label },
    create: reason,
  })
}
```

Using `upsert` on `slug` (unique) matches the existing seed pattern and is safe to re-run.

---

## 4. Stripe pause_collection API

**Verified against Stripe docs (2026-04-06). Stripe API version in use: `2026-01-28.clover`.**

### How to pause

```typescript
await stripe.subscriptions.update(stripeSubscriptionId, {
  pause_collection: {
    behavior: 'void',
    resumes_at: Math.floor(resumeDate.getTime() / 1000),  // Unix timestamp
  },
})
```

**behavior options:**
- `void` — Invoices are immediately voided. No emails, no webhooks from Stripe during pause. **Use this for a free grace period** — customer is not charged and receives no billing communications.
- `keep_as_draft` — Invoices stay as drafts. No emails/webhooks. Drafts must be manually advanced later (complicated).
- `mark_uncollectible` — Marks invoices uncollectible. Revenue reporting impact.

**For FamilyMind pause (free months, then resume billing):** Use `behavior: 'void'`.

### How to resume

```typescript
// Remove pause by setting to null
await stripe.subscriptions.update(stripeSubscriptionId, {
  pause_collection: '',  // or pass null — Stripe accepts empty string to unset
})
```

Stripe automatically resumes when `resumes_at` timestamp is reached IF `resumes_at` is set. Setting `resumes_at` is strongly recommended over relying on manual resumption.

### Computing resumes_at for 1/2/3 months

```typescript
function computeResumeDate(months: 1 | 2 | 3): Date {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date
}
```

### Critical gotchas

1. **Subscription status stays `active` during pause.** `customer.subscription.updated` IS fired when pause is applied (status field unchanged, but `pause_collection` field changes). The existing webhook handler ignores this event when status is already `active` — no conflict, but also no DB record of the pause unless we update a field.

2. **No invoice events during pause (with `void` behavior).** Do NOT expect `invoice.payment_succeeded` or `invoice.payment_failed` while paused. The webhook handler's `invoice.payment_failed` handler will simply not fire.

3. **Pre-pause invoices continue retrying.** If there is an outstanding past-due invoice when the pause is applied, it continues retrying. Verify the entitlement has no outstanding invoices before offering pause.

4. **The `Entitlement` model has no `pausedUntil` field.** Phase 10 does NOT need to store pause state in the DB — the pause lives entirely in Stripe. The plan should NOT add a `pausedUntil` to Entitlement yet; that's a concern for Phase 11 UI which needs to show the pause state to the user. The `pauseSubscription()` service can return the `resumes_at` for display, retrieved directly from Stripe.

5. **Stripe does not fire a "paused" event.** It fires `customer.subscription.updated` when `pause_collection` changes, but there is no dedicated `customer.subscription.paused` event type. The existing webhook handler correctly ignores `updated` events when `status === 'active'`, so no change is needed there.

6. **`resumes_at` must be a Unix timestamp (integer seconds), not milliseconds.**

---

## 5. Cancel Flow State Machine

The survey-to-cancel sequence is critical to get right. The ordering determines what data Zapier receives and what happens when steps fail.

### Correct order

```
Step 1: Validate user owns an ACTIVE subscription
Step 2: Validate survey has been submitted (CancellationSurvey record exists with entitlementId)
Step 3: POST survey data to Zapier (outbound webhook)  ← do this BEFORE Stripe cancel
Step 4: Call stripe.subscriptions.cancel(id, { invoice_now: false, prorate: false })
          OR stripe.subscriptions.update(id, { cancel_at_period_end: true })
Step 5: Set CancellationSurvey.cancelledAt = now()
Step 6: Return success to caller
```

**Why Zapier fires before Stripe cancel (Step 3 before Step 4):**
- Zapier receives data even if Stripe cancel fails (transient Stripe error).
- New Zenler automation needs to know the user is churning as early as possible.
- Zapier is fire-and-forget (best-effort). If Zapier fails, we still proceed to cancel.

**Why `cancel_at_period_end: true` vs immediate cancel:**
- Immediate cancel (`stripe.subscriptions.cancel()`) terminates access now. The webhook fires `customer.subscription.deleted` immediately.
- `cancel_at_period_end: true` (`stripe.subscriptions.update()`) keeps access until billing period ends. Stripe fires `customer.subscription.updated` with `cancel_at_period_end=true` immediately, then `customer.subscription.deleted` at period end.
- **For FamilyMind:** Use `cancel_at_period_end: true` so the user keeps access until the end of what they paid for. The existing webhook handler handles both events correctly.

### cancelSubscription() signature

```typescript
// lib/services/cancellation.service.ts (new file)
export async function cancelSubscription(input: {
  userId: string
  entitlementId: string
}): Promise<{ cancelAtPeriodEnd: boolean; currentPeriodEnd: Date }> {
  // 1. Validate entitlement belongs to user and is ACTIVE
  // 2. Validate CancellationSurvey exists for this entitlementId
  // 3. Fire outbound webhook (non-blocking, swallow errors)
  // 4. stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true })
  // 5. Update CancellationSurvey.cancelledAt = now()
  // 6. Return { cancelAtPeriodEnd: true, currentPeriodEnd }
}
```

### pauseSubscription() signature

```typescript
export async function pauseSubscription(input: {
  userId: string
  entitlementId: string
  months: 1 | 2 | 3
}): Promise<{ resumesAt: Date }> {
  // 1. Validate entitlement belongs to user and is ACTIVE
  // 2. Compute resumesAt = now + months
  // 3. stripe.subscriptions.update(stripeSubscriptionId, {
  //      pause_collection: { behavior: 'void', resumes_at: unix(resumesAt) }
  //    })
  // 4. Update CancellationSurvey.offeredPause = true, pauseAccepted = true
  // 5. Return { resumesAt }
}
```

---

## 6. Outbound Webhook Design

### Endpoint

`POST /api/webhooks/cancellation-outbound`

This route is called server-side by `cancelSubscription()` — it is not a publicly reachable webhook (no external caller), it's a server-side HTTP call from the service layer to itself, or alternatively an inline function call. **Recommendation: make it an inline exported function, not an HTTP route**, to avoid unnecessary network hop and auth complexity.

**Rationale for inline function over HTTP route:**
- `cancelSubscription()` is already server-side.
- A separate HTTP route `/api/webhooks/cancellation-outbound` would require auth to prevent external callers, adding complexity.
- The "outbound" terminology in OFF-DATA-05 refers to the Zapier destination, not this endpoint being externally reachable.
- Make it an exported `sendCancellationWebhook(survey: CancellationSurveyPayload): Promise<void>` function in `cancellation.service.ts`.

However, the requirement explicitly names an endpoint `/api/webhooks/cancellation-outbound`. If the planner preserves this as an HTTP endpoint, it must be protected. See security section.

### Zapier payload schema

```typescript
interface CancellationWebhookPayload {
  event: 'subscription.cancelled'
  timestamp: string                    // ISO 8601
  user: {
    id: string
    email: string
    name: string | null
  }
  subscription: {
    entitlementId: string
    stripeSubscriptionId: string
    cancelAtPeriodEnd: boolean
    currentPeriodEnd: string           // ISO 8601
  }
  survey: {
    primaryReason: string | null       // slug e.g. "pris"
    tags: string[]                     // all tag slugs
    feedback: string | null
    wouldReturn: boolean | null
    offeredPause: boolean
    pauseAccepted: boolean
  }
}
```

This includes all fields New Zenler automation will need to segment re-engagement emails: email (to identify the contact), primaryReason, and tags (to route to the right email sequence).

### Security model for outbound call

The app sends TO Zapier (outbound POST). There is no inbound caller to authenticate for this direction.

For the internal `/api/webhooks/cancellation-outbound` endpoint (if kept as HTTP):
- Accept calls only from server-side (add a shared secret header `X-Internal-Token`).
- This is low-stakes: the endpoint just reads the DB and POSTs to Zapier — it cannot write sensitive data.
- Alternative: verify callers via the existing `getCurrentUser()` + ADMIN role check.

For the outbound call to Zapier:
- The Zapier catch hook URL is a secret URL (security by obscurity). No HMAC is needed unless Zapier supports it.
- Store the URL in `CANCELLATION_WEBHOOK_URL` env var as specified in OFF-DATA-05.
- Log success/failure; do NOT throw on failure (fire-and-forget).

```typescript
async function sendCancellationWebhook(payload: CancellationWebhookPayload): Promise<void> {
  const webhookUrl = process.env.CANCELLATION_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[cancellation-webhook] CANCELLATION_WEBHOOK_URL not set — skipping')
    return
  }
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error(`[cancellation-webhook] Zapier responded ${res.status}`)
    }
  } catch (err) {
    console.error('[cancellation-webhook] Failed to reach Zapier:', err)
    // Do not rethrow — cancellation proceeds regardless
  }
}
```

---

## 7. Idempotency Strategy

### Double-submission prevention

The `@@unique([userId, entitlementId])` constraint on `CancellationSurvey` prevents a second survey for the same subscription. If the UI calls survey submission twice, the second call gets a Prisma unique constraint violation and can return a graceful "survey already submitted" response.

### Double-cancel prevention

Before calling `stripe.subscriptions.update({ cancel_at_period_end: true })`, check:

```typescript
const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
if (sub.cancel_at_period_end) {
  // Already scheduled for cancel — skip Stripe call, still set cancelledAt on survey
  return { cancelAtPeriodEnd: true, currentPeriodEnd: new Date(sub.current_period_end * 1000) }
}
```

This guard prevents a "subscription already canceled" Stripe error if the user double-clicks or retries.

### Webhook idempotency (Zapier delivery)

`CancellationSurvey.webhookSentAt` records successful Zapier delivery. If re-invoking `cancelSubscription()` for an already-cancelled survey, check `webhookSentAt !== null` before re-sending to Zapier. This prevents Zapier from triggering duplicate New Zenler automation.

### Survey pre-validation in cancelSubscription()

```typescript
const survey = await prisma.cancellationSurvey.findUnique({
  where: { userId_entitlementId: { userId, entitlementId } },
})
if (!survey) {
  throw new Error('Survey er ikke udfyldt. Udfyld venligst begrundelse først.')
}
if (survey.cancelledAt) {
  // Already cancelled — idempotent success
  return { cancelAtPeriodEnd: true, currentPeriodEnd: existingPeriodEnd }
}
```

---

## 8. Architecture Patterns

### File structure (new files only)

```
lib/services/
└── cancellation.service.ts          # cancelSubscription(), pauseSubscription(), sendCancellationWebhook()

prisma/
├── schema.prisma                    # + CancellationSurvey, CancellationReason, CancellationSurveyTag
├── migrations/
│   └── YYYYMMDD_add_cancellation_survey/
└── seed.ts                          # + CancellationReason seed block
```

The `/api/webhooks/cancellation-outbound` HTTP endpoint (if the planner keeps it) goes in:

```
app/api/webhooks/cancellation-outbound/route.ts
```

### Service layer convention

Follow the existing pattern: `lib/services/[domain].service.ts` exports plain async functions. Server actions in `app/` import from these. Do not put business logic in route handlers.

### Stripe API version

The project uses Stripe API version `2026-01-28.clover` (`lib/stripe.ts` line 11). The installed stripe npm package is v20.3.1. `pause_collection` is available in this API version — verified.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Webhook signature from Stripe | Custom HMAC verifier | `getStripe().webhooks.constructEvent()` — already used in stripe webhook handler |
| Subscription lookup | Direct Stripe API query | Query `Entitlement.stripeSubscriptionId` in Prisma first, then Stripe if needed |
| Pause duration arithmetic | Custom date math | `date.setMonth(date.getMonth() + months)` — simple built-in |
| Tag validation | Custom slug validator | Zod enum built from seeded slugs, or just Prisma FK constraint |

---

## Common Pitfalls

### Pitfall 1: Calling Stripe cancel on an already-cancelled subscription

**What goes wrong:** Stripe throws `StripeInvalidRequestError: No such subscription` or `subscription is already cancelled`.
**How to avoid:** Retrieve the subscription from Stripe first and check `status !== 'canceled'` and `cancel_at_period_end !== true`.

### Pitfall 2: pause_collection with resumes_at in milliseconds

**What goes wrong:** `resumes_at` is passed as JavaScript `Date.getTime()` (milliseconds). Stripe interprets it as a date in 1970.
**How to avoid:** Always divide by 1000: `Math.floor(resumeDate.getTime() / 1000)`.

### Pitfall 3: Expecting a "paused" webhook event

**What goes wrong:** Code waits for a `customer.subscription.paused` event that never fires.
**How to avoid:** Stripe fires `customer.subscription.updated` (status remains `active`). The existing webhook handler ignores this correctly. No changes needed.

### Pitfall 4: Survey submitted but entitlement not found

**What goes wrong:** `entitlementId` is passed from client — user could tamper with it (IDOR risk).
**How to avoid:** Always re-query `prisma.entitlement.findFirst({ where: { id: entitlementId, userId } })` in the service. Never trust the client's claimed entitlement ownership.

### Pitfall 5: Zapier failure blocks cancellation

**What goes wrong:** Network timeout to Zapier URL throws, cancellation fails, user sees error, but no actual cancel was attempted.
**How to avoid:** Wrap Zapier call in try/catch, log the error, continue. Cancellation must not depend on Zapier availability.

### Pitfall 6: Missing `subscriptionId` in CancellationSurvey payload to Phase 12

**What goes wrong:** Phase 12 churn analytics needs to join `CancellationSurvey` to `Entitlement` to get `paidAmountCents` for lost MRR. Without the FK to Entitlement, this join is impossible.
**How to avoid:** Use `entitlementId` FK (as recommended in schema above), not a raw string.

---

## Validation Architecture

**Framework:** Vitest 4.1.2 (installed, configured at `vitest.config.ts`)
**Config file:** `vitest.config.ts` (exists, uses `environment: 'node'`, `@` alias resolved)
**Quick run command:** `npx vitest run lib/services/__tests__/cancellation.service.test.ts`
**Full suite command:** `npx vitest run`

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run lib/services/__tests__/cancellation.service.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OFF-DATA-01 | CancellationSurvey record can be created with all fields | Unit (Prisma mock) | `npx vitest run lib/services/__tests__/cancellation.service.test.ts` | No — Wave 0 |
| OFF-DATA-02 | Seed creates 7 CancellationReason records | Manual / smoke | `npx tsx prisma/seed.ts` then DB inspect | No |
| OFF-DATA-03 | cancelSubscription() throws if no survey; succeeds if survey exists | Unit (Prisma + Stripe mock) | `npx vitest run lib/services/__tests__/cancellation.service.test.ts` | No — Wave 0 |
| OFF-DATA-03 | cancelSubscription() is idempotent (double-call returns success) | Unit | same file | No — Wave 0 |
| OFF-DATA-04 | pauseSubscription() calls Stripe with void behavior and correct resumes_at | Unit (Stripe mock) | same file | No — Wave 0 |
| OFF-DATA-05 | sendCancellationWebhook() POSTs correct payload shape to Zapier URL | Unit (fetch mock) | same file | No — Wave 0 |
| OFF-DATA-05 | sendCancellationWebhook() swallows Zapier errors gracefully | Unit (fetch mock) | same file | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run lib/services/__tests__/cancellation.service.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lib/services/__tests__/cancellation.service.test.ts` — covers OFF-DATA-03, OFF-DATA-04, OFF-DATA-05
- [ ] Vitest mock for `stripe` module (follow `vi.mock('@/lib/prisma', ...)` pattern in existing test)

*(Framework already installed and configured — no framework install needed.)*

---

## Environment Availability

Step 2.6: Environment availability for this phase.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Stripe npm package | All service functions | Yes | 20.3.1 | — |
| Prisma CLI | Migration + seed | Yes | 6.19.2 | — |
| CANCELLATION_WEBHOOK_URL env var | OFF-DATA-05 outbound webhook | Unknown — must be set | — | Skip Zapier call gracefully |
| Vitest | Testing | Yes | 4.1.2 | — |

**Missing dependencies with no fallback:** None that block code.

**Missing dependencies with fallback:** `CANCELLATION_WEBHOOK_URL` — if not set, `sendCancellationWebhook()` logs a warning and returns. The cancellation flow continues. This allows local development without a Zapier account.

---

## Sources

### Primary (HIGH confidence)
- Stripe Docs: https://docs.stripe.com/billing/subscriptions/pause-payment — pause_collection behavior, void mode, resume, gotchas
- Stripe Docs: https://docs.stripe.com/api/subscriptions/update — pause_collection parameter spec
- `prisma/schema.prisma` (read directly) — existing Entitlement, ContentTag/ContentUnitTag patterns
- `lib/services/entitlement.service.ts` (read directly) — updateEntitlementStatus, revokeEntitlement
- `app/api/webhooks/stripe/route.ts` (read directly) — current cancel event handling
- `app/api/billing/portal/route.ts` (read directly) — current cancel UX entry point
- `lib/stripe.ts` (read directly) — API version 2026-01-28.clover, stripe v20.3.1

### Secondary (MEDIUM confidence)
- `lib/services/__tests__/dashboard.service.test.ts` — confirms Vitest + vi.mock(@/lib/prisma) pattern works; templates test structure for new service tests

---

## Metadata

**Confidence breakdown:**
- Existing code audit: HIGH — read directly from source
- Proposed schema: HIGH — derived from existing patterns in the codebase
- Tag storage recommendation: HIGH — matches existing ContentTag pattern, fits Phase 12 needs
- Stripe pause_collection API: HIGH — verified against live Stripe docs
- Cancel flow state machine: HIGH — derived from direct code reading + Stripe docs
- Webhook security: HIGH — matches project's existing approach (no over-engineering)
- Idempotency strategy: HIGH — based on Prisma unique constraint + Stripe subscription state check

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (Stripe API version pinned in project; schema is stable)
