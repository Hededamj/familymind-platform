# Stripe Connect — Design Document

## Goal

Lad white-label tenants forbinde deres egen Stripe-konto via self-service OAuth, så betalinger fra deres kunder går direkte til dem. Platformen tager ingen cut — indtjening er via SaaS-abonnement.

## Beslutninger

- **Connect-type:** Standard (tenant ejer sin Stripe-konto og dashboard)
- **Revenue model:** Ingen application fee. Platformen er ren SaaS.
- **Onboarding:** Self-service — tenant-admin forbinder via Indstillinger → Integrationer
- **Migration:** FamilyMind (tenant #1) migrerer også til Connect. Ingen env-var fallback.

---

## Sektion 1: Datamodel

Tilføj til `Organization`-modellen:

```prisma
stripeAccountId     String?   // "acct_xxx" fra Stripe Connect OAuth
stripeAccountStatus String    @default("not_connected")
                              // not_connected | pending | active | restricted
stripeOnboardedAt   DateTime?
```

Statusser:
- **not_connected** — default, ingen Stripe-forbindelse
- **pending** — OAuth gennemført, men Stripe-konto mangler KYC/verificering
- **active** — fuldt verificeret, klar til betalinger (`charges_enabled && payouts_enabled`)
- **restricted** — Stripe har begrænset kontoen (mangler info, disputes, etc.)

Platformens egen Stripe-konto (`STRIPE_SECRET_KEY` i env) har Connect aktiveret og bruges til OAuth-links og webhooks. Tenantens `stripeAccountId` bruges som `stripe_account` header på alle checkout-kald.

---

## Sektion 2: OAuth-flow

### Forbind Stripe

1. Tenant-admin klikker "Forbind Stripe" i `/admin/settings/integrations`
2. Server action genererer Stripe OAuth URL med `state` parameter (CSRF-token gemt i cookie)
3. Redirect til `https://connect.stripe.com/oauth/authorize?client_id=PLATFORM_CLIENT_ID&state=xxx&scope=read_write&response_type=code`
4. Tenant logger ind / opretter Stripe-konto hos Stripe
5. Stripe redirecter til `/api/stripe-connect/callback?code=xxx&state=xxx`
6. Callback-route:
   - Validerer `state` mod cookie (CSRF)
   - Kalder `stripe.oauth.token({ code })` → får `stripe_user_id`
   - Gemmer `stripeAccountId` + status `pending` på Organization
   - Henter account-status via `stripe.accounts.retrieve(stripeAccountId)`
   - Opdaterer status til `active` hvis `charges_enabled && payouts_enabled`
   - Redirect til `/admin/settings/integrations` med success-besked

### Frakobl Stripe

- Admin klikker "Frakobl" → `stripe.oauth.deauthorize({ stripe_user_id })` → nulstil Organization-felter
- Deaktiverer checkout for tenantens produkter indtil ny forbindelse

### Env-vars (platform-niveau)

- `STRIPE_SECRET_KEY` — platformens egen Stripe-konto (eksisterer allerede)
- `STRIPE_CONNECT_CLIENT_ID` — Connect OAuth client ID (ny)

---

## Sektion 3: Webhook-håndtering

### Ét centralt endpoint

`/api/webhooks/stripe` — allerede eksisterer. Udvides med:

### Connect-specifikke events

- `account.updated` — Stripe sender dette når en connected account ændrer status. Opdatér `stripeAccountStatus` på Organization:
  - `charges_enabled && payouts_enabled` → `active`
  - `charges_enabled && !payouts_enabled` → `restricted`
  - Ellers → `pending`

### Eksisterende events (checkout, subscription, invoice)

- Allerede håndteret — men nu routes til den rigtige tenant
- Stripe inkluderer `account` felt på events fra connected accounts
- Webhook-handleren bruger `event.account` til at slå Organization op og sikre korrekt kontekst

### Checkout-ændring

- `createCheckoutSession` henter tenantens `stripeAccountId` fra Organization
- Tilføjer `stripe_account: stripeAccountId` på alle Stripe-kald
- Hvis ingen `stripeAccountId` med status `active` → fejl ("Stripe er ikke forbundet")

### Webhook-signatur

- Connect webhook events signeres med platformens webhook secret (samme som nu)
- Ingen ændring i signaturvalidering

---

## Sektion 4: Admin UI

Udvid den eksisterende `/admin/settings/integrations` side:

### Stripe-kort (erstatter nuværende read-only status)

- **Ikke forbundet:** Stort "Forbind Stripe"-knap → starter OAuth-flow
- **Pending:** Gul status-badge, "Din Stripe-konto afventer verificering hos Stripe" + link til Stripe dashboard
- **Active:** Grøn status-badge, viser Stripe account ID, "Frakobl"-knap
- **Restricted:** Orange status-badge, "Stripe har begrænset din konto — tjek dit Stripe dashboard" + link

### Checkout-guard

- Hvis tenant ikke har `stripeAccountId` med status `active` → checkout-knapper viser "Stripe ikke forbundet" (disabled)
- Admin ser en banner: "Forbind Stripe for at modtage betalinger"
