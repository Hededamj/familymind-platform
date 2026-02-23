# Cookie Consent & Privacy — Design

## Formål

Implementere cookie consent banner, GA4 + Meta pixel integration, og juridiske sider (privatlivspolitik, cookiepolitik, vilkår) for GDPR/ePrivacy compliance.

## Cookie-kategorier

| Kategori | Cookies | Kræver samtykke |
|----------|---------|-----------------|
| **Nødvendige** | Supabase auth session, Sentry (fejlovervågning), `cookie_consent` | Nej |
| **Statistik** | GA4 (`_ga`, `_ga_*`) | Ja |
| **Marketing** | Meta pixel (`_fbp`, `_fbc`) | Ja |

## Consent-flow

1. Bruger lander → cookie banner vises i bunden (non-blocking)
2. Tre valg: "Acceptér alle" (primary), "Kun nødvendige" (outline), "Tilpas" (ghost)
3. "Tilpas" åbner modal med toggles for Statistik og Marketing (Nødvendige disabled/altid on)
4. Samtykke gemmes i `cookie_consent` cookie (JSON, 12 mdr udløb)
5. GA4/Meta pixel loades KUN hvis samtykke er givet for den kategori
6. Bruger kan ændre via "Cookieindstillinger" link i footer

## Consent-lagring

### Cookie (client-side)

```json
{
  "necessary": true,
  "statistics": false,
  "marketing": true,
  "timestamp": "2026-02-23T12:00:00Z"
}
```

### Database (server-side log)

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

## Teknisk arkitektur

### Script-loading

GA4 og Meta pixel loades via Next.js `<Script strategy="afterInteractive">` betinget på consent-state. Ved ændring af samtykke reloades siden.

### Komponenter

| Komponent | Type | Ansvar |
|-----------|------|--------|
| `components/consent/consent-provider.tsx` | Client | React Context med consent-state, `updateConsent()` |
| `components/consent/cookie-banner.tsx` | Client | Banner i bunden, tre knapper |
| `components/consent/cookie-modal.tsx` | Client | Modal med toggles per kategori |
| `components/consent/analytics-scripts.tsx` | Client | Betinget `<Script>` loading |
| `lib/services/consent.service.ts` | Server | Consent-logning til DB |

### Integration i root layout

```tsx
<ConsentProvider>
  <AnalyticsScripts />
  {children}
  <CookieBanner />
</ConsentProvider>
```

## UI-design

### Cookie banner

- Fast positioneret i bunden, kompakt
- Tekst: "Vi bruger cookies til statistik og markedsføring."
- Link til cookiepolitik
- Tre knapper: Acceptér alle, Kun nødvendige, Tilpas
- Mobile-first: knapper stacker vertikalt på mobil
- Ingen overlay (non-blocking)

### Tilpas-modal

- Tre sektioner med toggles
- Nødvendige: disabled (altid on)
- Statistik: toggle + beskrivelse
- Marketing: toggle + beskrivelse
- Knapper: Gem valg, Acceptér alle
- Standard shadcn/ui Dialog med overlay

## Juridiske sider

| Route | Indhold |
|-------|---------|
| `/privatlivspolitik` | Dataansvarlig, indsamling, formål, retsgrundlag, opbevaring, rettigheder, kontakt |
| `/cookiepolitik` | Kategorier, cookie-liste (navn, formål, udløb, udbyder), link til indstillinger |
| `/vilkaar` | Brugsvilkår, abonnement, betaling, refundering, ansvar, opsigelse |

Statiske sider med `[INDSÆT]` markers for juridiske detaljer (CVR, adresse, kontaktmail).

## Footer-opdatering

Tilføj links: Privatlivspolitik, Cookiepolitik, Vilkår, Cookieindstillinger (trigger modal).

## Env vars

- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` — GA4 measurement ID
- `NEXT_PUBLIC_META_PIXEL_ID` — Meta pixel ID
