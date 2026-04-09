# Requirements: FamilyMind Platform

**Defined:** 2026-04-08
**Last milestone added:** 2026-04-08 (v1.3 Offboarding Intelligence)

## v1.3 Requirements — Offboarding Intelligence

**Core Value:** Indsaml strukturerede opsigelses-data i-app så vi kan tagge og re-engagere churned kunder — uden at bruge dark patterns.

### Data Foundation

- [x] **OFF-DATA-01**: Prisma-model `CancellationSurvey` med userId, subscriptionId, cancelledAt, primaryReason, tags[], feedback, wouldReturn, offeredPause, pauseAccepted
- [x] **OFF-DATA-02**: Seed data for predefinerede `CancellationReason` tags (pris, tid, fandt-alternativ, indhold-matcher-ikke, personlig-situation, forbedret, teknisk)
- [x] **OFF-DATA-03**: Service function `cancelSubscription()` der validerer survey er udfyldt før Stripe cancel kaldes
- [x] **OFF-DATA-04**: Service function `pauseSubscription()` der bruger Stripe `subscription.pause_collection` for 1/2/3 måneder
- [x] **OFF-DATA-05**: Survey-data er tilgængelig for Phase 13 admin-dashboard via `listCancellations()` service function — ingen Zapier eller New Zenler integration.

### Retention Offer Engine (Phase 11)

- [ ] **OFF-ENGINE-01**: Prisma-modeller `RetentionOffer`, `RetentionOfferTrigger`, `RetentionOfferAcceptance` med organizationId, offerType (DISCOUNT/PAUSE/SUPPORT/CONTENT_HELP/NONE), durationMonths, maxUsesPerUser, cooldownDays, og type-specifikke felter (stripeCouponId, pauseMonths, supportUrl, contentUrl)
- [ ] **OFF-ENGINE-02**: `resolveEligibleOffer(userId, reasonSlugs)` service function returnerer højest-priority eligible offer eller null, iterating gennem candidates med `isOfferEligible()` check (maxUses, cooldown, active-offer-check)
- [ ] **OFF-ENGINE-03**: `applyDiscountOffer()` kalder `stripe.subscriptions.update()` med discounts array og Stripe Connect account context (`{ stripeAccount: org.stripeAccountId }`) når tenant har Connect-konto
- [ ] **OFF-ENGINE-04**: `applyPauseOffer()` genbruger Phase 10 `pauseSubscription()` men opretter `RetentionOfferAcceptance` row for tracking
- [ ] **OFF-ENGINE-05**: Accepting any offer auto-reverses `cancel_at_period_end` flag hvis det var sat (kunden bliver, ikke cancelled)
- [ ] **OFF-ENGINE-06**: Idempotency: andet kald til `acceptOffer` med samme surveyId returnerer eksisterende acceptance uden duplikeret Stripe-kald
- [ ] **OFF-ENGINE-07**: Vitest unit tests for alle service functions med `vi.mock` for `@/lib/prisma` og `@/lib/stripe`

### UI — Hygge Cancel Flow (Phase 12)

- [ ] **OFF-UI-01**: Ny side `/dashboard/subscription/cancel` (ikke modal) erstatter ekstern formular-link
- [ ] **OFF-UI-02**: Step 1 viser empatisk overskrift + warm illustration + "skip survey" link direkte til bekræftelse
- [ ] **OFF-UI-03**: Step 2 lader brugeren vælge reason-tag chips + valgfri fritekst feedback
- [ ] **OFF-UI-04**: Step 3 dynamisk rendering af offer type baseret på `resolveEligibleOffer()` — DiscountCard, PausePicker, SupportContact, ContentSuggestions, eller RespectSkip variant
- [ ] **OFF-UI-05**: Step 4 bekræfter opsigelsesdato (slutning af betalingsperiode) og gennemfører Stripe cancel
- [ ] **OFF-UI-06**: Step 5 viser personaliseret tak-besked med 3 varianter (cancel, pause, retention accepteret)
- [ ] **OFF-UI-07**: Hele flowet er mobile-first responsivt i FamilyMind design system

### Admin — Churn Analytics + Retention Config (Phase 13)

- [ ] **OFF-ADMIN-01**: `/admin/analytics/churn` viser søjlediagram over cancellation reasons med tællere for 7/30/90 dages vindue
- [ ] **OFF-ADMIN-02**: Liste over nyeste feedback med bruger-info, tags, og offer acceptance status
- [ ] **OFF-ADMIN-03**: Filter churned users efter tag-kombinationer (fx "pris + har børn under 5") og eksportér som CSV
- [ ] **OFF-ADMIN-04**: `/admin/retention` viser liste af konfigurerede RetentionOffers med type, status, og acceptance counts
- [ ] **OFF-ADMIN-05**: Admin kan oprette ny RetentionOffer via form — inkl. "Create Stripe coupon" action der kalder `stripe.coupons.create()` med tenant's stripeAccount context og auto-fylder stripeCouponId
- [ ] **OFF-ADMIN-06**: Admin kan mappe offers til CancellationReasons, sætte priority, maxUsesPerUser, og cooldownDays

## v1.4 Requirements — MobilePay Checkout

**Core Value:** Dansk-native subscription-betaling der eliminerer kort-friction og match markedsstandard
**Source spec:** `docs/superpowers/specs/2026-04-08-mobilepay-subscription-design.md`
**Status:** Planned — starts when MobilePay/Vipps API credentials are available

### Datamodel & Infrastruktur

- [ ] **MP-DATA-01**: Prisma-modeller for MobilePayAgreement, MobilePayCharge og MobilePayWebhookEvent med idempotens-støtte
- [ ] **MP-DATA-02**: Entitlement udvides med mobilepayAgreementId og EntitlementSource.MOBILEPAY
- [ ] **MP-DATA-03**: Organization udvides med tenant-aware Vipps-credentials (clientId, secret, subscriptionKey, MSN) — krypteret secret
- [ ] **MP-DATA-04**: Vipps API-klient (OAuth2 + raw HTTP) i lib/mobilepay.ts med token-caching
- [ ] **MP-DATA-05**: mobilepay.service.ts med createAgreement, cancelAgreement, createCharge, refundCharge

### Checkout & Agreement-oprettelse

- [ ] **MP-CHECKOUT-01**: Ny side /checkout/vaelg-betaling viser Stripe og MobilePay som ligeværdige betalingsvalg
- [ ] **MP-CHECKOUT-02**: checkout.service.ts udvides til at være provider-agnostisk (startCheckout med provider-parameter)
- [ ] **MP-CHECKOUT-03**: /api/checkout/mobilepay endpoint opretter agreement og returnerer confirmationUrl (deeplink på mobil, QR på desktop)
- [ ] **MP-CHECKOUT-04**: Success- og cancel-sider for MobilePay-flow med polling indtil webhook har behandlet aktivering
- [ ] **MP-CHECKOUT-05**: Brugeren kan ikke oprette MobilePay-abonnement hvis hen allerede har et aktivt subscription-entitlement

### Webhook & State Sync

- [ ] **MP-WEBHOOK-01**: /api/webhooks/mobilepay endpoint med HMAC signature-validering
- [ ] **MP-WEBHOOK-02**: Webhook-idempotens via MobilePayWebhookEvent unique-constraint på vippsEventId
- [ ] **MP-WEBHOOK-03**: agreement.activated event opretter Entitlement med source=MOBILEPAY atomisk
- [ ] **MP-WEBHOOK-04**: charge.charged event forlænger Entitlement.expiresAt og opdaterer nextChargeDate
- [ ] **MP-WEBHOOK-05**: agreement.stopped event markerer Entitlement.cancelledAt uden at fjerne adgang før periodens slutning

### Recurring Charges

- [ ] **MP-CRON-01**: Daglig cron /api/cron/mobilepay-charges opretter charges 2 dage før nextChargeDate (batch-processet, 20 ad gangen)
- [ ] **MP-CRON-02**: Daglig reconciliation-cron /api/cron/mobilepay-reconcile sammenligner lokal state mod Vipps API og logger afvigelser
- [ ] **MP-CRON-03**: Cleanup-cron fjerner PENDING agreements > 1 time gamle
- [ ] **MP-CRON-04**: Alle cron-endpoints bruger eksisterende verifyCronAuth() og fails-closed i production

### Fejlhåndtering

- [ ] **MP-ERR-01**: Failed charge retryes op til 3 gange med 2 dages mellemrum (konfigurerbart via settings)
- [ ] **MP-ERR-02**: Efter 3 fejl sættes agreement EXPIRED og Entitlement PAST_DUE med 3 dages grace period (konfigurerbart)
- [ ] **MP-ERR-03**: Dunning-emails sendes ved failed charge, retry og final expiration via eksisterende Resend-system
- [ ] **MP-ERR-04**: Hvis Vipps API returnerer timeout/5xx flere gange inden for kort tid vises fallback-banner og MobilePay-knap disables midlertidigt
- [ ] **MP-ERR-05**: Admin får notifikation ved agreement-fejl, Vipps-nedbrud og reconciliation-afvigelser

### Admin-UI

- [ ] **MP-ADMIN-01**: /admin/users/[id] får "Betaling"-tab der viser både Stripe-subscriptions og MobilePay-agreements i samlet liste
- [ ] **MP-ADMIN-02**: Admin kan tvinge annullering af MobilePay-agreement fra admin-UI
- [ ] **MP-ADMIN-03**: Admin kan refundere sidste charge (fuld eller delvis) med IDOR-beskyttelse
- [ ] **MP-ADMIN-04**: /admin/analytics får payment-method breakdown: antal agreements, conversion-rate pr. provider, failed charge rate

### User-facing subscription management

- [ ] **MP-USER-01**: "Mit abonnement"-siden viser MobilePay-abonnementer med samme UI som Stripe (provider er usynlig for brugeren)
- [ ] **MP-USER-02**: Brugeren kan opsige MobilePay-abonnement fra samme knap som Stripe — service-laget router til rette provider

## Future Requirements (v1.4+)

- **MP-FUT-01**: MobilePay som betaling for engangskøb (kurser/bundles) — samme flow, simplere lifecycle
- **MP-FUT-02**: Amount-ændring på aktive agreements (når vi hæver medlemspris)
- **MP-FUT-03**: Self-service refund inden for 14-dages fortrydelsesret
- **MP-FUT-04**: A/B-test infrastruktur mellem payment methods
- **MP-FUT-05**: Flere betalingsproviders (PayPal, Klarna) — arkitekturen skal understøtte det

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dual-stack migration af eksisterende Stripe-kunder til MobilePay | Ingen forretningsværdi; brugere der allerede betaler fortsætter |
| MobilePay Split Payments / Connect-equivalent | Forretningen deler ikke indkomst med instruktører |
| MobilePay i Capacitor-app | Kommer sammen med app-projektet senere |
| Erstatte Stripe med MobilePay | Stripe forbliver default for kort/Apple Pay/Google Pay |
| Ikke-DKK valutaer | Platformen er DKK-only i v1.3 |

## Traceability

### v1.3 Offboarding Intelligence

| Requirement | Phase | Status |
|-------------|-------|--------|
| OFF-DATA-01 | Phase 10 | Complete |
| OFF-DATA-02 | Phase 10 | Complete |
| OFF-DATA-03 | Phase 10 | Complete |
| OFF-DATA-04 | Phase 10 | Complete |
| OFF-DATA-05 | Phase 10 | Complete |
| OFF-UI-01 | Phase 11 | Pending |
| OFF-UI-02 | Phase 11 | Pending |
| OFF-UI-03 | Phase 11 | Pending |
| OFF-UI-04 | Phase 11 | Pending |
| OFF-UI-05 | Phase 11 | Pending |
| OFF-UI-06 | Phase 11 | Pending |
| OFF-ADMIN-01 | Phase 12 | Pending |
| OFF-ADMIN-02 | Phase 12 | Pending |
| OFF-ADMIN-03 | Phase 12 | Pending |
| OFF-ADMIN-04 | Phase 12 | Pending |

### v1.4 MobilePay Checkout

| Requirement | Phase | Status |
|-------------|-------|--------|
| MP-DATA-01 | Phase 13 | Pending |
| MP-DATA-02 | Phase 13 | Pending |
| MP-DATA-03 | Phase 13 | Pending |
| MP-DATA-04 | Phase 13 | Pending |
| MP-DATA-05 | Phase 13 | Pending |
| MP-CHECKOUT-01 | Phase 14 | Pending |
| MP-CHECKOUT-02 | Phase 14 | Pending |
| MP-CHECKOUT-03 | Phase 14 | Pending |
| MP-CHECKOUT-04 | Phase 14 | Pending |
| MP-CHECKOUT-05 | Phase 14 | Pending |
| MP-WEBHOOK-01 | Phase 14 | Pending |
| MP-WEBHOOK-02 | Phase 14 | Pending |
| MP-WEBHOOK-03 | Phase 14 | Pending |
| MP-WEBHOOK-04 | Phase 15 | Pending |
| MP-WEBHOOK-05 | Phase 15 | Pending |
| MP-CRON-01 | Phase 15 | Pending |
| MP-CRON-02 | Phase 15 | Pending |
| MP-CRON-03 | Phase 15 | Pending |
| MP-CRON-04 | Phase 15 | Pending |
| MP-ERR-01 | Phase 15 | Pending |
| MP-ERR-02 | Phase 15 | Pending |
| MP-ERR-03 | Phase 15 | Pending |
| MP-ERR-04 | Phase 15 | Pending |
| MP-ERR-05 | Phase 16 | Pending |
| MP-ADMIN-01 | Phase 16 | Pending |
| MP-ADMIN-02 | Phase 16 | Pending |
| MP-ADMIN-03 | Phase 16 | Pending |
| MP-ADMIN-04 | Phase 16 | Pending |
| MP-USER-01 | Phase 16 | Pending |
| MP-USER-02 | Phase 16 | Pending |

**Coverage:**
- v1.3 Offboarding: 15 requirements, 15 mapped
- v1.4 MobilePay: 29 requirements, 29 mapped
- Total unmapped: 0

## v1.2 Requirements (archived — completed)

Se tidligere milestone-dokumentation. Alle 11 v1.2 requirements (CARD-*, CHAP-*, COURSE-*, FILTER-01, SAVE-01) er afsluttet.

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after roadmap creation (v1.3)*
