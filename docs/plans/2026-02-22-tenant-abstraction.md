# Tenant-abstraktion — Implementeringsplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Gør platformen white-label-klar. Al brand-specifik tekst, farver, logo og marketing-indhold skal drives af en tenant-konfiguration i databasen, så nye kunder kan starte med deres eget brand uden kodeændringer.

**Architecture:** Udvid `Organization`-modellen med brand- og content-felter. Opret en `getTenantConfig()` helper der resolver aktuel tenant (fra env var nu, fra domain/subdomain senere). Alle komponenter og sider læser brand-data fra tenant config i stedet for hardcodede strenge. Landing page, auth-sider, topbar, footer, emails og metadata bliver alle tenant-aware.

**Tech Stack:** Prisma 6 (schema migration), Next.js 16 server components, CSS custom properties for dynamisk theming, eksisterende `SiteSetting`-mønster som reference.

**Scope:** 80+ hardcodede strenge i 25+ filer skal flyttes til tenant config. Ingen multi-database — alle tenants deler samme DB (data allerede isoleret via `organizationId`).

---

## Oversigt

| Task | Beskrivelse | Filer |
|------|-------------|-------|
| 1 | Udvid Organization-modellen med brand-felter | `prisma/schema.prisma` |
| 2 | Opret tenant config service + types | `lib/tenant.ts`, `lib/services/tenant.service.ts` |
| 3 | Seed FamilyMind som default tenant | `prisma/seed.ts` |
| 4 | Dynamisk CSS theming fra tenant config | `app/layout.tsx`, `components/layout/theme-provider.tsx` |
| 5 | Tenant-aware topbar + footer | `components/layout/topbar.tsx`, `components/layout/footer.tsx` |
| 6 | Tenant-aware auth-sider (login/signup) | `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx` |
| 7 | Tenant-aware landing page | `app/page.tsx` |
| 8 | Tenant-aware dashboard, browse, subscribe, onboarding | Diverse sider |
| 9 | Tenant-aware admin layout + metadata | `app/admin/layout.tsx`, `app/layout.tsx` |
| 10 | Tenant-aware emails | `emails/layout.tsx`, `lib/services/engagement.service.ts` |
| 11 | Admin UI til tenant-branding | `app/admin/settings/branding/page.tsx` |

---

## Task 1: Udvid Organization-modellen

**Files:**
- Modify: `prisma/schema.prisma` (model Organization, linje 141-149)

**Step 1: Tilføj brand-felter til Organization**

Tilføj disse felter til `model Organization`:

```prisma
model Organization {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // ── Brand ──
  brandName       String    // Vist overalt (topbar, footer, emails)
  tagline         String?   // Kort slogan under logo
  description     String?   // SEO meta description
  logoUrl         String?   // URL til logo (SVG/PNG)
  faviconUrl      String?   // URL til favicon
  websiteUrl      String?   // Link til hovedsite (footer)

  // ── Farver (hex) ──
  colorPrimary         String  @default("#86A0A6")
  colorPrimaryForeground String @default("#1A1A1A")
  colorAccent          String  @default("#E8715A")
  colorSuccess         String  @default("#2A6B5A")
  colorBackground      String  @default("#FAFAF8")
  colorSand            String  @default("#F5F0EB")
  colorForeground      String  @default("#1A1A1A")
  colorBorder          String  @default("#E8E4DF")

  // ── Kontakt ──
  contactEmail    String?
  contactPhone    String?
  contactUrl      String?   // F.eks. mettehummel.dk

  // ── Email ──
  emailFromName   String?   // "FamilyMind" eller kundens navn
  emailFromEmail  String?   // noreply@familymind.dk

  // ── Landing page ──
  heroHeading     String?   // "Giv dit barn den bedste start"
  heroSubheading  String?   // "Din strukturerede vej til..."
  heroCtaText     String?   // "Prøv gratis"
  heroCtaUrl      String?   // "/signup"

  // ── "Om" sektion ──
  aboutHeading    String?   // "Bag FamilyMind"
  aboutName       String?   // "Mette Hummel"
  aboutBio        String?   // Bio-tekst
  aboutUrl        String?   // Link til profil
  aboutImageUrl   String?   // Billede af grundlægger

  // ── Landing page JSON-felter (fleksible) ──
  landingBenefits   Json?   // ["benefit1", "benefit2", ...]
  landingSteps      Json?   // [{title, description, icon}, ...]
  landingFeatures   Json?   // [{title, description, icon}, ...]
  landingTestimonials Json? // [{name, quote, stars}, ...]
  landingFaq        Json?   // [{question, answer}, ...]

  // ── Priser (display-tekst) ──
  subscriptionPriceDisplay String? // "149 kr"
  subscriptionPeriodDisplay String? // "/måned"

  // ── Footer ──
  footerCopyright  String?  // "© 2026 FamilyMind"
  footerLinks      Json?    // [{label, url}, ...]

  // ── Relations ──
  users        User[]
  entitlements Entitlement[]
}
```

Tilføj også `updatedAt` feltet (mangler i nuværende model).

**Step 2: Kør migration**

```bash
npx prisma migrate dev --name add-tenant-branding
```

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add tenant branding fields to Organization model"
```

---

## Task 2: Opret tenant config service + types

**Files:**
- Create: `lib/tenant.ts`
- Create: `lib/services/tenant.service.ts`

**Step 1: Opret TypeScript types**

Opret `lib/tenant.ts`:

```typescript
export type TenantConfig = {
  id: string
  slug: string

  // Brand
  brandName: string
  tagline: string | null
  description: string | null
  logoUrl: string | null
  faviconUrl: string | null
  websiteUrl: string | null

  // Farver
  colorPrimary: string
  colorPrimaryForeground: string
  colorAccent: string
  colorSuccess: string
  colorBackground: string
  colorSand: string
  colorForeground: string
  colorBorder: string

  // Kontakt
  contactEmail: string | null
  contactPhone: string | null
  contactUrl: string | null

  // Email
  emailFromName: string | null
  emailFromEmail: string | null

  // Landing page
  heroHeading: string | null
  heroSubheading: string | null
  heroCtaText: string | null
  heroCtaUrl: string | null

  // Om
  aboutHeading: string | null
  aboutName: string | null
  aboutBio: string | null
  aboutUrl: string | null
  aboutImageUrl: string | null

  // Landing page JSON
  landingBenefits: string[] | null
  landingSteps: { title: string; description: string; icon: string }[] | null
  landingFeatures: { title: string; description: string; icon: string }[] | null
  landingTestimonials: { name: string; quote: string; stars: number }[] | null
  landingFaq: { question: string; answer: string }[] | null

  // Priser
  subscriptionPriceDisplay: string | null
  subscriptionPeriodDisplay: string | null

  // Footer
  footerCopyright: string | null
  footerLinks: { label: string; url: string }[] | null
}
```

**Step 2: Opret tenant service**

Opret `lib/services/tenant.service.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { cache } from 'react'
import type { TenantConfig } from '@/lib/tenant'

/**
 * Hent tenant config for den aktuelle organisation.
 *
 * Fase 1: Resolver fra TENANT_SLUG env var (single-tenant deploy).
 * Fase 2 (fremtid): Resolver fra request hostname/subdomain.
 *
 * Cached per request via React cache().
 */
export const getTenantConfig = cache(async (): Promise<TenantConfig> => {
  const slug = process.env.TENANT_SLUG || 'familymind'

  const org = await prisma.organization.findUnique({
    where: { slug },
  })

  if (!org) {
    throw new Error(`Tenant "${slug}" not found. Run prisma db seed.`)
  }

  return {
    id: org.id,
    slug: org.slug,
    brandName: org.brandName,
    tagline: org.tagline,
    description: org.description,
    logoUrl: org.logoUrl,
    faviconUrl: org.faviconUrl,
    websiteUrl: org.websiteUrl,

    colorPrimary: org.colorPrimary,
    colorPrimaryForeground: org.colorPrimaryForeground,
    colorAccent: org.colorAccent,
    colorSuccess: org.colorSuccess,
    colorBackground: org.colorBackground,
    colorSand: org.colorSand,
    colorForeground: org.colorForeground,
    colorBorder: org.colorBorder,

    contactEmail: org.contactEmail,
    contactPhone: org.contactPhone,
    contactUrl: org.contactUrl,

    emailFromName: org.emailFromName,
    emailFromEmail: org.emailFromEmail,

    heroHeading: org.heroHeading,
    heroSubheading: org.heroSubheading,
    heroCtaText: org.heroCtaText,
    heroCtaUrl: org.heroCtaUrl,

    aboutHeading: org.aboutHeading,
    aboutName: org.aboutName,
    aboutBio: org.aboutBio,
    aboutUrl: org.aboutUrl,
    aboutImageUrl: org.aboutImageUrl,

    landingBenefits: org.landingBenefits as string[] | null,
    landingSteps: org.landingSteps as TenantConfig['landingSteps'],
    landingFeatures: org.landingFeatures as TenantConfig['landingFeatures'],
    landingTestimonials: org.landingTestimonials as TenantConfig['landingTestimonials'],
    landingFaq: org.landingFaq as TenantConfig['landingFaq'],

    subscriptionPriceDisplay: org.subscriptionPriceDisplay,
    subscriptionPeriodDisplay: org.subscriptionPeriodDisplay,

    footerCopyright: org.footerCopyright,
    footerLinks: org.footerLinks as TenantConfig['footerLinks'],
  }
})
```

**Step 3: Tilføj TENANT_SLUG til .env**

Tilføj til `.env.local`:
```
TENANT_SLUG=familymind
```

**Step 4: Commit**

```bash
git add lib/tenant.ts lib/services/tenant.service.ts
git commit -m "feat: add tenant config service with typed config"
```

---

## Task 3: Seed FamilyMind som default tenant

**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Tilføj FamilyMind tenant-data til seed**

Tilføj i starten af `main()` funktionen (før check-in options):

```typescript
// -- Default Organization: FamilyMind --
await prisma.organization.upsert({
  where: { slug: 'familymind' },
  update: {},
  create: {
    name: 'FamilyMind',
    slug: 'familymind',
    brandName: 'FamilyMind',
    tagline: 'Din strukturerede forældreguide',
    description: 'Evidensbaseret viden og praktiske værktøjer til hele familien.',
    websiteUrl: 'https://mettehummel.dk',
    colorPrimary: '#86A0A6',
    colorPrimaryForeground: '#1A1A1A',
    colorAccent: '#E8715A',
    colorSuccess: '#2A6B5A',
    colorBackground: '#FAFAF8',
    colorSand: '#F5F0EB',
    colorForeground: '#1A1A1A',
    colorBorder: '#E8E4DF',
    contactUrl: 'https://mettehummel.dk',
    emailFromName: 'FamilyMind',
    emailFromEmail: 'noreply@familymind.dk',
    heroHeading: 'Giv dit barn den bedste start',
    heroSubheading: 'Din strukturerede vej til et trygt og kærligt forældreskab — med viden der virker og værktøjer du kan bruge i dag.',
    heroCtaText: 'Prøv gratis',
    heroCtaUrl: '/signup',
    aboutHeading: 'Bag FamilyMind',
    aboutName: 'Mette Hummel',
    aboutBio: 'Mette er familieterapeut med mange års erfaring i at hjælpe forældre. FamilyMind er bygget på hendes evidensbaserede metoder og den nyeste forskning i børnepsykologi.',
    aboutUrl: 'https://mettehummel.dk',
    subscriptionPriceDisplay: '149 kr',
    subscriptionPeriodDisplay: '/måned',
    footerCopyright: 'FamilyMind. Alle rettigheder forbeholdes.',
    landingBenefits: JSON.stringify([
      'Alle strukturerede forløb',
      'Videokurser og artikler',
      'Daglige øvelser og refleksion',
      'Check-ins og fremgangssporing',
      'Personlige anbefalinger',
      'Adgang til fællesskabet',
    ]),
    landingSteps: JSON.stringify([
      {
        title: 'Opret din profil',
        description: 'Fortæl os lidt om din familie, så vi kan tilpasse indholdet til jeres behov.',
        icon: 'UserPlus',
      },
      {
        title: 'Vælg dit forløb',
        description: 'Få en personlig anbefaling baseret på din situation, eller udforsk alle forløb.',
        icon: 'Compass',
      },
      {
        title: 'Voks dag for dag',
        description: 'Følg dit forløb med video, øvelser og daglige refleksioner i dit eget tempo.',
        icon: 'TrendingUp',
      },
    ]),
    landingFeatures: JSON.stringify([
      {
        title: 'Strukturerede forløb',
        description: 'Dag-for-dag programmer udviklet af fagfolk. Hver dag har video, øvelse og refleksion.',
        icon: 'BookOpen',
      },
      {
        title: 'Videokurser',
        description: 'Korte, praktiske videoer du kan se når det passer dig. Nye kurser tilføjes løbende.',
        icon: 'Video',
      },
      {
        title: 'Fællesskab',
        description: 'Del erfaringer med andre forældre på samme rejse. Moderet af fagfolk.',
        icon: 'Users',
      },
    ]),
    landingTestimonials: JSON.stringify([
      {
        name: 'Anna M.',
        quote: 'FamilyMind har givet os en helt ny måde at håndtere konflikter på. Vores aftener er blevet meget roligere.',
        stars: 5,
      },
      {
        name: 'Lars P.',
        quote: 'Endelig en forældreguide der ikke dømmer. Det føles som at have en terapeut i lommen.',
        stars: 5,
      },
      {
        name: 'Sofie K.',
        quote: 'Forløbene er geniale. Små bidder hver dag — det er overkommeligt selv når hverdagen er kaotisk.',
        stars: 5,
      },
    ]),
    landingFaq: JSON.stringify([
      {
        question: 'Hvem er platformen for?',
        answer: 'Platformen er for alle forældre der ønsker at styrke relationen til deres børn — uanset om du har specifikke udfordringer eller bare vil blive bedre.',
      },
      {
        question: 'Hvad koster det?',
        answer: 'Abonnementet koster 149 kr/md og giver adgang til alt indhold. Ingen binding — afmeld når som helst.',
      },
      {
        question: 'Er indholdet evidensbaseret?',
        answer: 'Ja, alt indhold er udviklet af autoriserede terapeuter og bygger på den nyeste forskning i børnepsykologi og familieterapi.',
      },
      {
        question: 'Kan jeg prøve gratis?',
        answer: 'Ja, du kan oprette en profil og se udvalgt gratis indhold. Du betaler først når du er klar.',
      },
      {
        question: 'Hvad er et forløb?',
        answer: 'Et forløb er et struktureret program med daglige trin — video, øvelse og refleksion. Typisk 14-30 dage.',
      },
    ]),
  },
})
```

**Step 2: Kør seed**

```bash
npx prisma db seed
```

**Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed FamilyMind as default tenant with full branding config"
```

---

## Task 4: Dynamisk CSS theming fra tenant config

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css` (fjern hardcodede farveværdier fra :root)

**Step 1: Gør layout.tsx tenant-aware**

I `app/layout.tsx`, hent tenant config og injicer farver som inline CSS custom properties på `<html>`:

```typescript
import { getTenantConfig } from '@/lib/services/tenant.service'

// ... eksisterende imports ...

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantConfig()

  const themeVars = {
    '--primary': tenant.colorPrimary,
    '--primary-foreground': tenant.colorPrimaryForeground,
    '--accent': tenant.colorAccent,
    '--background': tenant.colorBackground,
    '--foreground': tenant.colorForeground,
    '--border': tenant.colorBorder,
    '--input': tenant.colorBorder,
    '--ring': tenant.colorPrimary,
    '--color-sand': tenant.colorSand,
    '--color-success': tenant.colorSuccess,
    '--chart-1': tenant.colorPrimary,
    '--sidebar-primary': tenant.colorPrimary,
    '--sidebar-ring': tenant.colorPrimary,
  } as React.CSSProperties

  return (
    <html lang="da" style={themeVars}>
      ...
    </html>
  )
}
```

Dynamisk metadata:

```typescript
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantConfig()
  return {
    title: tenant.brandName,
    description: tenant.description || tenant.tagline || '',
  }
}
```

**Step 2: Fjern hardcodede farver i :root i globals.css**

Behold `:root` med fallback-værdier, men de vil blive overskrevet af inline styles fra layout. Kommentér tydelig at de er fallbacks:

```css
:root {
  --radius: 0.75rem;
  /* Fallback values — overridden by tenant config in layout.tsx */
  --background: #FAFAF8;
  --foreground: #1A1A1A;
  ...
}
```

**Step 3: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: dynamic CSS theming from tenant config"
```

---

## Task 5: Tenant-aware topbar + footer

**Files:**
- Modify: `components/layout/topbar.tsx`
- Modify: `components/layout/footer.tsx`

**Step 1: Opret server wrapper-komponenter**

Fordi topbar og footer er client components (bruger `usePathname`), opret server wrappers der henter tenant config og sender som props.

Opret `components/layout/topbar-wrapper.tsx`:

```typescript
import { getTenantConfig } from '@/lib/services/tenant.service'
import { Topbar } from './topbar'

export async function TopbarWrapper() {
  const tenant = await getTenantConfig()
  return (
    <Topbar
      brandName={tenant.brandName}
      logoUrl={tenant.logoUrl}
    />
  )
}
```

Opret `components/layout/footer-wrapper.tsx`:

```typescript
import { getTenantConfig } from '@/lib/services/tenant.service'
import { Footer } from './footer'

export async function FooterWrapper() {
  const tenant = await getTenantConfig()
  return (
    <Footer
      brandName={tenant.brandName}
      tagline={tenant.tagline}
      description={tenant.description}
      contactUrl={tenant.contactUrl}
      footerCopyright={tenant.footerCopyright}
      footerLinks={tenant.footerLinks}
    />
  )
}
```

**Step 2: Opdater Topbar og Footer til at modtage props**

I `topbar.tsx`, erstat hardcodet "FamilyMind" med `brandName` prop. I `footer.tsx`, erstat alle hardcodede strenge med props.

**Step 3: Opdater layout.tsx**

Erstat `<Topbar />` med `<TopbarWrapper />` og `<Footer />` med `<FooterWrapper />`.

**Step 4: Commit**

```bash
git add components/layout/ app/layout.tsx
git commit -m "feat: tenant-aware topbar and footer via server wrappers"
```

---

## Task 6: Tenant-aware auth-sider

**Files:**
- Modify: `app/(auth)/login/page.tsx`
- Modify: `app/(auth)/signup/page.tsx`

**Step 1: Hent tenant config i login/signup**

Begge sider er server components. Tilføj `getTenantConfig()` og erstat:
- "FamilyMind" → `tenant.brandName`
- "Log ind på din FamilyMind konto" → `Log ind på din ${tenant.brandName} konto`
- "Kom i gang med FamilyMind" → `Kom i gang med ${tenant.brandName}`

**Step 2: Commit**

```bash
git add app/(auth)/
git commit -m "feat: tenant-aware login and signup pages"
```

---

## Task 7: Tenant-aware landing page

**Files:**
- Modify: `app/page.tsx`

Denne er den mest omfattende opgave — hele landing page er hardcodet.

**Step 1: Hent tenant config**

Tilføj `const tenant = await getTenantConfig()` øverst.

**Step 2: Erstat alle hardcodede sektioner**

- Hero: `tenant.heroHeading`, `tenant.heroSubheading`, `tenant.heroCtaText`
- Sociale proof: Brug `tenant.landingTestimonials?.[0]?.quote` for den indledende quote
- Tre trin: Map over `tenant.landingSteps`
- Features: Map over `tenant.landingFeatures`
- Testimonials: Map over `tenant.landingTestimonials`
- Priser: `tenant.subscriptionPriceDisplay`, `tenant.subscriptionPeriodDisplay`, `tenant.landingBenefits`
- Om sektionen: `tenant.aboutHeading`, `tenant.aboutName`, `tenant.aboutBio`, `tenant.aboutUrl`
- FAQ: Map over `tenant.landingFaq`
- CTA-knap tekst: `tenant.heroCtaText`

**Step 3: Håndter null-felter**

Hvis en sektion er null (f.eks. `tenant.landingTestimonials === null`), vis ikke sektionen. Brug conditional rendering:

```tsx
{tenant.landingTestimonials && tenant.landingTestimonials.length > 0 && (
  <section>...</section>
)}
```

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: fully tenant-driven landing page"
```

---

## Task 8: Tenant-aware dashboard, browse, subscribe, onboarding

**Files:**
- Modify: `app/dashboard/page.tsx` — erstat "FamilyMind" logo og default welcome-message
- Modify: `app/dashboard/settings/page.tsx` — erstat "FamilyMind-abonnement" tekst
- Modify: `app/browse/page.tsx` — erstat metadata title "FamilyMind"
- Modify: `app/subscribe/page.tsx` — erstat "FamilyMind Abonnement", hardcodet "149 kr"
- Modify: `app/onboarding/_components/onboarding-wizard.tsx` — erstat "FamilyMind" logo
- Modify: `app/content/[slug]/page.tsx` — erstat "149 kr/md" i gated CTA
- Modify: `app/not-found.tsx` — ingen brand-reference, men bekræft

**Step 1: Dashboard**

Hent `tenant` i server component. Erstat logo-tekst og default welcome.

**Step 2: Subscribe**

Erstat "FamilyMind Abonnement" → `${tenant.brandName} Abonnement`, "149 kr" → `tenant.subscriptionPriceDisplay`.

**Step 3: Browse**

Opdater metadata title.

**Step 4: Onboarding**

Onboarding wizard er en client component. Send `brandName` som prop fra server parent (`app/onboarding/page.tsx`).

**Step 5: Content gated CTA**

Erstat "149 kr/md" med `tenant.subscriptionPriceDisplay + " " + tenant.subscriptionPeriodDisplay`.

Da content page er server component, hent tenant config direkte.

**Step 6: Commit**

```bash
git add app/dashboard/ app/browse/ app/subscribe/ app/onboarding/ app/content/
git commit -m "feat: tenant-aware dashboard, browse, subscribe, onboarding, content pages"
```

---

## Task 9: Tenant-aware admin layout + metadata

**Files:**
- Modify: `app/admin/layout.tsx`

**Step 1: Erstat hardcodet "FamilyMind Admin"**

Hent tenant config og brug `tenant.brandName` i sidebar logo.

**Step 2: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat: tenant-aware admin sidebar"
```

---

## Task 10: Tenant-aware emails

**Files:**
- Modify: `emails/layout.tsx`
- Modify: `lib/services/engagement.service.ts`

**Step 1: Email afsender**

I `engagement.service.ts`, hent tenant config for email-afsender:
```typescript
const tenant = await getTenantConfig()
const from = `${tenant.emailFromName || tenant.brandName} <${tenant.emailFromEmail || 'noreply@example.com'}>`
```

**Step 2: Email layout**

I `emails/layout.tsx`, modtag brandName og evt. logoUrl som props. Erstat hardcodet "FamilyMind".

**Step 3: Seed email-templates**

Email-templates i databasen refererer allerede til `{{variables}}`. De hardcodede "FamilyMind" i seed.ts template-tekster skal erstattes med `{{brandName}}`. Engagement service skal erstatte `{{brandName}}` → tenant.brandName ved afsendelse.

**Step 4: Commit**

```bash
git add emails/ lib/services/engagement.service.ts prisma/seed.ts
git commit -m "feat: tenant-aware email sender and layout"
```

---

## Task 11: Admin UI til tenant-branding

**Files:**
- Create: `app/admin/settings/branding/page.tsx`
- Create: `app/admin/settings/branding/_components/branding-form.tsx`
- Create: `app/admin/settings/branding/actions.ts`
- Modify: `app/admin/settings/page.tsx` (tilføj link til branding)

**Step 1: Opret branding-redigeringsside**

Admin-side der viser alle brand-felter i en formular:
- Brand-navn, tagline, beskrivelse
- Logo-upload (URL-felt for nu)
- Farve-felter med color-picker inputs
- Kontakt-info
- Email-indstillinger
- Landing page sektioner (hero, om, benefits)
- Testimonials (dynamisk liste med tilføj/fjern)
- FAQ (dynamisk liste med tilføj/fjern)

**Step 2: Server action**

Opret `actions.ts` med `updateBranding(formData)` der validerer med Zod og opdaterer Organization.

**Step 3: Tilføj link fra admin settings**

I admin settings overview, tilføj "Branding" link til den nye side.

**Step 4: Tilføj til admin sidebar**

I `app/admin/layout.tsx`, tilføj "Branding" nav-item med Palette-ikon.

**Step 5: Commit**

```bash
git add app/admin/settings/branding/ app/admin/layout.tsx
git commit -m "feat: admin branding settings page"
```

---

## Designbeslutninger og noter

### Hvorfor env var i stedet for domain-routing (fase 1)?

Domain-baseret tenant-resolution kræver DNS-opsætning, SSL-certifikater, og middleware-logik. Det er komplekst og unødvendigt nu. `TENANT_SLUG` env var er simpelt: hver Vercel-deploy er én tenant. Når behovet for multi-tenant-på-samme-deploy opstår, udskiftes `getTenantConfig()` internt uden at ændre nogen consumer-kode.

### Hvorfor JSON-felter til landing page sektioner?

Testimonials, FAQ, benefits osv. er ustruktureret indhold der varierer per tenant. Separate relationstabeller ville over-normalisere. JSON-felter i Postgres (med Prisma `Json` type) er fleksible, querybare, og enkle at redigere via admin UI.

### Hvad med i18n/sprog?

Denne plan holder sproget dansk. Hvis platformen skal understøtte andre sprog, tilføjes et `locale`-felt på Organization og et i18n-lag. Det er et separat initiativ — denne plan fokuserer på brand-abstraktion, ikke oversættelse.

### Hvad med React cache()?

`getTenantConfig()` bruger React `cache()` som deduplicerer kald inden for samme request. Det sikrer at vi ikke rammer databasen 10 gange per page load selvom 10 komponenter kalder funktionen.

### Migration strategi

Alle nye felter har enten defaults eller er nullable. Migrationen er non-breaking. Eksisterende Organization-rows opdateres via seed.
