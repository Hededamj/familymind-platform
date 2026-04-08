# Requirements: FamilyMind MobilePay Checkout

**Defined:** 2026-04-08
**Core Value:** Dansk-native subscription-betaling der eliminerer kort-friction og match markedsstandard
**Source spec:** `docs/superpowers/specs/2026-04-08-mobilepay-subscription-design.md`

## v1.3 Requirements

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

| Requirement | Phase | Status |
|-------------|-------|--------|
| MP-DATA-01 | Phase 10 | Pending |
| MP-DATA-02 | Phase 10 | Pending |
| MP-DATA-03 | Phase 10 | Pending |
| MP-DATA-04 | Phase 10 | Pending |
| MP-DATA-05 | Phase 10 | Pending |
| MP-CHECKOUT-01 | Phase 11 | Pending |
| MP-CHECKOUT-02 | Phase 11 | Pending |
| MP-CHECKOUT-03 | Phase 11 | Pending |
| MP-CHECKOUT-04 | Phase 11 | Pending |
| MP-CHECKOUT-05 | Phase 11 | Pending |
| MP-WEBHOOK-01 | Phase 11 | Pending |
| MP-WEBHOOK-02 | Phase 11 | Pending |
| MP-WEBHOOK-03 | Phase 11 | Pending |
| MP-WEBHOOK-04 | Phase 12 | Pending |
| MP-WEBHOOK-05 | Phase 12 | Pending |
| MP-CRON-01 | Phase 12 | Pending |
| MP-CRON-02 | Phase 12 | Pending |
| MP-CRON-03 | Phase 12 | Pending |
| MP-CRON-04 | Phase 12 | Pending |
| MP-ERR-01 | Phase 12 | Pending |
| MP-ERR-02 | Phase 12 | Pending |
| MP-ERR-03 | Phase 12 | Pending |
| MP-ERR-04 | Phase 12 | Pending |
| MP-ERR-05 | Phase 13 | Pending |
| MP-ADMIN-01 | Phase 13 | Pending |
| MP-ADMIN-02 | Phase 13 | Pending |
| MP-ADMIN-03 | Phase 13 | Pending |
| MP-ADMIN-04 | Phase 13 | Pending |
| MP-USER-01 | Phase 13 | Pending |
| MP-USER-02 | Phase 13 | Pending |

**Coverage:**
- v1.3 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

## v1.2 Requirements (archived — completed)

Se tidligere milestone-dokumentation. Alle 11 v1.2 requirements (CARD-*, CHAP-*, COURSE-*, FILTER-01, SAVE-01) er afsluttet.

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after roadmap creation (v1.3)*
