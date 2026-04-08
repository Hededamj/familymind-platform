# MobilePay som subscription-betaling — Design

**Dato:** 2026-04-08
**Status:** Draft til review
**Forfatter:** CTO + UX (Claude)
**Godkendt af CEO (principbeslutninger):**
- ✅ MobilePay tilføjes parallelt med Stripe (ikke erstatning)
- ✅ Integreret i FamilyMind-platformen (ikke standalone microservice)
- ✅ Provider: Vipps MobilePay Recurring API v3
- ✅ Ingen split payments (ingen Stripe Connect-integration nødvendig)
- ✅ UX-flow: Mellemstop med valgside mellem CTA og provider

---

## 1. Baggrund og problem

**Problem:** Brugere falder fra i checkout fordi de skal hente deres betalingskort for at skrive kortnummeret ind. MobilePay er den førende wallet-betaling i Danmark, genkendt af målgruppen (forældre 30-45), og fjerner friction helt.

**Hvorfor ikke Stripe:** Stripe understøtter MobilePay som engangsbetaling, men **ikke recurring**. Der findes ingen workaround inden for Stripes platform. Vi er derfor nødt til at integrere direkte med Vipps MobilePay Recurring API v3.

**Forretningsværdi:** Forventet 15-25% løft i checkout-conversion på subscription-flowet. På 149 DKK/md er payback hurtig.

---

## 2. Scope

### In scope (Fase 1)
- MobilePay som betalingsmetode for **FamilyMind-medlemskabet** (149 DKK/md recurring)
- MobilePay for **engangskøb af kurser og bundles** (same API, simplere flow)
- Ny valgside `/checkout/vaelg-betaling` der viser både Stripe- og MobilePay-options
- Agreement-oprettelse, webhook-håndtering, charge-schedulering, reconciliation
- Admin-UI: Se MobilePay-agreements pr. bruger, manuel refund
- "Mit abonnement"-side understøtter annullering af MobilePay-abonnementer
- Fejlscenarier: failed charges, retry, grace period, fallback hvis Vipps er nede
- Tenant-aware: credentials og branding pr. `Organization` (white label-klar)

### Ikke i scope (fremtidige faser)
- Flere providers (PayPal, Klarna osv.) — men arkitekturen skal gøre det let
- Dual-stack migration af eksisterende Stripe-subscriptions til MobilePay
- MobilePay i mobilapp (Capacitor-wrapper) — det kommer senere sammen med app
- A/B-test infrastruktur mellem payment methods

### Ikke-mål
- Erstatte Stripe. Stripe forbliver default for kort/wallet.
- Split payments / Stripe Connect-lignende funktionalitet på MobilePay.

---

## 3. Arkitektur

### 3.1 Overordnet placering

MobilePay-koden lever **inde i FamilyMind Next.js-monorepoet**, side om side med Stripe-koden. Ingen standalone service.

```
lib/
├── mobilepay.ts                    # Low-level Vipps API client (OAuth + raw HTTP)
├── services/
│   ├── mobilepay.service.ts        # High-level: createAgreement, cancelAgreement, createCharge
│   ├── checkout.service.ts         # UDVIDET: provider-agnostisk startCheckout()
│   └── entitlement.service.ts      # UDVIDET: grantFromMobilePay()
app/
├── api/
│   ├── checkout/
│   │   ├── route.ts                # Stripe (eksisterende)
│   │   └── mobilepay/route.ts      # NY: opret agreement, returner confirmationUrl
│   ├── webhooks/
│   │   ├── stripe/                 # eksisterende
│   │   └── mobilepay/route.ts      # NY: modtag agreement + charge events
│   └── cron/
│       ├── mobilepay-charges/      # NY: opret charges 2 dage før due date
│       └── mobilepay-reconcile/    # NY: daglig reconciliation mod Vipps API
├── checkout/
│   ├── vaelg-betaling/page.tsx     # NY: valgside mellem providers
│   ├── mobilepay/
│   │   ├── success/page.tsx        # NY: efter agreement aktiveret
│   │   └── cancel/page.tsx         # NY: bruger afbrød i MobilePay-app
│   └── success/page.tsx            # eksisterende (Stripe)
```

### 3.2 Princip: Provider-agnostisk checkout-service

`checkout.service.ts` udvides til at kunne starte checkout mod **enten** Stripe eller MobilePay:

```ts
startCheckout({
  userId,
  priceVariantId,
  provider: 'stripe' | 'mobilepay',
  returnUrl,
}) → { redirectUrl: string }
```

Valgsiden på frontend kalder denne service med det valgte provider. Dette gør at vi kan tilføje flere providers senere uden at røre frontend.

### 3.3 Princip: Entitlement er sandheden

`Entitlement`-modellen er allerede den eneste kilde til "har brugeren adgang?". Både Stripe og MobilePay skriver til Entitlement med forskellig `source` og forskellige provider-specifikke felter. **Resten af platformen (dashboard, access checks, "Mit abonnement") behøver ikke vide hvilken provider der ligger bagved.**

---

## 4. Datamodel

### 4.1 Udvidelser til `Organization` (tenant-aware credentials)

```prisma
model Organization {
  // ... eksisterende felter ...

  // ── MobilePay (Vipps) ──
  mobilepayClientId              String?
  mobilepayClientSecret          String?  // krypteret at rest
  mobilepaySubscriptionKey       String?
  mobilepayMerchantSerialNumber  String?
  mobilepayStatus                String   @default("not_connected")
  mobilepayOnboardedAt           DateTime?
}
```

I Fase 1 bruger vi kun FamilyMinds egne credentials, men felterne ligger per-org fra dag ét. Det koster ~0 ekstra arbejde og sparer en migration senere.

### 4.2 Nye modeller

```prisma
model MobilePayAgreement {
  id                  String                 @id @default(uuid()) @db.Uuid
  userId              String                 @db.Uuid
  organizationId      String                 @db.Uuid
  priceVariantId      String                 @db.Uuid

  // Vipps-referencer
  vippsAgreementId    String                 @unique  // Vipps' ID
  confirmationUrl     String                 // deeplink/QR
  status              MobilePayAgreementStatus @default(PENDING)

  // Beløb (frosne ved oprettelse — følger PriceVariant på tidspunktet)
  amountCents         Int
  currency            String                 @default("DKK")
  intervalUnit        String                 // "MONTH", "YEAR"
  intervalCount       Int                    @default(1)

  // Cycle-styring
  nextChargeDate      DateTime?              // sættes efter aktivering
  activatedAt         DateTime?
  stoppedAt           DateTime?
  expiredAt           DateTime?

  createdAt           DateTime               @default(now())
  updatedAt           DateTime               @updatedAt

  user          User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization  Organization          @relation(fields: [organizationId], references: [id])
  priceVariant  PriceVariant          @relation(fields: [priceVariantId], references: [id])
  charges       MobilePayCharge[]
  entitlement   Entitlement?          // 1:1 når agreement er ACTIVE

  @@index([userId, status])
  @@index([status, nextChargeDate])  // for scheduler
  @@index([organizationId])
}

enum MobilePayAgreementStatus {
  PENDING    // oprettet, bruger har ikke godkendt endnu
  ACTIVE     // bruger har godkendt, charges kører
  STOPPED    // annulleret (af bruger eller admin)
  EXPIRED    // udløbet (pga. gentagne failed charges)
}

model MobilePayCharge {
  id              String                @id @default(uuid()) @db.Uuid
  agreementId     String                @db.Uuid
  vippsChargeId   String                @unique

  amountCents     Int
  currency        String                @default("DKK")
  dueDate         DateTime              // hvornår MobilePay capturer
  status          MobilePayChargeStatus @default(PENDING)

  // Retry-tracking
  attemptNumber   Int                   @default(1)
  failedAt        DateTime?
  failureReason   String?

  // Refund
  refundedCents   Int                   @default(0)
  refundedAt      DateTime?

  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  agreement       MobilePayAgreement    @relation(fields: [agreementId], references: [id], onDelete: Cascade)

  @@index([status, dueDate])
  @@index([agreementId, createdAt])
}

enum MobilePayChargeStatus {
  PENDING     // oprettet, ikke capturet endnu
  RESERVED    // reserveret hos bruger (wallet-hold)
  CHARGED     // penge modtaget
  FAILED      // fejl (utilstrækkelig saldo, afvist osv.)
  CANCELLED   // annulleret før capture
  REFUNDED    // fuld refund
  PARTIALLY_REFUNDED
}

model MobilePayWebhookEvent {
  id            String   @id @default(uuid()) @db.Uuid
  vippsEventId  String   @unique          // idempotens
  eventType     String
  payload       Json
  processedAt   DateTime?
  errorMessage  String?
  createdAt     DateTime @default(now())

  @@index([processedAt])
}
```

### 4.3 Udvidelser til `Entitlement`

```prisma
model Entitlement {
  // ... eksisterende felter ...

  mobilepayAgreementId String?             @unique @db.Uuid
  mobilepayAgreement   MobilePayAgreement? @relation(...)
}

enum EntitlementSource {
  // ... eksisterende ...
  MOBILEPAY
}
```

Én Entitlement tilhører enten Stripe **eller** MobilePay, aldrig begge. `source` og XOR-semantik håndhæves af service-laget (ikke DB-constraint, men i tests).

---

## 5. UX-flows

### 5.1 Happy path — subscription

```
1. Bruger tapper "Bliv medlem" på /subscribe (eller /courses/[slug])
2. → /checkout/vaelg-betaling?priceVariantId=...
   Vores side viser:
     ┌─────────────────────────┐
     │ Medlemskab — 149 kr/md  │
     │ [🔵 MobilePay]           │ ← primær, øverst på mobil
     │ [💳 Kort / Apple Pay]    │
     │ "Opsig når som helst"   │
     └─────────────────────────┘
3. Tap MobilePay → server action:
   - Opret MobilePayAgreement (status PENDING)
   - Kald Vipps: POST /recurring/v3/agreements
   - Gem vippsAgreementId + confirmationUrl
   - Redirect bruger til confirmationUrl
4. På mobil: deeplink til MobilePay-app.
   På desktop: QR-kode som bruger scanner med telefon.
5. Bruger swiper "Godkend" i MobilePay-app
6. Vipps sender webhook: "agreement.activated"
   - Vi opdaterer agreement.status = ACTIVE
   - Vi beregner nextChargeDate = now + interval
   - Vi opretter Entitlement (source=MOBILEPAY, status=ACTIVE, expiresAt=nextChargeDate + grace)
7. Vipps redirecter brugeren tilbage til /checkout/mobilepay/success
   - Siden poller kort eller viser "Vi bekræfter din betaling..." indtil webhook er behandlet
   - Derefter: "Du er medlem! Gå til dashboard"
```

### 5.2 Recurring charge-cyklus

```
Daglig cron @ 08:00 UTC → /api/cron/mobilepay-charges
  SELECT alle ACTIVE agreements WHERE nextChargeDate <= now + 2 dage
  Batch-process (BATCH_SIZE=20):
    For hver agreement:
      POST /recurring/v3/agreements/{id}/charges
      body: { amount, due: nextChargeDate, description, orderId: uuid }
      Gem MobilePayCharge (status=PENDING)

På due date capturer MobilePay automatisk.
Webhook "charge.charged":
  - Opdater charge.status = CHARGED
  - Forlæng Entitlement.expiresAt = nextChargeDate + interval + grace
  - Opdater agreement.nextChargeDate = + interval
  - Send kvitterings-email (Resend)
```

### 5.3 Failed charge

```
Webhook "charge.failed":
  - Opdater charge.status = FAILED, gem failureReason
  - HVIS attemptNumber < 3:
      Schedule ny charge 2 dage senere (opret ny MobilePayCharge med attemptNumber++)
      Send email: "Din betaling fejlede, vi prøver igen om 2 dage"
  - ELSE (3 fejl):
      Sæt agreement.status = EXPIRED
      Opdater Entitlement.status = PAST_DUE (eksisterende status)
      Giv 3 dages grace period
      Send email: "Din betaling fejlede. Opdater din betaling for at fortsætte"
      Efter grace: Entitlement.status = EXPIRED, adgang fjernes
```

Retry-frekvens og grace period er **admin-konfigurerbare** via `settings.service.ts` (følger princippet "nothing hardcoded" fra memory).

### 5.4 Annullering

```
Bruger går til /dashboard/abonnement → "Opsig abonnement"
  server action:
    - Kald Vipps: PATCH /recurring/v3/agreements/{id} { status: STOPPED }
    - Opdater agreement.status = STOPPED, stoppedAt = now
    - Entitlement.cancelledAt = now (men forbliver ACTIVE indtil expiresAt)
    - Send bekræftelses-email
```

Opsigelse er ikke provider-specifik for brugeren — samme knap virker uanset om de betaler med Stripe eller MobilePay. Service-laget router.

### 5.5 Fallback: Vipps API nede

Når `/api/checkout/mobilepay` detecter timeout eller 5xx fra Vipps:
- Valgsiden viser banner: "MobilePay er midlertidigt utilgængeligt. Brug kort i stedet."
- MobilePay-knappen bliver disabled med begrundelse
- Kort-flow fungerer fortsat normalt
- Admin får notifikation (eksisterende notification-system)

Tærskel konfigurerbar (fx 3 fejl inden for 5 min → deaktiver MobilePay-knap i 10 min).

---

## 6. API-endpoints (nye)

| Metode | Path | Formål |
|---|---|---|
| `POST` | `/api/checkout/mobilepay` | Opret agreement, returner confirmationUrl |
| `POST` | `/api/webhooks/mobilepay` | Modtag Vipps events (idempotent via `MobilePayWebhookEvent`) |
| `GET` | `/api/cron/mobilepay-charges` | Daglig: opret charges 2 dage før due date |
| `GET` | `/api/cron/mobilepay-reconcile` | Daglig: sync agreements mod Vipps API |
| `POST` | `/api/dashboard/subscription/cancel` | UDVIDET: router til enten Stripe eller MobilePay |
| `POST` | `/api/admin/mobilepay/refund` | Manuel refund (admin) |

Alle cron-endpoints bruger eksisterende `lib/cron-auth.ts`. Webhook-endpointet verificerer Vipps signature header.

---

## 7. Scheduler og jobkø

Vi bruger **ikke** Bull/Redis (kræver worker-process, passer dårligt til Vercel serverless). I stedet:

**DB-baseret jobkø via eksisterende Vercel Cron + Prisma:**
- `mobilepay-charges` kører dagligt, query'er DB for alle agreements hvis `nextChargeDate <= now + 2 days AND status = ACTIVE`, batcher 20 ad gangen
- Retry-logik er også DB-baseret: en `FAILED` charge der skal retry'es opretter simpelthen en ny `MobilePayCharge`-række med senere `dueDate`

Det her er samme mønster vi allerede bruger til engagement/reengagement-cronjobs. **Ingen ny infrastruktur kræves.**

---

## 8. Webhook-idempotens

Vipps garanterer ikke "exactly-once delivery". Vi skal håndtere:
- Samme event leveret flere gange
- Events out-of-order (charge.charged før agreement.activated — sjældent men muligt)

**Strategi:**
1. Hver indkommende webhook gemmes i `MobilePayWebhookEvent` med `vippsEventId` som unique constraint. Duplikater fanges af DB.
2. Behandling sker i en `$transaction`: (a) marker event som processed, (b) anvend state-change. Hvis transaction fejler, retryer Vipps.
3. State-changes er **idempotente**: "sæt agreement til ACTIVE hvis ikke allerede" i stedet for blind write.
4. Out-of-order: Reconciliation-cron fanger det dagen efter ved at spørge Vipps API direkte.

---

## 9. Reconciliation

Dagligt kl. 03:00 UTC, `/api/cron/mobilepay-reconcile`:

1. Hent alle agreements ændret sidste 48 timer fra Vipps API
2. Sammenlign med lokal DB
3. Hvis afvigelse: log til admin-notification, opdater lokal state

Dette er sikkerhedsnettet hvis webhooks tabes eller behandles forkert. Plus: ved Vipps-incident hvor webhooks holder op med at blive leveret fanger vi det indenfor 24t.

---

## 10. Fejlhåndtering og edge cases

| Scenario | Håndtering |
|---|---|
| Bruger afbryder i MobilePay-app | Vipps sender ingen webhook. Agreement forbliver PENDING. Cleanup-cron sletter PENDING agreements > 1 time gamle. |
| Agreement oprettet men bruger lukker browseren før redirect | Samme som ovenfor — PENDING → cleanup. |
| Vipps webhook når frem før Vipps har redirectet brugeren | Entitlement er allerede ACTIVE når bruger lander på success-siden. Success-siden detekterer dette og viser straks "Du er medlem". |
| Bruger har både Stripe- og MobilePay-abonnement aktivt | Vi blokerer ved checkout: hvis bruger allerede har ACTIVE subscription-Entitlement, vises valgsiden ikke — i stedet vises "Du har allerede et abonnement". |
| Amount-ændring på PriceVariant mens agreement er aktivt | Eksisterende agreements forbliver på deres frosne amount. Nye agreements bruger nyt amount. Vipps understøtter prisændring via API, men vi bygger det **ikke** i Fase 1. |
| Currency er ikke DKK | Fase 1: blokeret. Vipps understøtter kun NOK/DKK/EUR for Recurring, og vores platform er DKK-only. |
| Refund > charge amount | Vipps API afviser. Admin-UI validerer inden. |

---

## 11. Admin-UI (minimalt)

Under `/admin/users/[id]`:
- Ny tab "Betaling" der viser **både** Stripe-subscriptions og MobilePay-agreements i samme liste
- Kolonner: Provider, Status, Beløb, Næste betaling, Oprettet
- Actions: Se detaljer, Refund sidste charge, Tving annullering

Under `/admin/analytics` tilføjes:
- Payment method breakdown (hvor mange betaler med hvad)
- Konverteringsrate pr. provider (fra valgside → succesfuld betaling)
- Failed charge rate pr. provider

---

## 12. Test-strategi

**Unit tests (Vitest):**
- `mobilepay.service.ts` — alle funktioner med mocked Vipps client
- Webhook-handlers — idempotens, out-of-order events
- Charge-scheduling — edge cases (interval boundaries, leap year)
- Entitlement-grant/revoke fra MobilePay events

**Integration tests:**
- Fuld agreement-creation mod Vipps **test environment** (portal.vippsmobilepay.com har et sandbox)
- Webhook-signature validation
- Cron-jobs mod en testdatabase

**Manuel test før production:**
1. Opret agreement i Vipps test-app, godkend, se Entitlement blive oprettet
2. Vent på charge, se den komme ind
3. Simuler failed charge, se retry-flow
4. Annuller, se adgang udløbe ved periodens slutning
5. Fallback: bloker Vipps URL i /etc/hosts, verificer banner vises

---

## 13. Observability

- Log alle Vipps API-kald (request + response, uden secrets) via eksisterende `lib/logger`
- Sentry (hvis konfigureret) på alle fejl fra Vipps
- Admin notification ved: agreement failed, reconciliation fandt afvigelse, Vipps API timeout-tærskel overskredet
- Daglig health check: "antal agreements oprettet, antal charges gennemført, antal fejl" → admin dashboard

---

## 14. Sikkerhed

- Vipps `clientSecret` gemmes **krypteret** i DB (AES-256 via env-key). Læses kun i service-laget, aldrig eksponeret til client.
- Webhook signature (HMAC) valideres på hver request. Invalide requests → 401 + log.
- Rate limiting på `/api/checkout/mobilepay` (eksisterende middleware)
- Alle server actions validerer `ownership`: en bruger kan kun oprette/annullere sine egne agreements
- IDOR-check på refund: admin-only
- Cron-endpoints: eksisterende `verifyCronAuth()` fails-closed i production

---

## 15. Onboarding af Vipps (operationelt)

1. Opret merchant-konto på portal.vippsmobilepay.com (hvis ikke allerede)
2. Ansøg om adgang til **Recurring API v3** (separat godkendelse)
3. Opret test-credentials i sandbox
4. Byg + test mod sandbox
5. Ansøg om production-credentials
6. Opsæt production webhook URL: `https://familymind.dk/api/webhooks/mobilepay`
7. Sæt credentials i Vercel env + Organization-row for FamilyMind
8. Go-live med feature flag

Trin 1-2 tager typisk 3-5 arbejdsdage. Det er uden for kodens kontrol og bør startes **parallelt** med udviklingen.

---

## 16. Fase-opdeling

**Fase 1a — Core infrastructure (~1 uge)**
- Prisma-modeller + migration
- `lib/mobilepay.ts` (Vipps client med OAuth)
- `mobilepay.service.ts` (createAgreement, createCharge, cancelAgreement)
- Unit tests for service-laget

**Fase 1b — Checkout-flow (~1 uge)**
- `/api/checkout/mobilepay` endpoint
- `/checkout/vaelg-betaling` valgside
- Success/cancel pages
- Webhook endpoint + idempotens + event-processing
- Entitlement-grant fra MobilePay

**Fase 1c — Recurring charges (~3-4 dage)**
- Scheduler-cron
- Retry-logik
- Reconciliation-cron
- Failed charge handling + emails
- Fallback hvis Vipps er nede

**Fase 1d — Admin + polish (~3 dage)**
- Admin-UI (betalingstab + refund)
- Analytics-breakdown
- "Mit abonnement"-annullering
- Feature flag + gradvis rollout

**Fase 1e — Production hardening (~2-3 dage)**
- Load-test af cron-batches
- Observability-dashboard
- Runbook for failure modes
- CTO code review

**Total: ~3 uger fokuseret arbejde.**

---

## 17. Åbne spørgsmål til afklaring under implementering

1. **Amount-ændring mid-subscription:** Hvis 149 DKK hæves til 159 DKK, hvad sker med eksisterende MobilePay-agreements? Forslag: eksisterende fortsætter på gamle pris, nye betaler ny pris. Dokumenter i ToS.
2. **Dunning emails:** Hvor mange retry-emails, hvad står der? Skal bruge eksisterende email-templates + admin-konfigurerbare tekster.
3. **Feature flag:** Skal MobilePay-knappen være synlig for alle brugere i starten, eller kun en procentdel (canary)? Anbefaling: canary 10% i første uge.
4. **Refund-policy:** Kan brugere selv refundere fra "Mit abonnement", eller kun admin? Fase 1: kun admin. Fase 2: overvej self-service inden for 14 dage.

---

## 18. Succeskriterier

Fase 1 anses for succesfuld når:
- ✅ En dansk bruger kan oprette et medlemskab med MobilePay på under 30 sekunder fra CTA til bekræftelse
- ✅ Recurring charges kører automatisk uden manuel intervention i 30 dage
- ✅ Failed charges håndteres med retry + grace period + email uden at bryde Entitlement
- ✅ Admin kan se og annullere MobilePay-agreements i admin-UI
- ✅ Fallback virker hvis Vipps er nede
- ✅ Zero known data-inkonsistenser mellem lokal DB og Vipps (verificeret af reconciliation-cron i 7 dage)
- ✅ Code review godkendt af CTO
- ✅ Conversion på valgside → succesfuld betaling > 85% for MobilePay (målt efter 2 uger i production)
