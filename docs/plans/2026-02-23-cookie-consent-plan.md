# Cookie Consent & Analytics — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementere GDPR-compliant cookie consent med GA4 + Meta pixel, og juridiske sider (privatlivspolitik, cookiepolitik, vilkår).

**Architecture:** ConsentProvider (React Context) læser/skriver en `cookie_consent` cookie og eksponerer consent-state til child components. AnalyticsScripts loader GA4/Meta pixel betinget via `next/script`. CookieBanner og CookieModal er UI-komponenter. Server action logger samtykke til `CookieConsent` DB-tabel. Tre statiske juridiske sider med template-tekst.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Prisma 6, Tailwind CSS 4, shadcn/ui, next/script

**Vigtige konventioner:**
- Dansk-first: altid æøå, aldrig ASCII-erstatninger
- Service layer pattern: ren business logic i `lib/services/`, server actions som tynde wrappers
- Mobile-first design for bruger-sider
- Ingen eksterne consent-biblioteker — bygget med shadcn/ui

---

## Task 1: Schema — CookieConsent model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Tilføj CookieConsent model**

Indsæt efter `UserNotificationLog` modellen (før Community-sektionen):

```prisma
model CookieConsent {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String?  @db.Uuid
  ipHash      String
  statistics  Boolean  @default(false)
  marketing   Boolean  @default(false)
  consentedAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
}
```

**Step 2: Tilføj relation til User**

I `User` modellen, tilføj efter `contentReports`:

```prisma
  cookieConsents  CookieConsent[]
```

**Step 3: Sync database**

Run: `npx prisma db push`
Expected: Schema synced successfully.

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: schema — CookieConsent model for GDPR consent logging"
```

---

## Task 2: Env vars — GA4 + Meta pixel IDs

**Files:**
- Modify: `.env.example`
- Modify: `.env.local` (lokal — committes ikke)

**Step 1: Tilføj env vars til .env.example**

Tilføj efter Sentry-sektionen:

```
# ---- Analytics ----
NEXT_PUBLIC_GA4_MEASUREMENT_ID=your_ga4_measurement_id
NEXT_PUBLIC_META_PIXEL_ID=your_meta_pixel_id
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "feat: env vars for GA4 and Meta pixel"
```

---

## Task 3: Consent service — server-side logning

**Files:**
- Create: `lib/services/consent.service.ts`

**Step 1: Opret consent service**

```typescript
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

export async function logConsent(data: {
  userId?: string
  ip: string
  statistics: boolean
  marketing: boolean
}) {
  return prisma.cookieConsent.create({
    data: {
      userId: data.userId || null,
      ipHash: hashIp(data.ip),
      statistics: data.statistics,
      marketing: data.marketing,
    },
  })
}
```

**Step 2: Commit**

```bash
git add lib/services/consent.service.ts
git commit -m "feat: consent service — GDPR consent logging with IP hash"
```

---

## Task 4: Consent server action

**Files:**
- Create: `app/actions/consent.ts`

**Step 1: Opret server action**

```typescript
'use server'

import { headers } from 'next/headers'
import { logConsent } from '@/lib/services/consent.service'
import { createClient } from '@/lib/supabase/server'

export async function logConsentAction(data: {
  statistics: boolean
  marketing: boolean
}) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  let userId: string | undefined
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    userId = userData.user?.id
  } catch {
    // Anonymous user — no userId
  }

  await logConsent({
    userId,
    ip,
    statistics: data.statistics,
    marketing: data.marketing,
  })
}
```

**Step 2: Commit**

```bash
git add app/actions/consent.ts
git commit -m "feat: consent server action — log consent with user context"
```

---

## Task 5: ConsentProvider — React Context

**Files:**
- Create: `components/consent/consent-provider.tsx`

**Step 1: Opret ConsentProvider**

```tsx
'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { logConsentAction } from '@/app/actions/consent'

type ConsentState = {
  necessary: boolean
  statistics: boolean
  marketing: boolean
}

type ConsentContextType = {
  consent: ConsentState | null
  hasResponded: boolean
  updateConsent: (consent: Omit<ConsentState, 'necessary'>) => void
  openSettings: boolean
  setOpenSettings: (open: boolean) => void
}

const ConsentContext = createContext<ConsentContextType | null>(null)

const COOKIE_NAME = 'cookie_consent'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 12 months in seconds

function getConsentFromCookie(): ConsentState | null {
  if (typeof document === 'undefined') return null
  const cookie = document.cookie
    .split('; ')
    .find(c => c.startsWith(`${COOKIE_NAME}=`))
  if (!cookie) return null
  try {
    return JSON.parse(decodeURIComponent(cookie.split('=')[1]))
  } catch {
    return null
  }
}

function setConsentCookie(consent: ConsentState) {
  const value = encodeURIComponent(JSON.stringify({
    ...consent,
    timestamp: new Date().toISOString(),
  }))
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [hasResponded, setHasResponded] = useState(true) // true initially to prevent flash
  const [openSettings, setOpenSettings] = useState(false)

  useEffect(() => {
    const stored = getConsentFromCookie()
    if (stored) {
      setConsent(stored)
      setHasResponded(true)
    } else {
      setHasResponded(false)
    }
  }, [])

  const updateConsent = useCallback((newConsent: Omit<ConsentState, 'necessary'>) => {
    const full: ConsentState = { necessary: true, ...newConsent }
    setConsent(full)
    setHasResponded(true)
    setConsentCookie(full)
    setOpenSettings(false)

    // Log to server (non-blocking)
    logConsentAction({
      statistics: full.statistics,
      marketing: full.marketing,
    }).catch(console.error)

    // Reload to activate/deactivate scripts
    window.location.reload()
  }, [])

  return (
    <ConsentContext value={{
      consent,
      hasResponded,
      updateConsent,
      openSettings,
      setOpenSettings,
    }}>
      {children}
    </ConsentContext>
  )
}

export function useConsent() {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider')
  return ctx
}
```

**Step 2: Commit**

```bash
git add components/consent/consent-provider.tsx
git commit -m "feat: ConsentProvider — React context for cookie consent state"
```

---

## Task 6: AnalyticsScripts — betinget GA4 + Meta pixel

**Files:**
- Create: `components/consent/analytics-scripts.tsx`

**Step 1: Opret AnalyticsScripts**

```tsx
'use client'

import Script from 'next/script'
import { useConsent } from './consent-provider'

export function AnalyticsScripts() {
  const { consent } = useConsent()

  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  return (
    <>
      {/* GA4 — only if statistics consent */}
      {consent?.statistics && ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel — only if marketing consent */}
      {consent?.marketing && metaPixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  )
}
```

**Step 2: Commit**

```bash
git add components/consent/analytics-scripts.tsx
git commit -m "feat: AnalyticsScripts — conditional GA4 + Meta pixel loading"
```

---

## Task 7: CookieBanner — UI komponent

**Files:**
- Create: `components/consent/cookie-banner.tsx`

**Step 1: Opret CookieBanner**

```tsx
'use client'

import Link from 'next/link'
import { useConsent } from './consent-provider'
import { Button } from '@/components/ui/button'

export function CookieBanner() {
  const { hasResponded, updateConsent, setOpenSettings } = useConsent()

  if (hasResponded) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white p-4 shadow-lg sm:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-sm text-foreground">
            Vi bruger cookies til statistik og markedsføring.{' '}
            <Link
              href="/cookiepolitik"
              className="underline underline-offset-2 hover:text-primary"
            >
              Læs vores cookiepolitik
            </Link>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenSettings(true)}
            className="order-3 sm:order-1"
          >
            Tilpas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConsent({ statistics: false, marketing: false })}
            className="order-2"
          >
            Kun nødvendige
          </Button>
          <Button
            size="sm"
            onClick={() => updateConsent({ statistics: true, marketing: true })}
            className="order-1 sm:order-3"
          >
            Acceptér alle
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/consent/cookie-banner.tsx
git commit -m "feat: CookieBanner — GDPR consent banner with three actions"
```

---

## Task 8: CookieModal — tilpas-dialog

**Files:**
- Create: `components/consent/cookie-modal.tsx`

**Step 1: Opret CookieModal**

```tsx
'use client'

import { useState } from 'react'
import { useConsent } from './consent-provider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function CookieModal() {
  const { consent, openSettings, setOpenSettings, updateConsent } = useConsent()
  const [statistics, setStatistics] = useState(consent?.statistics ?? false)
  const [marketing, setMarketing] = useState(consent?.marketing ?? false)

  return (
    <Dialog open={openSettings} onOpenChange={setOpenSettings}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cookieindstillinger</DialogTitle>
          <DialogDescription>
            Vælg hvilke cookies du vil tillade. Du kan altid ændre dine valg senere.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nødvendige */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="text-sm font-medium">Nødvendige</Label>
              <p className="text-xs text-muted-foreground">
                Session, login og fejlovervågning. Kan ikke deaktiveres.
              </p>
            </div>
            <Switch checked disabled />
          </div>

          {/* Statistik */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="statistics" className="text-sm font-medium">Statistik</Label>
              <p className="text-xs text-muted-foreground">
                Google Analytics — hjælper os med at forstå hvordan siden bruges.
              </p>
            </div>
            <Switch
              id="statistics"
              checked={statistics}
              onCheckedChange={setStatistics}
            />
          </div>

          {/* Marketing */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="marketing" className="text-sm font-medium">Marketing</Label>
              <p className="text-xs text-muted-foreground">
                Meta pixel — bruges til at vise relevante annoncer på Facebook og Instagram.
              </p>
            </div>
            <Switch
              id="marketing"
              checked={marketing}
              onCheckedChange={setMarketing}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => updateConsent({ statistics, marketing })}
          >
            Gem valg
          </Button>
          <Button
            onClick={() => updateConsent({ statistics: true, marketing: true })}
          >
            Acceptér alle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Commit**

```bash
git add components/consent/cookie-modal.tsx
git commit -m "feat: CookieModal — granular consent toggles per category"
```

---

## Task 9: Integration i root layout

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Wrap med ConsentProvider + tilføj AnalyticsScripts og CookieBanner**

Tilføj imports:

```tsx
import { ConsentProvider } from '@/components/consent/consent-provider'
import { AnalyticsScripts } from '@/components/consent/analytics-scripts'
import { CookieBanner } from '@/components/consent/cookie-banner'
import { CookieModal } from '@/components/consent/cookie-modal'
```

Wrap `<body>` indhold:

```tsx
<body className={`${inter.variable} ${dmSerif.variable} ${geistMono.variable} font-sans antialiased`}>
  <ConsentProvider>
    <AnalyticsScripts />
    <Topbar />
    <main className="min-h-screen">
      {children}
    </main>
    <Footer />
    <Toaster />
    <CookieBanner />
    <CookieModal />
  </ConsentProvider>
</body>
```

**Step 2: Verificer build**

Run: `npx next build`
Expected: Compiled successfully.

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: integrate consent provider, analytics, banner, and modal in root layout"
```

---

## Task 10: Footer — juridiske links + cookieindstillinger

**Files:**
- Modify: `components/layout/footer.tsx`

**Step 1: Tilføj Juridisk kolonne og cookieindstillinger-knap**

Tilføj import:

```tsx
import { useConsent } from '@/components/consent/consent-provider'
```

I Footer-funktionen, tilføj:

```tsx
const { setOpenSettings } = useConsent()
```

Erstat det eksisterende grid med 4 kolonner. Tilføj ny kolonne efter "Kontakt":

```tsx
{/* Juridisk */}
<div>
  <h4 className="mb-3 text-sm font-semibold text-white">Juridisk</h4>
  <ul className="space-y-2.5 text-sm">
    <li>
      <Link href="/privatlivspolitik" className="transition-colors hover:text-white">
        Privatlivspolitik
      </Link>
    </li>
    <li>
      <Link href="/cookiepolitik" className="transition-colors hover:text-white">
        Cookiepolitik
      </Link>
    </li>
    <li>
      <Link href="/vilkaar" className="transition-colors hover:text-white">
        Vilkår
      </Link>
    </li>
    <li>
      <button
        onClick={() => setOpenSettings(true)}
        className="transition-colors hover:text-white"
      >
        Cookieindstillinger
      </button>
    </li>
  </ul>
</div>
```

Opdater grid fra `sm:grid-cols-3` til `sm:grid-cols-4`.

**Step 2: Verificer build**

Run: `npx next build`
Expected: Compiled successfully.

**Step 3: Commit**

```bash
git add components/layout/footer.tsx
git commit -m "feat: footer — legal links and cookie settings trigger"
```

---

## Task 11: Privatlivspolitik-side

**Files:**
- Create: `app/privatlivspolitik/page.tsx`

**Step 1: Opret privatlivspolitik**

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privatlivspolitik — FamilyMind',
}

export default function PrivatlivspolitikPage() {
  return (
    <div className="px-4 py-16 sm:px-8">
      <div className="prose prose-sm mx-auto max-w-3xl">
        <h1 className="font-serif">Privatlivspolitik</h1>
        <p className="text-sm text-muted-foreground">Sidst opdateret: [INDSÆT DATO]</p>

        <h2>1. Dataansvarlig</h2>
        <p>
          [INDSÆT FIRMANAVN]<br />
          CVR: [INDSÆT CVR]<br />
          [INDSÆT ADRESSE]<br />
          E-mail: <a href="mailto:[INDSÆT EMAIL]">[INDSÆT EMAIL]</a>
        </p>

        <h2>2. Hvilke personoplysninger indsamler vi?</h2>
        <p>Vi indsamler følgende oplysninger om dig:</p>
        <ul>
          <li><strong>Kontaktoplysninger:</strong> Navn og e-mailadresse (ved oprettelse af konto)</li>
          <li><strong>Profildata:</strong> Onboarding-svar, barnets alder, udfordringer</li>
          <li><strong>Brugsdata:</strong> Kursusfremdrift, gennemførte lektioner, journey check-ins</li>
          <li><strong>Betalingsdata:</strong> Behandles af Stripe — vi gemmer ikke kortoplysninger</li>
          <li><strong>Tekniske data:</strong> IP-adresse (hashed), fejlrapporter via Sentry</li>
          <li><strong>Cookies:</strong> Se vores <a href="/cookiepolitik">cookiepolitik</a></li>
        </ul>

        <h2>3. Formål og retsgrundlag</h2>
        <table>
          <thead>
            <tr><th>Formål</th><th>Retsgrundlag</th></tr>
          </thead>
          <tbody>
            <tr><td>Levering af tjenesten (konto, indhold, kurser)</td><td>Kontraktopfyldelse (art. 6.1.b)</td></tr>
            <tr><td>Betalingshåndtering via Stripe</td><td>Kontraktopfyldelse (art. 6.1.b)</td></tr>
            <tr><td>E-mailnotifikationer (forløb, milestones)</td><td>Legitim interesse (art. 6.1.f)</td></tr>
            <tr><td>Fejlovervågning via Sentry</td><td>Legitim interesse (art. 6.1.f)</td></tr>
            <tr><td>Statistik via Google Analytics</td><td>Samtykke (art. 6.1.a)</td></tr>
            <tr><td>Markedsføring via Meta pixel</td><td>Samtykke (art. 6.1.a)</td></tr>
          </tbody>
        </table>

        <h2>4. Databehandlere</h2>
        <ul>
          <li><strong>Supabase</strong> (EU) — database og autentificering</li>
          <li><strong>Stripe</strong> (USA, EU SCC) — betalingshåndtering</li>
          <li><strong>Resend</strong> (USA, EU SCC) — transaktionelle e-mails</li>
          <li><strong>Bunny.net</strong> (EU) — videohosting</li>
          <li><strong>Sentry</strong> (USA, EU SCC) — fejlovervågning</li>
          <li><strong>Vercel</strong> (USA, EU SCC) — hosting</li>
          <li><strong>Google</strong> (USA, EU SCC) — Analytics (kun med samtykke)</li>
          <li><strong>Meta</strong> (USA, EU SCC) — pixel tracking (kun med samtykke)</li>
        </ul>

        <h2>5. Opbevaringsperiode</h2>
        <ul>
          <li>Kontodata: Så længe kontoen er aktiv + 30 dage efter sletning</li>
          <li>Betalingsdata: 5 år (bogføringsloven)</li>
          <li>Samtykke-log: 2 år efter seneste samtykke</li>
          <li>Sentry-fejldata: 90 dage</li>
        </ul>

        <h2>6. Dine rettigheder</h2>
        <p>Du har ret til:</p>
        <ul>
          <li><strong>Indsigt</strong> — se hvilke data vi har om dig</li>
          <li><strong>Berigtigelse</strong> — rette forkerte oplysninger</li>
          <li><strong>Sletning</strong> — få dine data slettet</li>
          <li><strong>Dataportabilitet</strong> — modtage dine data i maskinlæsbart format</li>
          <li><strong>Tilbagetrækning af samtykke</strong> — via <a href="/cookiepolitik">cookieindstillinger</a></li>
          <li><strong>Klage</strong> — til Datatilsynet (datatilsynet.dk)</li>
        </ul>
        <p>Kontakt os på <a href="mailto:[INDSÆT EMAIL]">[INDSÆT EMAIL]</a> for at udøve dine rettigheder.</p>

        <h2>7. Sikkerhed</h2>
        <p>
          Vi anvender kryptering (HTTPS/TLS), adgangskontrol og EU-baseret infrastruktur
          for at beskytte dine data. Betalingsoplysninger håndteres udelukkende af Stripe
          (PCI DSS-certificeret).
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/privatlivspolitik/
git commit -m "feat: privatlivspolitik page — GDPR privacy policy template"
```

---

## Task 12: Cookiepolitik-side

**Files:**
- Create: `app/cookiepolitik/page.tsx`

**Step 1: Opret cookiepolitik**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookiepolitik — FamilyMind',
}

export default function CookiepolitikPage() {
  return (
    <div className="px-4 py-16 sm:px-8">
      <div className="prose prose-sm mx-auto max-w-3xl">
        <h1 className="font-serif">Cookiepolitik</h1>
        <p className="text-sm text-muted-foreground">Sidst opdateret: [INDSÆT DATO]</p>

        <p>
          Denne side forklarer hvilke cookies vi bruger og hvorfor.
          Du kan til enhver tid ændre dine valg via{' '}
          <Link href="#" className="underline">cookieindstillinger</Link>.
        </p>

        <h2>Hvad er cookies?</h2>
        <p>
          Cookies er små tekstfiler der gemmes i din browser. De bruges til at huske
          dine indstillinger, holde dig logget ind, og til at forstå hvordan vores
          side bruges.
        </p>

        <h2>Nødvendige cookies</h2>
        <p>Disse cookies er nødvendige for at siden fungerer. De kan ikke deaktiveres.</p>
        <table>
          <thead>
            <tr><th>Navn</th><th>Formål</th><th>Udløb</th><th>Udbyder</th></tr>
          </thead>
          <tbody>
            <tr><td>sb-*-auth-token</td><td>Login-session</td><td>Session</td><td>Supabase</td></tr>
            <tr><td>cookie_consent</td><td>Gemmer dine cookievalg</td><td>12 måneder</td><td>FamilyMind</td></tr>
          </tbody>
        </table>

        <h2>Statistik-cookies</h2>
        <p>Disse cookies hjælper os med at forstå hvordan besøgende bruger siden. Kræver dit samtykke.</p>
        <table>
          <thead>
            <tr><th>Navn</th><th>Formål</th><th>Udløb</th><th>Udbyder</th></tr>
          </thead>
          <tbody>
            <tr><td>_ga</td><td>Skelner mellem brugere</td><td>2 år</td><td>Google Analytics</td></tr>
            <tr><td>_ga_*</td><td>Sessionsdata</td><td>2 år</td><td>Google Analytics</td></tr>
          </tbody>
        </table>

        <h2>Marketing-cookies</h2>
        <p>Disse cookies bruges til at vise relevante annoncer. Kræver dit samtykke.</p>
        <table>
          <thead>
            <tr><th>Navn</th><th>Formål</th><th>Udløb</th><th>Udbyder</th></tr>
          </thead>
          <tbody>
            <tr><td>_fbp</td><td>Identificerer browseren for annoncering</td><td>3 måneder</td><td>Meta (Facebook)</td></tr>
            <tr><td>_fbc</td><td>Sporer klik fra Facebook-annoncer</td><td>3 måneder</td><td>Meta (Facebook)</td></tr>
          </tbody>
        </table>

        <h2>Administrer dine valg</h2>
        <p>
          Du kan til enhver tid ændre eller trække dit samtykke tilbage.
          Brug knappen herunder eller linket "Cookieindstillinger" i sidefoden.
        </p>
        <p>
          Du kan også slette cookies i din browsers indstillinger.
          Se vejledning for{' '}
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>,{' '}
          <a href="https://support.mozilla.org/da/kb/delete-cookies-remove-info-websites-stored" target="_blank" rel="noopener noreferrer">Firefox</a>,{' '}
          <a href="https://support.apple.com/da-dk/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>.
        </p>

        <h2>Kontakt</h2>
        <p>
          Har du spørgsmål om vores brug af cookies, kontakt os på{' '}
          <a href="mailto:[INDSÆT EMAIL]">[INDSÆT EMAIL]</a>.
        </p>
        <p>
          Se også vores <Link href="/privatlivspolitik">privatlivspolitik</Link>.
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/cookiepolitik/
git commit -m "feat: cookiepolitik page — cookie categories and detailed cookie list"
```

---

## Task 13: Vilkår-side

**Files:**
- Create: `app/vilkaar/page.tsx`

**Step 1: Opret vilkår**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vilkår — FamilyMind',
}

export default function VilkaarPage() {
  return (
    <div className="px-4 py-16 sm:px-8">
      <div className="prose prose-sm mx-auto max-w-3xl">
        <h1 className="font-serif">Vilkår og betingelser</h1>
        <p className="text-sm text-muted-foreground">Sidst opdateret: [INDSÆT DATO]</p>

        <h2>1. Generelt</h2>
        <p>
          Disse vilkår gælder for din brug af FamilyMind-platformen ("Tjenesten"),
          der drives af [INDSÆT FIRMANAVN], CVR [INDSÆT CVR].
        </p>
        <p>
          Ved at oprette en konto eller bruge Tjenesten accepterer du disse vilkår.
        </p>

        <h2>2. Tjenesten</h2>
        <p>
          FamilyMind er en digital platform med kurser, guidede forløb og
          indhold om børneopdragelse og familieliv. Indholdet er vejledende
          og erstatter ikke professionel rådgivning.
        </p>

        <h2>3. Konto</h2>
        <ul>
          <li>Du skal være mindst 18 år for at oprette en konto.</li>
          <li>Du er ansvarlig for at holde dine loginoplysninger sikre.</li>
          <li>Én konto per person.</li>
        </ul>

        <h2>4. Abonnement og betaling</h2>
        <ul>
          <li>Abonnementet koster 149 DKK/md og fornys automatisk.</li>
          <li>Betaling sker via Stripe. Vi gemmer ikke dine kortoplysninger.</li>
          <li>Du kan opsige til enhver tid — adgang fortsætter til periodens udløb.</li>
          <li>Enkelt-køb af kurser giver permanent adgang.</li>
        </ul>

        <h2>5. Fortrydelsesret</h2>
        <p>
          Du har 14 dages fortrydelsesret fra købstidspunktet, medmindre du har
          påbegyndt brugen af digitalt indhold. Ved accept af straks-levering af
          digitalt indhold frafalder du fortrydelsesretten.
        </p>

        <h2>6. Intellektuel ejendomsret</h2>
        <p>
          Alt indhold på platformen (videoer, tekster, øvelser) er ophavsretligt
          beskyttet. Du må ikke kopiere, distribuere eller videresælge indholdet.
        </p>

        <h2>7. Brugeradfærd</h2>
        <p>Du må ikke:</p>
        <ul>
          <li>Dele din konto med andre</li>
          <li>Poste krænkende eller ulovligt indhold i fællesskabet</li>
          <li>Forsøge at omgå betalingssystemet</li>
        </ul>

        <h2>8. Ansvarsbegrænsning</h2>
        <p>
          FamilyMind leverer indhold til vejledende brug. Vi påtager os ikke ansvar
          for konsekvenser af at følge råd fra platformen. Søg altid professionel
          hjælp ved alvorlige udfordringer.
        </p>

        <h2>9. Ændringer</h2>
        <p>
          Vi kan ændre disse vilkår med 30 dages varsel via e-mail. Fortsat brug
          efter ændringsperioden udgør accept af de nye vilkår.
        </p>

        <h2>10. Kontakt og klager</h2>
        <p>
          Kontakt: <a href="mailto:[INDSÆT EMAIL]">[INDSÆT EMAIL]</a><br />
          Se også vores <Link href="/privatlivspolitik">privatlivspolitik</Link>.
        </p>

        <h2>11. Lovvalg</h2>
        <p>
          Disse vilkår er underlagt dansk ret. Tvister afgøres ved de danske domstole.
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/vilkaar/
git commit -m "feat: vilkår page — terms and conditions template"
```

---

## Verifikation

After all tasks are complete:

1. **Build**: `npx next build` — ingen compile errors
2. **DB sync**: `npx prisma db push` — CookieConsent tabel oprettet
3. **Consent flow**: Åbn siden → banner vises → klik "Acceptér alle" → banner forsvinder, reload, ingen banner
4. **Tilpas**: Klik "Tilpas" → modal med toggles → gem valg → cookie opdateret
5. **Scripts**: Med statistik-samtykke → GA4 script loaded (check Network tab)
6. **Scripts**: Med marketing-samtykke → Meta pixel loaded (check Network tab)
7. **Scripts**: Uden samtykke → ingen tracking scripts loaded
8. **Footer**: Links til /privatlivspolitik, /cookiepolitik, /vilkaar + "Cookieindstillinger" knap
9. **Juridiske sider**: Alle tre sider renderer korrekt med placeholder-markers
10. **Consent-log**: Check database → `CookieConsent` tabel har entry efter samtykke
11. **Cookie**: Inspect browser → `cookie_consent` cookie med korrekt JSON

---

## Hvad denne plan IKKE inkluderer (bevidst)

- **Google Consent Mode v2** — kan tilføjes senere for bedre GA4 integration
- **Cookie expiry renewal** — consent fornys kun ved aktivt nyt valg, ikke automatisk
- **Cookiepolitik "Cookieindstillinger" knap** — linket i cookiepolitik-teksten er statisk; kan kobles til modal med en client component wrapper senere
- **GDPR data export / deletion** — separat feature, allerede noteret i production readiness plan
- **Help mode / training layer** — separat feature, brainstormed i denne session
