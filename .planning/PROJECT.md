# FamilyMind Platform

## What This Is

En dansk forældreuddannelsesplatform der leverer evidensbaseret indhold til forældre med børn 0-18 år. Platformen tilbyder strukturerede journeys (dag-for-dag forløb), kurser, community og personlige anbefalinger baseret på onboarding. Bygget som mobile-first webapp med Next.js 16, Supabase, Prisma, Stripe og Tailwind CSS.

## Core Value

Forældre skal have en smooth, native-lignende mobiloplevelse der gør det nemt at følge forløb og engagere sig med indhold i hverdagen.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Auth med email/password og OAuth (Google, Apple) — v0
- ✓ Admin-konfigurerbar onboarding med aldersgrupper og tag-mapping — v0
- ✓ Produkter (abonnement, kurser, bundler) med Stripe — v0
- ✓ Journeys med faser, dage, actions og check-ins — v0
- ✓ Community med kohorter, diskussionsrum og moderation — v0
- ✓ Email engagement (scheduling, re-engagement tiers) — v0
- ✓ In-app notifikationer — v0
- ✓ Multi-tenant med Stripe Connect — v0
- ✓ GDPR-compliant video hosting via Bunny.net — v0
- ✓ Admin-panel med fuld CMS-funktionalitet — v0
- ✓ Mobile-first layout med safe-area håndtering — v1.0
- ✓ Responsive typography og spacing — v1.0
- ✓ Touch-optimeret UI (44px targets) — v1.0
- ✓ Konsistent navigation på alle bruger-routes — v1.0
- ✓ PWA (manifest, viewport, theme-color) — v1.0
- ✓ Personlig check-in prompt og dashboard-kontekst — v1.1
- ✓ "Din gode uge" ugentligt fokus fra aktiv journey — v1.1
- ✓ Visuelt redesignet dashboard med store indholdskort — v1.1
- ✓ Visuelt rige lektionskort med thumbnails, type-badge og varighed — v1.2
- ✓ Kapitel-sektioner med horisontal scroll af lektioner — v1.2
- ✓ Kursus-oversigt med progress-bar og metadata — v1.2
- ✓ Content-type filter (Alle, Video, Artikler) — v1.2
- ✓ Bookmark/gem funktionalitet på lektioner — v1.2

### Active

<!-- Current scope. Building toward these. -->

- [ ] MobilePay som ligeværdig subscription-betaling via Vipps Recurring API v3
- [ ] Ny valgside mellem betalingsmetoder (Stripe vs MobilePay)
- [ ] Recurring charge-scheduler + webhook-idempotens + daglig reconciliation
- [ ] Failed charge retry-logik + grace period + dunning-emails
- [ ] Fallback-håndtering når Vipps API er nede
- [ ] Admin-UI til MobilePay-agreements (se/annullér/refundér)
- [ ] Tenant-aware MobilePay-credentials på Organization (white label-klar)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Push notifications — Separat projekt, kræver Service Workers + backend
- Native app (Capacitor) — Fokusér på webapp-kvalitet først
- Redesign af admin-panel — Admin er desktop-only, lav prioritet
- AI chat/assistent — Interessant men for komplekst til denne milestone
- Admin-konfigurerbart PWA app-ikon — Parkeret til næste milestone

## Current Milestone: v1.3 MobilePay Checkout

**Goal:** Tilføj MobilePay som ligeværdig subscription-betaling parallelt med Stripe for at reducere dropoff ved kortindtastning og match dansk markedsstandard.

**Target features:**
- Vipps MobilePay Recurring API v3-integration (agreements + charges)
- Valgside mellem Stripe og MobilePay i checkout-flowet
- Recurring charge-scheduler via Vercel Cron + webhook-idempotens
- Daglig reconciliation-cron som sikkerhedsnet
- Failed charge retry-logik, grace period og dunning-emails
- Fallback når Vipps API er nede
- Admin-UI til MobilePay-agreements
- Tenant-aware credentials på Organization (white label-klar)

**Source of truth:** Fuldt designdokument i `docs/superpowers/specs/2026-04-08-mobilepay-subscription-design.md`

## Context

- Målgruppen er forældre der primært bruger mobilen
- Konkurrent-analyse viser høj quality bar for mobile UX (se mobil side konkurrent.jpg)
- Audit identificerede ~23 issues: 4 kritiske, 5 høje, 14 medium/lav
- Eksisterende kode er generelt fornuftigt struktureret men mangler mobile polish
- Domæne: familymind.nu, deploy: Vercel
- Tech: Next.js 16, React 19, Tailwind 4, shadcn/ui, Supabase, Prisma

## Constraints

- **Budget**: Hobby Vercel plan, gratis Supabase tier — hold det billigt
- **Domæne**: familymind.nu (vi ejer ikke familymind.dk)
- **Sprog**: Dansk UI, dansk indhold
- **Browser**: Primært Safari iOS + Chrome Android
- **Eksisterende**: Ingen breaking changes til admin-panel eller data-model

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Webapp over native app | Budget, hurtigere iteration, én codebase | — Pending |
| Tailwind 4 + shadcn/ui | Allerede i brug, god mobile-first workflow | ✓ Good |
| Supabase Auth + Prisma ORM | Allerede i brug, service-layer pattern | ✓ Good |
| familymind.nu som platform-domæne | White-label SaaS, eget brand-domæne (.dk var optaget) | ✓ Good |
| MobilePay via Vipps Recurring API v3 (ikke Stripe) | Stripe understøtter ikke MobilePay recurring | ✓ v1.3 |
| Integreret i FamilyMind monorepo (ikke standalone) | Deler User/Entitlement-modeller, ingen datasync | ✓ v1.3 |
| Ingen split payments på MobilePay | Forretning deler ikke indkomst med instruktører | ✓ v1.3 |
| Valgside-UX mellem Stripe og MobilePay (mulighed A) | Giver MobilePay ligeværdig plads, white label-klar | ✓ v1.3 |
| Tenant-aware MobilePay-credentials fra dag ét | Undgår migration når white label rulles ud | ✓ v1.3 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-08 after milestone v1.3 initialization*
