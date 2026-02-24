# Stripe Connect Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Lad white-label tenants forbinde deres egen Stripe-konto via self-service OAuth, så betalinger fra deres kunder går direkte til dem via Stripe Connect (Standard).

**Architecture:** Platform-niveau Stripe-konto (`STRIPE_SECRET_KEY`) fungerer som Connect-platform. Hver tenant (Organization) forbinder sin egen Stripe-konto via OAuth. Alle checkout- og subscription-kald bruger `stripe_account` header til at route betalinger til tenantens konto. Webhooks modtages centralt og routes via `event.account`.

**Tech Stack:** Stripe Connect (Standard), Next.js 16 API routes, Prisma 6, Supabase Auth, shadcn/ui

**Design doc:** `docs/plans/2026-02-23-stripe-connect-design.md`

---

## Task 1: Prisma-skema — Stripe Connect-felter på Organization

**Files:**
- Modify: `prisma/schema.prisma:142-150`
- Create: `prisma/migrations/<auto>/migration.sql` (Prisma genererer)

**Step 1: Tilføj felter til Organization-modellen**

Erstat den eksisterende Organization-model i `prisma/schema.prisma`:

```prisma
model Organization {
  id                  String    @id @default(uuid()) @db.Uuid
  name                String
  slug                String    @unique
  stripeAccountId     String?
  stripeAccountStatus String    @default("not_connected")
  stripeOnboardedAt   DateTime?
  createdAt           DateTime  @default(now())

  users        User[]
  entitlements Entitlement[]
}
```

Felter:
- `stripeAccountId` — `"acct_xxx"` fra Stripe Connect OAuth, nullable (ikke forbundet)
- `stripeAccountStatus` — `not_connected | pending | active | restricted`
- `stripeOnboardedAt` — tidspunkt for første succesfulde Connect

**Step 2: Kør migration**

```bash
npx prisma migrate dev --name add-stripe-connect-fields
```

Forventet: Migration oprettes, schema synces.

**Step 3: Verificér**

```bash
npx prisma studio
```

Åbn Organization-tabellen og bekræft de tre nye kolonner eksisterer med defaults.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Stripe Connect fields to Organization model"
```

---

## Task 2: Stripe Connect service

**Files:**
- Create: `lib/services/stripe-connect.service.ts`

**Step 1: Opret service-filen**

```typescript
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

/**
 * Generér Stripe Connect OAuth URL.
 * @param state - CSRF-token (gemmes i cookie af calleren)
 */
export function generateConnectOAuthUrl(state: string): string {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID
  if (!clientId) {
    throw new Error('STRIPE_CONNECT_CLIENT_ID is not set')
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe-connect/callback`
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'read_write',
    redirect_uri: redirectUri,
    state,
  })

  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`
}

/**
 * Håndtér OAuth callback — exchange code for account ID.
 * Returnerer den opdaterede Organization.
 */
export async function handleConnectCallback(
  organizationId: string,
  code: string
) {
  const stripe = getStripe()

  // Exchange authorization code for account credentials
  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code,
  })

  const stripeAccountId = response.stripe_user_id
  if (!stripeAccountId) {
    throw new Error('Stripe OAuth returnerede intet account ID')
  }

  // Hent account-status fra Stripe
  const account = await stripe.accounts.retrieve(stripeAccountId)
  const status = resolveAccountStatus(account)

  // Gem på Organization
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      stripeAccountId,
      stripeAccountStatus: status,
      stripeOnboardedAt: status === 'active' ? new Date() : null,
    },
  })

  return org
}

/**
 * Frakobl Stripe-konto fra Organization.
 */
export async function disconnectStripeAccount(organizationId: string) {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  })

  if (!org.stripeAccountId) {
    throw new Error('Ingen Stripe-konto forbundet')
  }

  const stripe = getStripe()
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID
  if (!clientId) {
    throw new Error('STRIPE_CONNECT_CLIENT_ID is not set')
  }

  // Deauthorize hos Stripe
  await stripe.oauth.deauthorize({
    client_id: clientId,
    stripe_user_id: org.stripeAccountId,
  })

  // Nulstil Organization-felter
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      stripeAccountId: null,
      stripeAccountStatus: 'not_connected',
      stripeOnboardedAt: null,
    },
  })
}

/**
 * Opdatér Organization-status baseret på Stripe account data.
 * Kaldes fra webhook `account.updated`.
 */
export async function syncAccountStatus(stripeAccountId: string) {
  const stripe = getStripe()
  const account = await stripe.accounts.retrieve(stripeAccountId)
  const status = resolveAccountStatus(account)

  await prisma.organization.updateMany({
    where: { stripeAccountId },
    data: {
      stripeAccountStatus: status,
      ...(status === 'active' ? { stripeOnboardedAt: new Date() } : {}),
    },
  })
}

/**
 * Hent Organization's stripeAccountId og validér den er aktiv.
 * Bruges af checkout-flowet.
 */
export async function getActiveStripeAccount(
  organizationId: string
): Promise<string> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  })

  if (!org.stripeAccountId || org.stripeAccountStatus !== 'active') {
    throw new Error('Stripe er ikke forbundet eller aktiv for denne organisation')
  }

  return org.stripeAccountId
}

/**
 * Resolve Stripe account status fra account-objekt.
 */
function resolveAccountStatus(
  account: { charges_enabled?: boolean; payouts_enabled?: boolean }
): string {
  if (account.charges_enabled && account.payouts_enabled) return 'active'
  if (account.charges_enabled && !account.payouts_enabled) return 'restricted'
  return 'pending'
}
```

**Step 2: Verificér TypeScript**

```bash
npx tsc --noEmit
```

Forventet: Ingen fejl.

**Step 3: Commit**

```bash
git add lib/services/stripe-connect.service.ts
git commit -m "feat: add Stripe Connect service — OAuth, disconnect, status sync"
```

---

## Task 3: OAuth callback API route

**Files:**
- Create: `app/api/stripe-connect/callback/route.ts`

**Step 1: Opret callback-route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth'
import { handleConnectCallback } from '@/lib/services/stripe-connect.service'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const redirectUrl = new URL('/admin/settings/integrations', process.env.NEXT_PUBLIC_APP_URL!)

  // Stripe sendte en fejl (bruger afviste eller teknisk fejl)
  if (error) {
    redirectUrl.searchParams.set('connect_error', errorDescription || error)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code || !state) {
    redirectUrl.searchParams.set('connect_error', 'Manglende parametre fra Stripe')
    return NextResponse.redirect(redirectUrl)
  }

  // CSRF-validering: sammenlign state med cookie
  const cookieStore = await cookies()
  const storedState = cookieStore.get('stripe_connect_state')?.value

  if (!storedState || storedState !== state) {
    redirectUrl.searchParams.set('connect_error', 'Ugyldig state — prøv igen')
    return NextResponse.redirect(redirectUrl)
  }

  // Ryd state-cookie
  cookieStore.delete('stripe_connect_state')

  // Verificér bruger er admin
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN' || !user.organizationId) {
    redirectUrl.searchParams.set('connect_error', 'Ikke autoriseret')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    await handleConnectCallback(user.organizationId, code)
    redirectUrl.searchParams.set('connect_success', '1')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ukendt fejl'
    console.error('Stripe Connect callback fejl:', message)
    redirectUrl.searchParams.set('connect_error', 'Kunne ikke forbinde Stripe-konto')
  }

  return NextResponse.redirect(redirectUrl)
}
```

**Step 2: Verificér TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add app/api/stripe-connect/callback/route.ts
git commit -m "feat: add Stripe Connect OAuth callback route"
```

---

## Task 4: Server actions — Connect/Disconnect

**Files:**
- Modify: `app/admin/settings/integrations/actions.ts`

**Step 1: Tilføj Connect-actions**

Tilføj disse to actions til den eksisterende `actions.ts` fil (behold eksisterende `updateIntegrationSettingsAction`):

```typescript
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  generateConnectOAuthUrl,
  disconnectStripeAccount,
} from '@/lib/services/stripe-connect.service'

export async function initiateStripeConnectAction() {
  const user = await requireAdmin()

  if (!user.organizationId) {
    throw new Error('Bruger tilhører ingen organisation')
  }

  // Generér CSRF-token og gem i cookie
  const state = crypto.randomBytes(32).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('stripe_connect_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutter
    path: '/',
  })

  const url = generateConnectOAuthUrl(state)
  redirect(url)
}

export async function disconnectStripeAction() {
  const user = await requireAdmin()

  if (!user.organizationId) {
    throw new Error('Bruger tilhører ingen organisation')
  }

  await disconnectStripeAccount(user.organizationId)
  revalidatePath('/admin/settings/integrations')
}
```

**Vigtig:** Husk at tilføje de nye imports til toppen af filen. Den eksisterende `requireAdmin`, `revalidatePath`, og `revalidateTag` import skal beholdes.

**Step 2: Verificér TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add app/admin/settings/integrations/actions.ts
git commit -m "feat: add server actions for Stripe Connect/Disconnect"
```

---

## Task 5: Webhook — account.updated + org-kontekst

**Files:**
- Modify: `app/api/webhooks/stripe/route.ts`

**Step 1: Tilføj `account.updated` event handler**

Tilføj denne case i switch-blokken (efter `invoice.payment_failed` case, før `default`):

```typescript
case 'account.updated': {
  const account = event.data.object as Stripe.Account
  if (account.id) {
    const { syncAccountStatus } = await import(
      '@/lib/services/stripe-connect.service'
    )
    await syncAccountStatus(account.id)
  }
  break
}
```

**Step 2: Tilføj org-kontekst til checkout.session.completed**

I `checkout.session.completed` casen, efter `if (!userId || !productId) break`, tilføj logging af connected account:

```typescript
// Log connected account for debugging
if (event.account) {
  console.log(`Checkout from connected account: ${event.account}`)
}
```

Bemærk: `event.account` er automatisk sat af Stripe for events fra connected accounts. Eksisterende logik (userId/productId lookup) fungerer uændret — metadata er sat ved checkout-oprettelse og er identisk uanset om det er en connected account eller ej.

**Step 3: Verificér TypeScript**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add app/api/webhooks/stripe/route.ts
git commit -m "feat: handle account.updated webhook for Connect status sync"
```

---

## Task 6: Checkout service — stripe_account header

**Files:**
- Modify: `lib/services/checkout.service.ts:8-48`

**Step 1: Opdatér createCheckoutSession**

Ændr `createCheckoutSession` til at hente brugerens org og tilføje `stripe_account`:

```typescript
import { getActiveStripeAccount } from '@/lib/services/stripe-connect.service'

export async function createCheckoutSession(
  userId: string,
  data: CreateCheckoutInput
) {
  const validated = createCheckoutSchema.parse(data)
  const stripe = getStripe()

  const product = await prisma.product.findUniqueOrThrow({
    where: { id: validated.productId },
  })

  if (!product.stripePriceId) {
    throw new Error('Product is not synced to Stripe')
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  })

  if (!user.organizationId) {
    throw new Error('Bruger tilhører ingen organisation')
  }

  // Hent tenantens aktive Stripe-konto
  const stripeAccountId = await getActiveStripeAccount(user.organizationId)

  let discountId: string | undefined
  if (validated.discountCode) {
    const discount = await validateDiscountCode(
      validated.discountCode,
      validated.productId
    )
    if (discount.stripeCouponId) {
      discountId = discount.stripeCouponId
    }
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: product.type === 'SUBSCRIPTION' ? 'subscription' : 'payment',
      customer_email: user.email,
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      ...(discountId ? { discounts: [{ coupon: discountId }] } : {}),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
      metadata: { userId, productId: product.id },
    },
    {
      stripeAccount: stripeAccountId,
    }
  )

  return { url: session.url }
}
```

Nøgleændring: `stripe.checkout.sessions.create()` får nu et andet argument `{ stripeAccount: stripeAccountId }` som sætter `Stripe-Account` headeren. Alle Stripe API-kald for denne checkout routes nu til tenantens konto.

**Step 2: Verificér TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add lib/services/checkout.service.ts
git commit -m "feat: route checkout sessions to tenant's connected Stripe account"
```

---

## Task 7: Admin UI — Stripe Connect-kort

**Files:**
- Modify: `app/admin/settings/integrations/page.tsx`
- Modify: `app/admin/settings/integrations/_components/integrations-form.tsx`

### Step 1: Opdatér page.tsx — hent org-data

Erstat hele filen:

```typescript
import { requireAdmin } from '@/lib/auth'
import { getSiteSettings } from '@/lib/services/settings.service'
import { prisma } from '@/lib/prisma'
import { IntegrationsForm } from './_components/integrations-form'
import { StripeConnectCard } from './_components/stripe-connect-card'

export default async function IntegrationsSettingsPage() {
  const user = await requireAdmin()

  const settings = await getSiteSettings([
    'ga4_measurement_id',
    'meta_pixel_id',
  ])

  // Hent org Stripe Connect-status
  let stripeConnect = {
    status: 'not_connected' as string,
    accountId: null as string | null,
  }

  if (user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { stripeAccountId: true, stripeAccountStatus: true },
    })
    if (org) {
      stripeConnect = {
        status: org.stripeAccountStatus,
        accountId: org.stripeAccountId,
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrationer</h1>
        <p className="text-muted-foreground">
          Forbind tredjeparts-tjenester til platformen
        </p>
      </div>
      <StripeConnectCard
        status={stripeConnect.status}
        accountId={stripeConnect.accountId}
      />
      <IntegrationsForm settings={settings} />
    </div>
  )
}
```

### Step 2: Opret StripeConnectCard-komponent

Opret `app/admin/settings/integrations/_components/stripe-connect-card.tsx`:

```typescript
'use client'

import { useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  initiateStripeConnectAction,
  disconnectStripeAction,
} from '../actions'
import { CheckCircle2, AlertCircle, Clock, XCircle, ExternalLink } from 'lucide-react'

type Props = {
  status: string
  accountId: string | null
}

function StripeConnectCardInner({ status, accountId }: Props) {
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()

  const connectError = searchParams.get('connect_error')
  const connectSuccess = searchParams.get('connect_success')

  // Vis toast baseret på URL-params (fra OAuth callback redirect)
  if (connectError) {
    toast.error(connectError)
  }
  if (connectSuccess) {
    toast.success('Stripe-konto forbundet!')
  }

  function handleConnect() {
    startTransition(async () => {
      await initiateStripeConnectAction()
    })
  }

  function handleDisconnect() {
    if (!confirm('Er du sikker på du vil frakoble Stripe? Checkout vil blive deaktiveret.')) {
      return
    }
    startTransition(async () => {
      try {
        await disconnectStripeAction()
        toast.success('Stripe-konto frakoblet')
      } catch {
        toast.error('Kunne ikke frakoble Stripe')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Stripe
          <StatusBadge status={status} />
        </CardTitle>
        <CardDescription>
          <StatusDescription status={status} accountId={accountId} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'not_connected' && (
          <Button onClick={handleConnect} disabled={isPending}>
            {isPending ? 'Omdirigerer...' : 'Forbind Stripe'}
          </Button>
        )}

        {status === 'pending' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Din Stripe-konto afventer verificering hos Stripe. Udfyld venligst alle påkrævede oplysninger.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Åbn Stripe Dashboard <ExternalLink className="ml-1 size-4" />
                </a>
              </Button>
              <Button variant="destructive" onClick={handleDisconnect} disabled={isPending}>
                Frakobl
              </Button>
            </div>
          </div>
        )}

        {status === 'active' && (
          <div className="space-y-3">
            {accountId && (
              <p className="text-sm font-mono text-muted-foreground">
                Konto: {accountId}
              </p>
            )}
            <Button variant="destructive" onClick={handleDisconnect} disabled={isPending}>
              {isPending ? 'Frakobler...' : 'Frakobl Stripe'}
            </Button>
          </div>
        )}

        {status === 'restricted' && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              Stripe har begrænset din konto. Tjek dit Stripe Dashboard for detaljer.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Åbn Stripe Dashboard <ExternalLink className="ml-1 size-4" />
                </a>
              </Button>
              <Button variant="destructive" onClick={handleDisconnect} disabled={isPending}>
                Frakobl
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="mr-1 size-3" /> Aktiv
        </Badge>
      )
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="mr-1 size-3" /> Afventer
        </Badge>
      )
    case 'restricted':
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 size-3" /> Begrænset
        </Badge>
      )
    default:
      return (
        <Badge variant="outline">
          <XCircle className="mr-1 size-3" /> Ikke forbundet
        </Badge>
      )
  }
}

function StatusDescription({ status, accountId }: { status: string; accountId: string | null }) {
  switch (status) {
    case 'active':
      return 'Stripe er forbundet og klar til at modtage betalinger.'
    case 'pending':
      return 'Stripe-konto er oprettet, men mangler verificering.'
    case 'restricted':
      return 'Stripe-kontoen er begrænset — betalinger kan være påvirket.'
    default:
      return 'Forbind din Stripe-konto for at modtage betalinger fra kunder.'
  }
}

export function StripeConnectCard(props: Props) {
  return (
    <Suspense fallback={
      <Card>
        <CardHeader>
          <CardTitle>Stripe</CardTitle>
          <CardDescription>Indlæser...</CardDescription>
        </CardHeader>
      </Card>
    }>
      <StripeConnectCardInner {...props} />
    </Suspense>
  )
}
```

### Step 3: Opdatér IntegrationsForm — fjern Stripe-kort

Fjern Stripe-kortet fra `integrations-form.tsx` (det er nu i `stripe-connect-card.tsx`). Fjern `stripeConnected` prop. Behold kun analytics-delen.

Erstat `type Props` og fjern Stripe Card-sektionen:

```typescript
type Props = {
  settings: {
    ga4_measurement_id: string
    meta_pixel_id: string
  }
}

export function IntegrationsForm({ settings }: Props) {
  // ... behold alt undtagen Stripe-kortet
}
```

Fjern import af `CheckCircle2` og `XCircle` da de ikke længere bruges her.

### Step 4: Verificér TypeScript

```bash
npx tsc --noEmit
```

### Step 5: Commit

```bash
git add app/admin/settings/integrations/
git commit -m "feat: admin UI for Stripe Connect — OAuth button, status badges, disconnect"
```

---

## Task 8: Checkout guard — deaktivér når Stripe ikke er forbundet

**Files:**
- Modify: Checkout-knapper i user-facing UI (find via `createCheckoutAction` eller `checkout` references)

**Step 1: Identificér checkout-knapper**

Søg efter alle steder der refererer til checkout eller køb:

```bash
grep -r "createCheckoutAction\|checkout\|Køb\|handleCheckout" app/ --include="*.tsx" -l
```

**Step 2: Tilføj guard i checkout server action**

Find filen der kalder `createCheckoutSession` (sandsynligvis en server action). Sørg for at fejlen fra `getActiveStripeAccount` bobbler op som en brugervenlig besked. Funktionen kaster allerede "Stripe er ikke forbundet" — dette skal fanges i UI'et og vises som en toast eller disabled state.

**Step 3: Overvej admin-banner**

Hvis admin besøger en side med produkter og Stripe ikke er forbundet, vis en banner:

```typescript
// I relevant admin layout eller komponent
{stripeStatus !== 'active' && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
    Forbind Stripe for at modtage betalinger.{' '}
    <a href="/admin/settings/integrations" className="underline font-medium">
      Gå til Integrationer
    </a>
  </div>
)}
```

Denne task er mere eksplorativ — den kræver at man finder alle checkout-entry-points og sikrer de håndterer fejlcasen gracefully. Præcis implementation afhænger af, hvordan checkout-knapper er struktureret.

**Step 4: Commit**

```bash
git add -A  # eller specifikke filer
git commit -m "feat: disable checkout when Stripe is not connected"
```

---

## Task 9: Env-vars og dokumentation

**Files:**
- Modify: `.env.example` (tilføj `STRIPE_CONNECT_CLIENT_ID`)
- Ingen kodeændringer

**Step 1: Opdatér .env.example**

Tilføj:

```
# Stripe Connect (platform-niveau)
STRIPE_CONNECT_CLIENT_ID=ca_xxx
```

**Step 2: Verificér at eksisterende env-vars stadig fungerer**

Sørg for at `STRIPE_SECRET_KEY` og `STRIPE_WEBHOOK_SECRET` stadig bruges korrekt — de er platformens egne nøgler, ikke tenantens.

**Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add STRIPE_CONNECT_CLIENT_ID to env example"
```

---

## Task 10: End-to-end manuel test

**Ingen kodeændringer — kun verificering.**

### Forudsætninger
- Stripe test-mode konto med Connect aktiveret
- `STRIPE_CONNECT_CLIENT_ID` sat i `.env.local`
- Mindst én Organization i databasen (seed eller opret manuelt)
- Admin-bruger tilknyttet organisationen

### Testscenario 1: Forbind Stripe
1. Log ind som admin → `/admin/settings/integrations`
2. Verificér Stripe-kort viser "Ikke forbundet" med badge
3. Klik "Forbind Stripe"
4. Bliver redirected til Stripe Connect onboarding
5. Gennemfør onboarding (brug Stripe test-data)
6. Bliver redirected tilbage til `/admin/settings/integrations?connect_success=1`
7. Verificér Stripe-kort viser grøn "Aktiv" badge med account ID

### Testscenario 2: Checkout via Connected Account
1. Som bruger, gå til et produkt og klik "Køb"
2. Verificér Stripe Checkout åbner (i test-mode)
3. I Stripe Dashboard (connected account), verificér at checkout sessionen eksisterer
4. Gennemfør betaling
5. Verificér entitlement oprettes korrekt

### Testscenario 3: Frakobl Stripe
1. Som admin, klik "Frakobl" i Stripe-kort
2. Bekræft i dialog
3. Verificér status ændres til "Ikke forbundet"
4. Verificér checkout fejler gracefully for brugere

### Testscenario 4: Webhook — account.updated
1. I Stripe CLI: `stripe trigger account.updated --stripe-account=acct_xxx`
2. Verificér Organization-status opdateres i databasen

---

## Opsummering af nye filer

| Fil | Type |
|-----|------|
| `lib/services/stripe-connect.service.ts` | Ny service |
| `app/api/stripe-connect/callback/route.ts` | Ny API route |
| `app/admin/settings/integrations/_components/stripe-connect-card.tsx` | Ny komponent |

## Opsummering af ændrede filer

| Fil | Ændring |
|-----|---------|
| `prisma/schema.prisma` | +3 felter på Organization |
| `app/api/webhooks/stripe/route.ts` | +`account.updated` case |
| `lib/services/checkout.service.ts` | +`stripeAccount` header |
| `app/admin/settings/integrations/page.tsx` | Hent org-data, brug StripeConnectCard |
| `app/admin/settings/integrations/_components/integrations-form.tsx` | Fjern Stripe-kort |
| `app/admin/settings/integrations/actions.ts` | +Connect/Disconnect actions |
| `.env.example` | +`STRIPE_CONNECT_CLIENT_ID` |
