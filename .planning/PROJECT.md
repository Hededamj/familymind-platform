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

### Active

<!-- Current scope. Building toward these. -->

- [ ] Mobile-first layout med safe-area håndtering
- [ ] Responsive typography og spacing på alle bruger-sider
- [ ] Touch-optimeret UI (44px targets, smooth interactions)
- [ ] Konsistent navigation på alle bruger-routes
- [ ] PWA-forberedelse (manifest, viewport, theme-color)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Push notifications — Separat projekt, kræver Service Workers + backend
- Native app (Capacitor) — Fokusér på webapp-kvalitet først
- Redesign af admin-panel — Admin er desktop-only, lav prioritet
- Nye features (AI chat, gamification) — Først polish, så features

## Current Milestone: v1.0 Mobile-First Overhaul

**Goal:** Gør FamilyMind til en poleret mobile webapp der føles native.

**Target features:**
- Safe-area håndtering (notch, home indicator) på alle sider
- Responsive layout fixes (overflow, padding, typography)
- Touch-optimerede interaktioner
- Konsistent navigation på alle bruger-routes
- PWA-forberedelse

## Context

- Målgruppen er forældre der primært bruger mobilen
- Konkurrent-analyse viser høj quality bar for mobile UX (se mobil side konkurrent.jpg)
- Audit identificerede ~23 issues: 4 kritiske, 5 høje, 14 medium/lav
- Eksisterende kode er generelt fornuftigt struktureret men mangler mobile polish
- Domæne: mettehummel.dk (Simply hosting), deploy: Vercel
- Tech: Next.js 16, React 19, Tailwind 4, shadcn/ui, Supabase, Prisma

## Constraints

- **Budget**: Hobby Vercel plan, gratis Supabase tier — hold det billigt
- **Domæne**: mettehummel.dk (ikke familymind.dk)
- **Sprog**: Dansk UI, dansk indhold
- **Browser**: Primært Safari iOS + Chrome Android
- **Eksisterende**: Ingen breaking changes til admin-panel eller data-model

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Webapp over native app | Budget, hurtigere iteration, én codebase | — Pending |
| Tailwind 4 + shadcn/ui | Allerede i brug, god mobile-first workflow | ✓ Good |
| Supabase Auth + Prisma ORM | Allerede i brug, service-layer pattern | ✓ Good |
| mettehummel.dk som afsender-domæne | Ejer ikke familymind.dk | ✓ Good |

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
*Last updated: 2026-04-03 after milestone v1.0 initialization*
