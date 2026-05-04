---
created: 2026-04-29T20:08:58.499Z
title: Verify Resend domain for transactional emails
area: tooling
files:
  - lib/services/engagement.service.ts:90
  - app/api/webhooks/stripe/route.ts:140
---

## Problem

Resend afviser p.t. alle email-sendinger med fejlen:

```
The familymind.nu domain is not verified.
Please, add and verify your domain on https://resend.com/domains
```

Det betyder at **alle 16 email-templates er broken** — ikke kun de Stripe-relaterede:

- `payment_failed` (PR #20) — sendes når dunning starter
- `trial_ending` (PR #20) — 3 dage før prøveperiode slutter
- `journey_welcome`, `journey_day_complete`, `journey_complete`, `journey_nudge`
- `weekly_plan`, `midweek_nudge`, `monthly_progress`, `reflection`
- `reengagement_tier1` til `reengagement_tier4`
- `community_digest`, `community_reply`

Webhook-handlerne kalder `sendTemplatedEmail()` korrekt (verificeret end-to-end via `scripts/test-stripe-webhook.ts trial_ending` mod lokal dev-server) — fejlen sker først når Resend afviser request'en pga. uverificeret domain.

Opdaget under e2e-test 2026-04-29 efter Stripe-audit-PRs (#17–#21).

## Solution

1. Gå til https://resend.com/domains
2. Tilføj `familymind.nu` (eller subdomain `mail.familymind.nu`)
3. Tilføj DNS-records Resend giver (SPF, DKIM, DMARC) hos DNS-provider for familymind.nu
4. Vent 5–30 min på propagation, klik "Verify"

**Verifikation efter verifikation:**

```bash
# Start lokal dev: npm run dev
# Seed synthetic entitlement → user mail@hededam.dk
npx tsx --env-file=.env --env-file=.env.local \
  scripts/test-stripe-webhook.ts trial_ending
```

Tjek server-log: skal IKKE vise `[engagement] Resend error: ... domain is not verified`. I stedet bør Resend returnere et `data.id` for den sendte email.

## Followup

Når dette er done og emails virker: overvej at tilføje en periodisk health-check der sender en test-email og alarmer hvis det fejler. Bug af denne type bør ikke kunne snige sig forbi i 6 mdr.
