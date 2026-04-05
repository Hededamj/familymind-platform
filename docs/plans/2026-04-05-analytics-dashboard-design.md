# Analytics Dashboard — Design

**Dato:** 2026-04-05
**Status:** Godkendt
**Placering:** `/admin/analytics`

---

## Formål

Give organisationsejeren et samlet overblik over platformens sundhed, konvertering, økonomi og brugeradfærd — fra ét sted med 5 tabs.

## Primær bruger

Organisationsejeren (white-label scopet til egen organisation).

## Prioritet

1. Bruger-sundhed (retention, aktivitet, frafald)
2. Konvertering (signup → betaling → fastholdelse)
3. Økonomi (MRR, revenue, churn-cost)
4. Adfærd (indhold, tidspunkter, temaer)

## Krav

- **Real-time beregning** — ingen snapshots/caching
- **GDPR** — kun aggregerede/anonymiserede data, ingen personhenførbare oplysninger
- **White-label** — alle queries scopet til `organizationId`
- **Periodevalg** — 7d / 30d / 90d / 12m, default 30d
- **Visualisering** — shadcn/ui Charts (Recharts)
- **URL-baseret state** — `?tab=health&period=30d` (bookmarkable)

## Non-goals

- Individuelle brugerdata på analytics-siden
- Sammenligning mellem organisationer
- Eksport-funktionalitet (kan tilføjes senere)
- Caching/snapshot-optimering (unødvendigt ved 300 brugere)

---

## Tab-struktur

### 1. Overblik (default)

Executive summary — "går det godt?" på 5 sekunder.

**Top-række: 4 KPI-kort med sparkline-trend**
- Aktive medlemmer (lastActiveAt < 7 dage)
- Churn rate (% opsagte denne måned, ændring vs. forrige)
- MRR (aktive abonnementer × pris, med trend)
- Onboarding-rate (% quiz gennemført af nye signups)

**Lækage-tragt (visuelt)**
- Horisontalt funnel: Signup → Onboarding → Køb → Aktiv → 30d retention
- Hvert trin: antal + drop-off %

### 2. Sundhed

**Medlemsstatus-fordeling**
- Donut chart: Prøve, Aktiv, Inaktiv, Frafaldne (antal + %)

**Retention-kurve**
- Line chart: % aktive efter 0, 7, 14, 30, 60, 90 dage
- Grupperet per månedskohorte

**Churn-trend**
- Bar chart: antal opsagte per uge/måned
- Linje overlay: churn rate %

**Lækage-rapport (tabel)**

| Segment | Beskrivelse |
|---------|-------------|
| Aldrig onboardet | Signup men ingen quiz |
| Onboardet, aldrig købt | Quiz færdig, intet køb |
| Købt, aldrig engageret | Abonnement men 0 indhold set |
| Faldende engagement | Var aktiv, nu >10 dage inaktiv |

Hvert segment klikbart → `/admin/users` med filter forudvalgt.

### 3. Konvertering

**Konverteringstragt (visuelt)**
- Vertikal funnel, 5 trin:
  1. Signup — nye brugere i perioden
  2. Onboarding gennemført — `onboardingCompleted = true`
  3. Første køb — mindst én Entitlement
  4. Aktiv bruger — `lastActiveAt` < 7 dage efter køb
  5. Fastholdt 30d — stadig aktiv 30 dage efter køb
- Konverteringsrate + drop-off mellem hvert trin

**Konverteringsrate over tid**
- Line chart: signup→køb rate per uge/måned

**Tid til konvertering**
- Median dage: signup → onboarding gennemført
- Median dage: signup → første køb
- Tal-kort med trend-pil vs. forrige periode

### 4. Økonomi

**MRR-kort**
- Nuværende MRR (stort tal)
- Ny MRR (nye abonnementer i perioden)
- Mistet MRR (opsagte i perioden)
- Netto MRR-ændring (farvekode grøn/rød)

**MRR-trend**
- Area chart over tid

**Omsætning per produkt**
- Bar chart: fordelt på produkter

**Nøgletal (kort-række)**
- Gennemsnitlig LTV (total omsætning / unikke betalende)
- Gennemsnitlig levetid (median dage fra køb til churn)
- Revenue per bruger (MRR / aktive)

Note: Beregnes fra egne modeller (Entitlement + Product), ikke Stripe API.

### 5. Adfærd

**Populært indhold (tabel)**
- Top 10 mest gennemførte ContentUnits
- Kolonner: Titel, Type, Antal fuldført, Gns. completion rate

**Aktivitet over døgnet**
- Bar chart: interaktioner per time (0-23)

**Populære temaer**
- Horisontalt bar chart: interaktioner per ContentTag

**Engagement-mønstre**
- Line chart: gns. interaktioner per bruger per uge

**Community-aktivitet**
- Kort-række: nye indlæg, antal svar, mest aktive rum

---

## Teknisk arkitektur

### Filstruktur

```
app/admin/analytics/
  page.tsx                          — server page, læser ?tab og ?period
  _components/
    analytics-tabs.tsx              — client-side tab-navigation
    period-selector.tsx             — 7d/30d/90d/12m vælger
    overview-tab.tsx
    health-tab.tsx
    conversion-tab.tsx
    economy-tab.tsx
    behavior-tab.tsx
lib/services/
  analytics.service.ts              — alle queries, scopet til organizationId
```

### Service-funktioner

- `getOverviewStats(orgId, period)` — KPI-kort + lækage-tragt
- `getHealthStats(orgId, period)` — statusfordeling, retention-kohorter, churn-trend, lækage
- `getConversionStats(orgId, period)` — tragt, rate over tid, tid til konvertering
- `getEconomyStats(orgId, period)` — MRR, trend, per produkt, nøgletal
- `getBehaviorStats(orgId, period)` — populært indhold, døgn, temaer, engagement, community

### Datakilder

| Data | Kilde |
|------|-------|
| Bruger-status | `User.lastActiveAt` + `computeUserStatus()` |
| Onboarding | `User.onboardingCompleted` |
| Abonnementer | `Entitlement` (stripeSubscriptionId, status, createdAt) |
| Indhold | `UserContentProgress` (completedAt, updatedAt) |
| Produktpriser | `Product` (price, pricingType) |
| Community | `DiscussionPost` (createdAt, roomId) |
| Tags/temaer | `ContentUnitTag` → `ContentTag` |

### Principper

- Alle queries filtrerer på `organizationId`
- Periodevalg som URL search param: `?period=30d`
- Tab som URL search param: `?tab=health`
- Ingen persondata i responses
- Følger eksisterende service layer-mønster

---

## Decision Log

| # | Beslutning | Alternativer | Begrundelse |
|---|-----------|-------------|-------------|
| 1 | Prioritet: Sundhed → Konvertering → Økonomi → Adfærd | Økonomi først | Medlemsforretning drives af retention |
| 2 | Organisationsejer som primær bruger (white-label) | Kun founder | Fremtidssikret |
| 3 | Real-time beregning | Daglige snapshots | 300 brugere, YAGNI |
| 4 | shadcn/ui Charts (Recharts) | Kun tal/tabeller | Trends kræver grafer |
| 5 | Kun aggregerede data (GDPR) | Individuelle data | Lovkrav |
| 6 | Én side med 5 tabs | Separate sider | Ét sted for indsigt, let krydse perspektiver |
| 7 | Service layer + server-side + URL-params | Client tabs / Hybrid | Følger mønster, simpel, bookmarkable |
