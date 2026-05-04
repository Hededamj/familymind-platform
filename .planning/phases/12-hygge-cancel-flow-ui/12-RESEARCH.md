# Phase 12: Hygge Cancel Flow (UI) — Research

**Researched:** 2026-04-06
**Domain:** Next.js multi-step form UI, React state management, server actions, Stripe subscription data
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OFF-UI-01 | Ny side `/dashboard/subscription/cancel` erstatter ekstern formular-link | Settings page audit complete — button location confirmed |
| OFF-UI-02 | Step 1: empatisk intro + illustration + skip-link direkte til bekræftelse | Mockup spec fully read, copy finalised |
| OFF-UI-03 | Step 2: reason-tag chips (multi-select) + valgfri fritekst | Chip pattern documented; seed slugs confirmed |
| OFF-UI-04 | Step 3: dynamisk offer baseret på `resolveEligibleOffer()` — 5 varianter | Service signature verified; component split designed |
| OFF-UI-05 | Step 4: bekræft opsigelsesdato, kald `cancelSubscription()` | Service signature verified; period-end date source confirmed |
| OFF-UI-06 | Step 5: personaliseret tak — 3 varianter (cancel / pause / retention) | Mockup copy finalised; all three variants documented |
| OFF-UI-07 | Hele flowet mobile-first, FamilyMind design system | Design system tokens verified from existing codebase |
</phase_requirements>

---

## Summary

Phase 12 builds a dedicated `/dashboard/subscription/cancel` page in Next.js that replaces the current Stripe Billing Portal redirect. The flow has 5 steps implemented as a single page-component using React `useState` for step navigation — no URL params, no multi-route setup.

The current cancel entry point is `ManageSubscriptionButton` in `app/dashboard/settings/_components/manage-subscription-button.tsx`. It calls `/api/billing/portal` and redirects the user to an external Stripe portal. This button lives inside the "Dit abonnement" card in `app/dashboard/settings/page.tsx`. For Phase 12 we add a separate "Opsig abonnement" link/button below `ManageSubscriptionButton` that navigates to `/dashboard/subscription/cancel` — the existing manage button stays in place for other billing tasks.

The service layer is fully ready: `cancelSubscription()`, `pauseSubscription()`, `resolveEligibleOffer()`, and `acceptOffer()` all exist and are tested. The UI just needs to call them via server actions. Price display for the DISCOUNT card comes from the offer's `durationMonths` and a hardcoded/config-driven base price — NOT from Stripe (Stripe does not expose a clean unit amount on the live subscription object without an extra product/price lookup, and the mockup hardcodes 149 kr/119 kr as illustrative values; the planner should wire this to `priceVariant.priceAmountCents` from the entitlement join).

**Primary recommendation:** One page file at `app/dashboard/subscription/cancel/page.tsx` (Server Component for data fetch) + `_components/cancel-flow.tsx` (Client Component for all step state) + individual step/offer sub-components. Pure `useState` step navigation. Server actions in `app/dashboard/subscription/cancel/actions.ts`.

---

## 1. Current "Mit abonnement" Page Audit

### Entry point today

| File | What it does | What changes |
|------|-------------|-------------|
| `app/dashboard/settings/page.tsx` | Renders "Dit abonnement" card with `ManageSubscriptionButton` | Add a "Opsig abonnement" `<Link>` below the manage button |
| `app/dashboard/settings/_components/manage-subscription-button.tsx` | Clicks → POST `/api/billing/portal` → redirects to Stripe Customer Portal | Unchanged — stays for billing history, payment method updates |

### Change required (OFF-UI-01)

Inside `app/dashboard/settings/page.tsx`, in the `activeCount > 0` branch, add below `<ManageSubscriptionButton />`:

```tsx
<Link
  href="/dashboard/subscription/cancel"
  className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
>
  Opsig abonnement
</Link>
```

This is the only change to existing files. Everything else is new.

---

## 2. File Structure

```
app/dashboard/subscription/
└── cancel/
    ├── page.tsx                    # Server Component — data prefetch, renders CancelFlow
    ├── actions.ts                  # Server actions: submitSurveyAndResolveOffer, acceptOfferAction, confirmCancelAction
    └── _components/
        ├── cancel-flow.tsx         # Client Component — useState step machine, renders correct step
        ├── step-intro.tsx          # Step 1: illustration + CTA + skip link
        ├── step-reason.tsx         # Step 2: chip picker + textarea
        ├── step-offer-discount.tsx # Step 3A: discount card variant
        ├── step-offer-pause.tsx    # Step 3B: duration picker variant
        ├── step-offer-support.tsx  # Step 3C: support contact variant
        ├── step-offer-content.tsx  # Step 3D: content suggestions variant
        ├── step-offer-skip.tsx     # Step 3E: respect-skip variant
        ├── step-confirm.tsx        # Step 4: confirmation with period-end date
        └── step-done.tsx           # Step 5: 3-variant thank-you (cancel/pause/retention)
```

**Rationale:** Step 3 is split into 5 separate files rather than one big switch-component. Each file is ~50-80 lines, independently readable, and maps 1:1 to a mockup screen. `cancel-flow.tsx` imports all five and renders the active one based on `offerType` in state.

---

## 3. State Management Decision

**Decision: Pure React `useState` — no URL params.**

| Factor | URL params (?step=2) | useState |
|--------|---------------------|---------|
| Back-button support | Yes | Browser back goes to /settings, not step 1 |
| Refresh mid-flow | Restarts at step 1 (stateless) | Same — restarts |
| Complexity | Requires useSearchParams + router.push | Simple |
| Data security | Step data exposed in URL | State stays in memory |
| UX for cancel flow | Acceptable — nobody bookmarks a cancel form | Preferred |

The flow is intentionally ephemeral. A refresh resetting to Step 1 is acceptable (matching how e.g. Stripe and Notion handle cancellation). State lost on refresh is a non-issue: survey is only written to DB on Step 2 submit (server action), and the user can repeat the flow.

**Mid-flow state in DB:** The `CancellationSurvey` is created on Step 2 submit. If the user refreshes after Step 2, the survey row exists but `cancelledAt` is null — safe, the service checks this. The `surveyId` returned from the Step 2 action must be held in React state and passed to subsequent actions.

---

## 4. Data Fetching Strategy

### Prefetched on initial page load (Server Component `page.tsx`)

```typescript
// page.tsx prefetches:
const user = await requireAuth()                    // userName for personalisation
const entitlements = await getUserEntitlements(user.id)  // find active entitlement
const activeEntitlement = entitlements[0]           // first ACTIVE with stripeSubscriptionId
const periodEndDate = /* Stripe sub retrieve */     // period end for Step 4/5 copy
const reasons = await prisma.cancellationReason.findMany()  // chip labels from DB
```

The active entitlement's `stripeSubscriptionId` is used to retrieve `current_period_end` from Stripe on page load — avoids a round-trip in the Step 4 server action. This date is passed as a prop to `CancelFlow`.

If no active entitlement is found: redirect to `/dashboard/settings`.

### Price data for DISCOUNT card

The entitlement join includes `priceVariant: true` (confirmed from `getUserEntitlements` in `entitlement.service.ts`). Use `entitlement.priceVariant?.priceAmountCents` for the "old price". New price = `Math.round(priceAmountCents * 0.8)` if offer has no explicit overridden price. Format as `${price / 100} kr/md` with `Math.round`. This is passed as a prop to `step-offer-discount.tsx` — no extra Stripe call needed.

### What comes from server actions (lazy)

| Action | When called | Returns |
|--------|------------|---------|
| `submitSurveyAndResolveOffer` | Step 2 "Næste" click | `{ surveyId, offerType, offerConfig }` |
| `acceptOfferAction` | Step 3 "Ja tak" / "Pause mit abonnement" | `{ acceptanceId, expiresAt }` |
| `confirmCancelAction` | Step 4 "Opsig abonnement" | `{ cancelAtPeriodEnd, currentPeriodEnd }` |

---

## 5. Server Action Signatures

File: `app/dashboard/subscription/cancel/actions.ts`

```typescript
'use server'

// Called on Step 2 submit
// Creates CancellationSurvey + calls resolveEligibleOffer()
// Returns the offer type to render in Step 3
export async function submitSurveyAndResolveOffer(input: {
  entitlementId: string
  reasonSlugs: string[]        // slugs from selected chips
  feedback: string | null
  primaryReasonSlug: string    // first selected chip (or highest priority)
}): Promise<{
  surveyId: string
  offerType: 'DISCOUNT' | 'PAUSE' | 'SUPPORT' | 'CONTENT_HELP' | 'NONE' | null
  offerId: string | null
  offerConfig: EligibleOffer | null
}>

// Called on Step 3 accept (DISCOUNT or PAUSE)
export async function acceptOfferAction(input: {
  surveyId: string
  offerId: string
  entitlementId: string
  pauseMonths?: 1 | 2 | 3     // only for PAUSE variant
}): Promise<{
  acceptanceId: string
  expiresAt: Date | null
  cancelReversed: boolean
}>

// Called on Step 4 "Opsig abonnement"
// Requires survey to exist (cancelSubscription has survey gate)
export async function confirmCancelAction(input: {
  entitlementId: string
}): Promise<{
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date
}>
```

All three actions call `requireAuth()` internally for IDOR safety — never trust `userId` from the client.

**Important:** `submitSurveyAndResolveOffer` must:
1. `prisma.cancellationSurvey.create(...)` with userId, entitlementId, primaryReasonId, tags
2. Then call `resolveEligibleOffer(userId, reasonSlugs)` from `retention.service.ts`
3. Return the survey ID + offer shape

`cancelSubscription()` from `cancellation.service.ts` already requires the survey to exist (survey gate). `confirmCancelAction` just calls it — the gate is in the service.

---

## 6. Component Breakdown

### `cancel-flow.tsx` (Client Component)

Owns all flow state:

```typescript
type FlowStep =
  | 'intro'
  | 'reason'
  | 'offer-discount'
  | 'offer-pause'
  | 'offer-support'
  | 'offer-content'
  | 'offer-skip'
  | 'confirm'
  | 'done-cancel'
  | 'done-pause'
  | 'done-retention'

interface FlowState {
  step: FlowStep
  surveyId: string | null
  offerId: string | null
  offerConfig: EligibleOffer | null
  pauseMonths: 1 | 2 | 3 | null
  acceptanceExpiresAt: Date | null
  loading: boolean
  error: string | null
}
```

Props passed in from `page.tsx`:
- `userName: string`
- `entitlementId: string`
- `periodEndDate: Date`
- `priceAmountCents: number | null`
- `reasons: { slug: string; label: string }[]`

### Step components (all Client Components, receive props + callback from cancel-flow)

| Component | Key Props | Primary CTA |
|-----------|-----------|-------------|
| `step-intro.tsx` | `userName`, `onContinue()`, `onSkip()` | "Ja, hjælp gerne" / skip link |
| `step-reason.tsx` | `reasons[]`, `onSubmit(slugs, feedback)`, `loading` | "Næste" (disabled until ≥1 chip) |
| `step-offer-discount.tsx` | `offerConfig`, `priceAmountCents`, `onAccept()`, `onDecline()`, `loading` | "Ja tak, det vil jeg gerne" |
| `step-offer-pause.tsx` | `offerConfig`, `onAccept(months)`, `onDecline()`, `loading` | "Pause mit abonnement" (disabled until month selected) |
| `step-offer-support.tsx` | `offerConfig`, `onDecline()` | "Kontakt support" (opens supportUrl or mailto) |
| `step-offer-content.tsx` | `offerConfig`, `onStay()`, `onDecline()` | "Fortsæt mit abonnement" |
| `step-offer-skip.tsx` | `onContinue()` | "Fortsæt til bekræftelse" |
| `step-confirm.tsx` | `periodEndDate`, `onConfirm()`, `onGoBack()`, `loading` | "Opsig abonnement" |
| `step-done.tsx` | `variant: 'cancel'|'pause'|'retention'`, `userName`, `periodEndDate`, `expiresAt`, `offerConfig` | "Tilbage til forsiden" |

### Back navigation pattern

Each step component shows a back chevron that calls `onBack()` — `cancel-flow.tsx` maps this to the correct previous step. Skip from intro goes directly to `confirm`. Declining an offer in Step 3 goes to `confirm`.

---

## 7. Danish Copy — Final Version to Ship

All copy matches mockup tone exactly. Listed here as the canonical reference.

### Step 1 (Intro)
- **Illustration:** 🌿 (green circle, sand gradient)
- **Heading:** "Vi er kede af at se dig gå"
- **Body:** "Før du opsiger, må vi spørge om et par ting? Det tager 1 minut — og det hjælper os med at blive bedre for andre forældre."
- **Primary CTA:** "Ja, hjælp gerne"
- **Skip link:** "Nej tak, jeg vil bare opsige"

### Step 2 (Reason)
- **Heading (left-aligned):** "Hvad fik dig til at overveje at stoppe?"
- **Subtext:** "Vælg hvad der passer — du må vælge flere"
- **Chips (label → slug):**
  - "Prisen" → `pris`
  - "For lidt tid" → `tid`
  - "Matcher ikke mig" → `indhold-matcher-ikke`
  - "Personlig situation" → `personlig-situation`
  - "Fandt noget andet" → `fandt-alternativ`
  - "Jeg har det bedre nu" → `forbedret`
  - "Tekniske problemer" → `teknisk`
- **Textarea label:** "Noget andet du gerne vil fortælle os?"
- **Textarea hint:** "Helt valgfrit — men vi læser alt"
- **Primary CTA:** "Næste"

### Step 3A — Discount
- **Discount card:** `-20%` / `i {durationMonths} måneder` / old price strikethrough → new price
- **Heading:** "Før du går — hvad med en lille gave?"
- **Body:** "Vi forstår godt at økonomien kan være stram. Du får 20% rabat de næste {durationMonths} måneder, så du kan fortsætte uden at tænke over det."
- **Primary CTA:** "Ja tak, det vil jeg gerne"
- **Decline link:** "Nej tak, jeg vil alligevel opsige"

### Step 3B — Pause
- **Illustration:** ☕ (coral accent circle)
- **Heading:** "Vil du have en pause i stedet?"
- **Body:** "Nogle gange er det bare ikke det rigtige tidspunkt. Du kan sætte dit abonnement på pause — og være her igen når du er klar."
- **Info box title:** "I pausen:"
- **Info items:** "Du betaler ikke noget" / "Dine bogmærker og fremskridt gemmes" / "Du kan altid vende tilbage tidligere"
- **Duration label:** "Hvor længe?"
- **Duration buttons:** 1 måned / 2 måneder / 3 måneder
- **Primary CTA (disabled until month selected):** "Pause mit abonnement"
- **Decline link:** "Nej tak, jeg vil gerne opsige helt"

### Step 3C — Support
- **Illustration:** 🛠️ (warm-blue circle)
- **Heading:** "Lad os fikse det først"
- **Body:** "Tekniske problemer er altid vores skyld — og vi vil gerne gøre det godt igen. Skriv til os, og vi hjælper dig inden du beslutter dig."
- **Support card:** ✉️ icon / "Skriv til vores support" / "Vi svarer inden for 24 timer på hverdage"
- **Primary CTA:** "Kontakt support" (links to `offerConfig.supportUrl` — fallback `mailto:support@familymind.nu`)
- **Decline link:** "Nej tak, jeg vil gerne opsige alligevel"

### Step 3D — Content
- **Heading (left-aligned):** "Har du set disse?"
- **Subtext:** "Nogle populære kurser du måske ikke har opdaget endnu. Du har stadig adgang til alt — måske er der noget her der passer bedre?"
- **Content items:** 3 items from `offerConfig.contentUrl` (JSON array) — fallback hardcoded: 🌙 Søvn og rutiner / 💛 Følelsesregulering / 🌱 Stille stunder
- **Primary CTA:** "Fortsæt mit abonnement" (returns user to step 1 / navigates to /dashboard)
- **Decline link:** "Nej tak, jeg vil gerne opsige"

### Step 3E — Skip (NONE offer)
- **Illustration:** 🌻 (green circle)
- **Heading:** "Det er helt OK"
- **Body:** "Nogle gange er det bare tid til noget andet — og det er vi glade på dine vegne for. Tak fordi du var her."
- **Info box items:** "♡ Vi respekterer dit valg" / "♡ Din dør er altid åben" / "♡ Alt er gemt hvis du vender tilbage"
- **Primary CTA:** "Fortsæt til bekræftelse"

### Step 4 (Confirm)
- **Heading:** "Er du sikker?"
- **Body:** "Dit abonnement stopper den **{periodEndDate formatted}**. Indtil da har du fuld adgang — som du plejer."
- **Info box items:** "Du beholder adgang til {date}" / "Du bliver ikke opkrævet igen" / "Dine bogmærker og fremskridt gemmes" / "Du kan altid komme tilbage"
- **Primary CTA:** "Opsig abonnement"
- **Decline link:** "Nej, jeg vil beholde mit abonnement"

### Step 5 — Cancel variant
- **Illustration:** 🏡 (sand gradient)
- **Heading:** "Tak for din tid hos os, {firstName}"
- **Body:** "Vi ønsker dig alt det bedste.\n\nDin dør er altid åben hvis du vil tilbage — dit indhold, dine bogmærker og din rejse er gemt her.\n\nDu har stadig adgang indtil **{periodEndDate}**."
- **CTA:** "Tilbage til forsiden" → `/dashboard`

### Step 5B — Pause variant
- **Illustration:** ⏸️ (coral accent)
- **Heading:** "Pause aktiveret"
- **Body:** "Vi ses igen den **{expiresAt formatted}**.\n\nDu bliver ikke opkrævet i mellemtiden, og alt er gemt som du efterlod det.\n\nHvis du vil tilbage tidligere, kan du genaktivere fra \"Mit abonnement\"."
- **CTA:** "Tilbage til forsiden" → `/dashboard`

### Step 5C — Retention (rabat) variant
- **Illustration:** 🎁 (coral accent)
- **Heading:** "Dejligt at du bliver, {firstName}"
- **Body:** "Din rabat er aktiveret — de næste {durationMonths} måneder betaler du kun **{newPrice} kr/md**.\n\nEfter de {durationMonths} måneder fortsætter dit abonnement til den normale pris."
- **Info box title:** "Din rabat:"
- **Info items:** "20% i {month1}, {month2} og {month3}" / "Ingen handling nødvendig" / "Fortsætter automatisk efterfølgende"
- **CTA:** "Tilbage til forsiden" → `/dashboard`

### Date formatting
Use Danish locale: `new Date(date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })` → "8. maj 2026"

---

## 8. Design System Reference

All values confirmed from existing codebase (tailwind classes in settings/page.tsx, dashboard components):

| Token | Value | Usage |
|-------|-------|-------|
| `--color-sand` | `#F5F0EB` | Card backgrounds, info boxes |
| `--color-coral` | `#E8715A` | Primary CTAs, chip selected state |
| `--color-success` | `#2A6B5A` | Info check marks, price-new |
| `--color-warm-blue` | `#86A0A6` | Support card accent |
| Font serif | `DM Serif Display` | All headings (h2.title in mockup) |
| Font body | `Inter` | Everything else |
| Border radius | `rounded-2xl` (16px) | Cards; `rounded-full` for chips |
| Touch target | min 44px height | All buttons |
| Page padding | `px-4 py-8` mobile / `sm:px-8` | Matches existing dashboard pages |

### CSS class mapping (mockup → Tailwind)

| Mockup class | Tailwind equivalent |
|-------------|---------------------|
| `.btn.btn-primary` | `w-full rounded-2xl bg-[var(--color-coral)] px-6 py-4 text-sm font-semibold text-white` |
| `.btn.btn-secondary` | `w-full rounded-2xl border border-border bg-white px-6 py-4 text-sm font-semibold` |
| `.chip` | `rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium` |
| `.chip.selected` | `border-[var(--color-coral)] bg-[var(--color-coral)] text-white` |
| `.discount-card` | Custom inline style with gradient — use `style` prop or Tailwind `bg-gradient-to-br` |
| `.illustration` | `mx-auto flex size-36 items-center justify-center rounded-full text-7xl` |
| `.info-box` | `rounded-2xl bg-[var(--color-sand)] p-5` |
| `.duration-grid` | `grid grid-cols-3 gap-2.5` |
| `.duration-btn` | `rounded-xl border border-border bg-white py-[18px] text-center` |

---

## 9. Step 3 Offer Type Routing Logic

When `submitSurveyAndResolveOffer` returns, `cancel-flow.tsx` routes to step:

```typescript
function resolveStep(offerType: string | null): FlowStep {
  switch (offerType) {
    case 'DISCOUNT':     return 'offer-discount'
    case 'PAUSE':        return 'offer-pause'
    case 'SUPPORT':      return 'offer-support'
    case 'CONTENT_HELP': return 'offer-content'
    case 'NONE':         return 'offer-skip'
    default:             return 'confirm'   // null = no offer exists → skip Step 3
  }
}
```

When `offerType` is `null` (no eligible offer at all), skip Step 3 entirely and go straight to `confirm`. This is distinct from `NONE` (there IS a "skip" offer configured — still shows the respect-skip screen).

---

## 10. Skip Survey Path

From Step 1 "Nej tak, jeg vil bare opsige" the user goes to Step 4 (confirm) directly. No survey is submitted. When they click "Opsig abonnement" in Step 4, `confirmCancelAction` is called. But `cancelSubscription()` has a survey gate — it throws if no survey exists.

**Resolution:** `confirmCancelAction` must detect the survey-skip path. When called without a `surveyId`, it first creates a minimal survey (no reasons, no feedback) before calling `cancelSubscription()`. This satisfies the service gate and records that the user skipped. Alternatively: move the survey gate check after the `cancel_at_period_end` check in the service — but that changes existing tested code. Safer: create a minimal survey in the action.

```typescript
// In confirmCancelAction, if no surveyId passed:
await prisma.cancellationSurvey.upsert({
  where: { userId_entitlementId: { userId, entitlementId } },
  update: {},   // already exists if user did Step 2 then came here
  create: { userId, entitlementId },   // minimal survey for skip path
})
```

---

## 11. Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` (key absent) — treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

Phase 12 is pure UI. Service layer is already tested in Phases 10–11. Testing strategy: TypeScript compilation as primary automated gate; visual verification via browser as manual gate.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OFF-UI-01 | Cancel link appears in settings page | Manual browser | — | ❌ Wave 0: no test file |
| OFF-UI-02 | Step 1 renders, skip link jumps to confirm | TypeScript + manual | `npx tsc --noEmit` | ❌ Wave 0 |
| OFF-UI-03 | Chips render from DB data, textarea optional | TypeScript + manual | `npx tsc --noEmit` | ❌ Wave 0 |
| OFF-UI-04 | `submitSurveyAndResolveOffer` calls correct services | Vitest unit | `npx vitest run actions` | ❌ Wave 0 |
| OFF-UI-05 | `confirmCancelAction` calls cancelSubscription | Vitest unit | `npx vitest run actions` | ❌ Wave 0 |
| OFF-UI-06 | Step 5 variants render correct copy | TypeScript + manual | `npx tsc --noEmit` | ❌ Wave 0 |
| OFF-UI-07 | Mobile layout correct at 375px | Manual browser (DevTools) | — | — |

### Wave 0 Gaps

- [ ] `app/dashboard/subscription/cancel/__tests__/actions.test.ts` — covers OFF-UI-04, OFF-UI-05 with vi.mock for `@/lib/prisma`, `@/lib/services/cancellation.service`, `@/lib/services/retention.service`
- [ ] TypeScript gate: `npx tsc --noEmit` must exit 0 after each task

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npx vitest run` (full suite — confirms Phase 10/11 tests still green)
- **Phase gate:** Full suite green + manual browser walkthrough of all 10 step variants before `/gsd:verify-work`

---

## 12. Architecture Patterns (Established — Don't Deviate)

| Pattern | Source | Rule |
|---------|--------|------|
| Server actions in `actions.ts` | `app/dashboard/settings/actions.ts` | All mutations go through `'use server'` actions |
| IDOR guard via `requireAuth()` | All existing actions | Server action always re-verifies userId from session |
| `_components/` folder | All dashboard pages | Client components inside `_components/` |
| `getUserEntitlements` for active entitlement | `entitlement.service.ts` | Use existing function, don't re-query |
| `requireAuth()` + redirect pattern | `settings/page.tsx` | Missing entitlement → `redirect('/dashboard/settings')` |

---

## 13. Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Stripe cancel logic | Custom Stripe API call | `cancelSubscription()` from `lib/services/cancellation.service.ts` |
| Pause logic | Custom Stripe pause_collection | `pauseSubscription()` via `acceptOffer()` in `retention.service.ts` |
| Offer resolution | Custom priority logic | `resolveEligibleOffer()` from `lib/services/retention.service.ts` |
| Offer acceptance | Custom DB insert | `acceptOffer()` from `lib/services/retention.service.ts` |
| Auth/session | Custom session check | `requireAuth()` from `lib/auth` |
| Entitlement lookup | Direct prisma query | `getUserEntitlements()` from `lib/services/entitlement.service.ts` |
| Date formatting | Custom date util | `toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })` |

---

## 14. Common Pitfalls

### Pitfall 1: Survey gate blocks the skip path
**What goes wrong:** User clicks "Nej tak, jeg vil bare opsige" from Step 1 → reaches Step 4 → clicks confirm → server throws "Survey er ikke udfyldt"
**Why it happens:** `cancelSubscription()` has a hard survey gate requirement (OFF-DATA-03)
**How to avoid:** `confirmCancelAction` must upsert a minimal survey if none exists before calling `cancelSubscription()`
**Warning sign:** Test with skip path — action throws 500

### Pitfall 2: Price display without priceVariant data
**What goes wrong:** DISCOUNT card shows "NaN kr/md" or crashes
**Why it happens:** `entitlement.priceVariant` can be null if entitlement was created without a price variant (B2B, gift, legacy)
**How to avoid:** Pass `priceAmountCents={entitlement.priceVariant?.priceAmountCents ?? null}` — step-offer-discount hides the price comparison if null

### Pitfall 3: `pauseMonths` from offer vs user selection
**What goes wrong:** Pause offer has `pauseMonths: 1` in DB but user selects 3 months in UI — UI sends 1
**Why it happens:** The offer's `pauseMonths` field sets the default, but Step 3B lets the user pick 1/2/3
**How to avoid:** `acceptOfferAction` takes `pauseMonths` from the user's selection, ignores `offer.pauseMonths`. The duration picker is always 1/2/3 regardless of offer config.

### Pitfall 4: `surveyId` lost across renders
**What goes wrong:** Step 4 confirm fires `confirmCancelAction` but survey gate fails because surveyId was never stored
**Why it happens:** surveyId is returned from the Step 2 action and must persist in component state through Step 3 and into Step 4
**How to avoid:** Store `surveyId` in `FlowState`, initialise as null, set on Step 2 action response

### Pitfall 5: TypeScript errors from `as unknown as` Stripe cast pattern
**What goes wrong:** tsc fails on `current_period_end` access
**Why it happens:** Stripe SDK v20.3.1 doesn't expose this cleanly — pattern confirmed in Phase 10
**How to avoid:** Use the same cast pattern as `cancellation.service.ts`: `(sub as unknown as { current_period_end: number })`

---

## 15. Open Questions

1. **Price source for DISCOUNT card**
   - What we know: `entitlement.priceVariant?.priceAmountCents` is available via `getUserEntitlements` join
   - What's unclear: If `priceVariant` is null (B2B/gift/legacy entitlements), what do we show?
   - Recommendation: Hide price comparison row when null — show only the percentage discount

2. **Content suggestions in CONTENT_HELP offer**
   - What we know: `offerConfig.contentUrl` and `contentMessage` are freetext strings (not structured JSON)
   - What's unclear: Is contentUrl a single URL or a JSON array of course links?
   - Recommendation: Treat as single URL for now; hardcode the 3 suggestion cards from the mockup as fallback when contentUrl is null. Phase 13 admin UI can add real content later.

3. **Support contact flow**
   - What we know: `offerConfig.supportUrl` links to a support URL
   - What's unclear: Does clicking "Kontakt support" open a new tab, mailto, or an in-app form?
   - Recommendation: Use `<a href={supportUrl || 'mailto:support@familymind.nu'} target="_blank">` — simplest, no in-app chat complexity

---

## Sources

### Primary (HIGH confidence)
- `lib/services/cancellation.service.ts` — exact function signatures, survey gate pattern, Stripe cast
- `lib/services/retention.service.ts` — `EligibleOffer` type, `resolveEligibleOffer`, `acceptOffer` signatures
- `app/dashboard/settings/page.tsx` + `manage-subscription-button.tsx` — current cancel entry point
- `prisma/seed.ts` — 7 CancellationReason slugs confirmed
- `prisma/schema.prisma` — CancellationSurvey, RetentionOffer model shapes
- `C:/Users/jacob.hummel/Claude/cancel-flow-mockup.html` — complete visual spec, all 10 screens
- `vitest.config.ts` — test framework configuration

### Secondary (MEDIUM confidence)
- `lib/services/entitlement.service.ts` — `getUserEntitlements` include shape for priceVariant
- Dashboard pages pattern — `_components/`, server component + client component split

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Next.js App Router, React useState, server actions are established patterns in this codebase
- Architecture: HIGH — file structure derived directly from existing dashboard page patterns
- Service integration: HIGH — service signatures read directly from source
- Copy: HIGH — transcribed verbatim from mockup spec
- Pitfalls: HIGH — derived from service code reading (survey gate, Stripe cast, null priceVariant)

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable codebase)
