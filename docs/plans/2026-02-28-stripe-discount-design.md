# Stripe Rabatkode-integration — Design

**Dato:** 2026-02-28
**Status:** Godkendt

## Problemstilling

Admin kan oprette rabatkoder i databasen, og kunder kan indtaste dem ved checkout. Men rabatterne når aldrig Stripe — `stripeCouponId` er altid `undefined`, `currentUses` tælles aldrig op, og kunden betaler fuld pris.

## Løsning

Sync rabatkoder til Stripe Coupons ved oprettelse. Ved checkout sendes coupon-ID til Stripe, som anvender rabatten. Ved succesfuld betaling incrementeres `currentUses` via webhook.

## Datamodel-ændringer

Nye felter på `DiscountCode`:

```prisma
stripeCouponId        String?   // Stripe coupon ID
stripePromotionCodeId String?   // Ikke brugt i v1, reserveret
duration              String    @default("once") // "once" | "repeating" | "forever"
durationInMonths      Int?      // Kun når duration = "repeating"
```

- `duration` matcher Stripe's coupon duration-model direkte
- For engangskøb ignorerer Stripe `duration` — feltet er primært til subscriptions
- `type` og `value` er immutable efter oprettelse (admin deaktiverer + opretter ny)

## Sync-flow

### Oprettelse

```
Admin form → createDiscountAction()
  → stripe.coupons.create({
       percent_off / amount_off,
       currency: 'dkk' (kun FIXED_AMOUNT),
       duration,
       duration_in_months,
       name: kode-tekst
     })
  → Gem i DB med stripeCouponId = coupon.id
```

Fejl i Stripe-kald → DB-record gemmes IKKE → admin ser fejlbesked.

### Deaktivering

Kun lokal (`isActive = false`). Stripe-coupon eksisterer stadig men bruges aldrig (vores validering blokerer).

### Sletning

Begge steder: `stripe.coupons.del(stripeCouponId)` + slet fra DB. Stripe-fejl logges men blokerer ikke DB-sletning.

### Redigering

Type/value er immutable. Andre felter (maxUses, validUntil, isActive, duration-felter) kan redigeres lokalt. Stripe-coupon opdateres IKKE (immutable i Stripe).

## Checkout-flow

```
POST /api/checkout med discountCode
  → validateDiscountCode(code, productId)
     returnerer { discountId, type, value, stripeCouponId }
  → stripe.checkout.sessions.create({
       discounts: [{ coupon: stripeCouponId }],
       metadata: { discountCodeId: discountId }
     })
```

## Usage tracking (webhook)

```
checkout.session.completed
  → session.metadata.discountCodeId
  → prisma.discountCode.update({
       where: { id },
       data: { currentUses: { increment: 1 } }
     })
```

Idempotency sikret af eksisterende webhook-dedup (stripeSessionId check).

## Admin UI-ændringer

1. **Nyt felt:** "Varighed for abonnementer" (once/repeating/forever)
2. **Type/værdi read-only** efter oprettelse
3. **Sync-status badge** på listen (grøn/rød baseret på stripeCouponId)

## Beslutningslog

| Beslutning | Alternativer | Valg | Begrundelse |
|---|---|---|---|
| Sync-strategi | Ved oprettelse vs. checkout | Ved oprettelse | Én kilde til sandhed |
| Produkttyper | Begge, kun single, kun sub | Begge | Mest fleksibelt |
| Sub-varighed | Fast, konfigurerbar | Konfigurerbar | Admin-fleksibilitet |
| Redigering | Tillad alt, deaktivér + ny | Deaktivér + ny | Matcher Stripe immutability |
| Tilgang | Direkte sync vs. promotion codes | Direkte sync | Beholder UI-kontrol |
| Duration-type | String vs. enum | String | Matcher Stripe direkte |
| Deaktivering | Lokal vs. Stripe-slet | Lokal toggle | Simpelt, genaktivering mulig |
| Sletning | Kun DB vs. begge | Begge | Clean state |

## Antagelser

- Stripe sandbox — ingen eksisterende rabatkoder at migrere
- Valuta altid DKK
- `value` for FIXED_AMOUNT er i øre (cents) i DB
- Rabatkoder oprettes på platform-konto, ikke connected accounts
