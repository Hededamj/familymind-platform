# FamilyMind Community Redesign

## Dato: 2026-03-07
## Status: GODKENDT 2026-03-07

---

## 1. Forståelsessammenfatning

### Hvad vi bygger
Et community med tre lag der fungerer som en value ladder: Facebook/IG som awareness-kanal, et gratis åbent community på FamilyMind-platformen, og betalte forløbs-kohorter.

### Hvorfor
For at øge lifetime value. De andre formål (støtte læring, modvirke frafald, skabe tilhørsforhold) er mekanismerne der driver LTV.

### Hvem det er for
Danske forældre i alle stadier — fra nysgerrige (Facebook) til engagerede (gratis community) til transformerende (betalte forløb).

### Nøglebegrænsninger
- Community-værdien SKAL leve på egen platform (ikke Facebook)
- SEO skal tænkes ind fra dag 1 — community-indhold skal drive organisk trafik
- Kohorte-modellen bevares for forløb, men community lever videre efter
- Skal fungere inden for eksisterende stack (Next.js, Prisma, Supabase)
- **Intet hardcodes** — alle tærskler, frekvenser, tekster og adfærd skal være admin-konfigurerbare via settings. Platformen er white label, og hver organisation skal kunne tilpasse community-oplevelsen

### Eksplicitte ikke-mål
- Vi bygger IKKE en Facebook-gruppe (Facebook er kun markedsføring)
- Vi bygger IKKE et realtids-chat-system (det er overkill for nu)
- Vi integrerer IKKE med Facebook API (manuelt indhold-flow)

---

## 2. Value Ladder — Tre lag

```
LAG 1: Facebook / Instagram (awareness)
   Formål: Reach, genkendelse, delbart indhold
   Indhold: Korte tips, relaterbare opslag, video-klip, testimonials
   Krav: Intet — åbent for alle
   SEO: Ingen direkte (social signals, brandkendskab)
         |
         v
LAG 2: FamilyMind åbent community (tilhørsforhold)
   Formål: Lead capture, tilhørsforhold, SEO, social proof
   Indhold: Diskussionsrum, spørgsmål, wins, ressourcer
   Krav: Gratis registrering
   SEO: Offentligt indekserbare sider (se SEO-sektion)
         |
         v
LAG 3: FamilyMind forløb + kohorter (transformation)
   Formål: Struktureret læring, accountability, lille gruppe
   Indhold: Forløbs-diskussioner, daglige prompts, check-ins
   Krav: Betalt abonnement (149 DKK/md)
   SEO: Bag login — ikke indekseret
         |
         v
LAG 3b: Alumni (retention)
   Formål: Fastholde efter forløb, social proof, mentoring
   Indhold: Fortsat adgang til åbent community + alumni-badge
   Krav: Har gennemført mindst ét forløb
   SEO: Alumni-bidrag i åbent community er indekserbare
```

---

## 3. SEO-strategi for community

### Princip
Åbent community-indhold skal være offentligt tilgængeligt og indekserbart. Det genererer long-tail trafik på søgninger som "hvornår skal mit barn sove alene" eller "grænser for 3-årig" — præcis de spørgsmål forældre googler.

### Teknisk implementation

#### Offentlige sider (indekserbare, INGEN login krævet)
- `/community` — oversigt over rum og populære diskussioner
- `/community/[rum-slug]` — diskussionsfeed for et specifikt rum
- `/community/[rum-slug]/[post-slug]` — enkelt opslag med svar

#### Post-slug-strategi (CTO S1)
Post-slug genereres automatisk fra opslagets body (da opslag ikke har titler):
- Format: `[uuid-prefix-8-tegn]-[auto-slug-fra-første-8-ord]`
- Eksempel: `a3f2b1c9-hvornaar-skal-barnet-sove-alene`
- UUID-prefix sikrer unikhed, slug-del giver SEO-værdi
- Slug genereres ved oprettelse og ændres ikke efterfølgende (stabile URLs)

#### GDPR og offentlig visning (CTO S2)
- Opslag i åbne rum er offentligt tilgængelige som default
- `isPublic` felt på DiscussionPost (default: true for åbne rum, false for kohorter)
- Offentlige opslag viser kun **fornavn** (aldrig email eller fuldt navn)
- Brugervilkår opdateres med: "Opslag i åbne fællesskabsrum er offentligt tilgængelige og kan indekseres af søgemaskiner"
- Brugere kan sætte `isPublic: false` på individuelle opslag (opt-out fra indeksering)

#### SEO-optimering
- Automatisk genererede `<title>` og `<meta description>` fra opslags-indhold
- Structured data markup (JSON-LD) med `DiscussionForumPosting` og `QAPage` schema
- Canonical URLs på alle community-sider
- Sitemap-generering for community-sider
- `rel="ugc"` på alle bruger-postede links
- `noindex` på sider med for lidt indhold (admin-konfigurerbar tærskel: min. tegn + min. antal svar)
- Breadcrumbs: Hjem > Community > [Rum] > [Opslag]

#### Rum-struktur (topic clusters)
- Hvert rum = et topic cluster
- Rum-siden fungerer som pillar page
- Individuelle opslag er cluster content
- Interne links mellem relaterede diskussioner

#### Indhold der driver trafik
- Diskussioner med spørgsmål + svar matcher Googles "People Also Ask"
- Automatiske diskussions-prompts (allerede bygget!) med SEO-venlige titler
- Admin kan "fremhæve" opslag → bedre synlighed i rum + sitemap-prioritet

### Hvad der IKKE er offentligt
- Kohorte-diskussioner (forløbs-bundet, bag login)
- Brugerens profil-detaljer
- Reaktioner og notifikationer

### Moderation og kvalitet
- `noindex` tag på nye opslag indtil de har mindst 1 svar (undgår thin content)
- Rapporteret indhold skjules fra indeks med det samme
- Admin kan markere opslag som "featured" for ekstra SEO-vægt

---

## 4. Åbent community — rum-design

### Foreslåede standard-rum

| Rum | Slug | Beskrivelse | Formål |
|-----|------|-------------|--------|
| Hverdagen som forælder | hverdagen | Del hverdagens op- og nedture | Tilhørsforhold, engagement |
| Spørgsmål & svar | spoergsmaal | Stil spørgsmål til andre forældre | SEO (long-tail), hjælp |
| Wins & fremskridt | wins | Del dine sejre, store som små | Social proof, motivation |
| Tips & ressourcer | tips | Del artikler, bøger, værktøjer | SEO, værdi |

### Rum-egenskaber
- Admin opretter/redigerer rum
- Hvert rum har: navn, slug, beskrivelse, ikon, sortering, synlighed (offentlig/kun-medlemmer)
- Rum kan arkiveres (soft delete)

---

## 5. Forløbs-kohorter (bevaret, justeret)

### Hvad der ændres
- Kohorte-community lever nu UNDER forløbet (som nu), men adgang forsvinder IKKE når forløbet slutter
- Alumni beholder læse-adgang til kohortens diskussioner
- Alumni kan fortsat poste i det åbne community med "Har gennemført [forløb]" badge

### Hvad der bevares
- Auto-oprettelse af kohorter
- Diskussions-prompts baseret på forløbsdag
- Moderering og rapportering
- Ugentlig community-digest

### Archival af gamle kohorter (CTO S5 — tech debt, ikke v1)
- Kohorte-diskussioner der er > 12 måneder gamle kan arkiveres (read-only, ingen nye svar)
- Implementeres ikke nu, men noteres som fremtidig optimering ved skala
- Alumni beholder læse-adgang til arkiverede kohorter

### Data-migrationsstrategi (CTO S8)
- Eksisterende kohorte-data forbliver som de er — ingen flytning
- Nye åbne rum starter tomme + forudfyldte prompts fra kø-systemet
- Brugere med aktivt forløb beholder deres kohorte-adgang uændret
- Ingen data-migration nødvendig — det er en ren udvidelse, ikke en erstatning

---

## 6. Bruger-oplevelse

### Ikke-logget-ind bruger (SEO-besøgende)
1. Lander på `/community/spoergsmaal/hvornaar-sover-barnet-selv`
2. Kan læse opslag + svar
3. Ser CTA: "Opret gratis konto for at deltage i samtalen"
4. Ser sidebar med relaterede diskussioner + forløbs-anbefalinger

### Gratis registreret bruger
1. Fuld adgang til åbne rum — kan poste, svare, reagere
2. Ser kohorte-diskussioner som låst indhold: "Starter du et forløb, får du adgang til en lille gruppe"
3. Modtager ugentlig community-digest (hvis aktiv)

### Betalende bruger (aktivt forløb)
1. Alt fra gratis + kohorte-rum for sit forløb
2. Diskussions-prompts, check-ins, forløbs-bundet samtale
3. Lille gruppe med accountability

### Alumni (afsluttet forløb)
1. Alt fra gratis + læse-adgang til gammel kohorte
2. Badge: "Har gennemført [Forløbsnavn]"
3. Kan fungere som uformel mentor i åbent community

---

## 6b. Notifikationer for åbent community (CTO S7)

Alle notifikationsindstillinger er **admin-konfigurerbare** via `/admin/settings/` — intet hardcodes.

### Admin-konfigurerbare indstillinger (community-notifikationer)

| Indstilling | Default | Konfigurerbar via |
|-------------|---------|-------------------|
| In-app notifikation ved svar på opslag | Til | Admin settings |
| Email-notifikation ved svar på opslag | Fra (opt-in for bruger) | Admin settings + bruger dashboard |
| Community-digest inkluderer åbne rum | Til | Admin settings |
| Community-digest frekvens | Ugentlig | Admin settings (daglig/ugentlig/månedlig/fra) |

### In-app notifikationer
- Svar på egne opslag → in-app notifikation (genbruger eksisterende `COMMUNITY_REPLY` type)
- Virker for både åbne rum og kohorter — samme mekanisme
- Admin kan slå til/fra globalt

### Email-notifikationer
- Svar på egne opslag → email er **opt-in** (bruger vælger selv i dashboard)
- Admin kan konfigurere om email-option overhovedet er tilgængelig
- Ugentlig community-digest udvides til at inkludere aktivitet i åbne rum (ikke kun kohorter)
- Digest-frekvens konfigurerbar af admin

### Bruger-præferencer
- Brugere kan slå email-notifikationer til/fra via dashboard-indstillinger (allerede bygget)
- Rum-niveau præferencer (mute/unmute pr. rum) er YAGNI for v1

---

## 7. Teknisk delta (hvad der skal ændres)

### Nuværende implementation
- Community kun under `/journeys/[slug]/community/`
- Kræver aktivt forløb + kohorte-medlemskab
- Ingen offentlige sider
- Ingen rum-koncept (kun ét feed pr. kohorte)

### Ny implementation kræver
1. **Ny route-struktur:** `/community/[rum]/[post]` (offentlig)
2. **Rum-model:** `CommunityRoom` (name, slug, description, isPublic, sortOrder)
3. **Opdateret post-model:** Posts kan tilhøre enten et rum ELLER en kohorte
4. **Offentlig visning:** Server-renderede sider uden auth-krav
5. **SEO-komponenter:** Meta tags, JSON-LD, sitemap, breadcrumbs
6. **CTA-komponenter:** "Opret konto" / "Start forløb" kontekstuel CTA
7. **Alumni-adgang:** Fjern hard-block på afsluttede forløbs kohorter
8. **Badge-system:** Vis gennemførte forløb på brugerens community-profil

### Hvad der kan genbruges
- `community.service.ts` — udvides med rum-logik
- Post/reply/reaction modeller — udvides med roomId
- Moderering — virker som den er
- Diskussions-prompts cron — kan udvides til åbne rum
- Community-digest — kan udvides til rum-aktivitet

---

## 8. Decision Log

| # | Beslutning | Alternativer | Begrundelse |
|---|-----------|-------------|-------------|
| D1 | Facebook/IG er markedsføring, ikke community | Bygge community på Facebook | Ejer ikke data, 1-5% reach, ingen monetisering, ingen SEO |
| D2 | Tre-lags value ladder (FB → gratis → betalt) | Kun betalt community | Research viser engagement før paywall → højere konvertering |
| D3 | Åbent community med fuld deltagelse for gratis brugere | Kun læse-adgang for gratis | 84% af community-aktivitet er medlem-til-medlem; passiv adgang skaber ikke tilhørsforhold |
| D4 | Community-indhold er offentligt/indekserbart | Alt bag login | SEO-potentiale: long-tail trafik fra forældrespørgsmål, UGC driver 87% mere organisk trafik i casestudier |
| D5 | Kohorter bevares for betalte forløb | Drop kohorter | 90% completion rate vs 10-15% for åbne kurser — kohorte-modellen virker for læring |
| D6 | Alumni beholder community-adgang + badge | Adgang stopper ved forløbsslut | Øger LTV, skaber social proof, mentoring for nye brugere |
| D7 | Rum-baseret struktur i åbent community | Ét stort feed | Topic clusters for SEO, bedre organisering, undgår informations-overload |
| D8 | Ingen post-grænse for gratis brugere | Progressiv tillid, daglig grænse | Hold det simpelt, stol på moderering og rapportering |
| D9 | MODERATOR-rolle fra start — kan moderere alle åbne rum (ikke kohorter). Kun ADMIN udnævner. Rum-specifik tildeling er YAGNI for v1 (CTO S3) | Kun admin, tilføj senere | Skalerer modereringen tidligt, aflaster admin |
| D10 | Alumni får automatisk adgang til åbent community | Opt-in invitation | Ingen friktion — de er allerede registrerede, community kræver kun det |
| D11 | 4 start-rum, admin kan oprette/redigere/slette frit | 2-3 rum | Dækker de vigtigste behov fra start, admin har fuld fleksibilitet |
| D12 | Prompt-kø-system til åbne rum | Kun kohorte-prompts, manuelle opslag, recurring temaer | Kritisk i opstart — admin frontloader 20-30 prompts, systemet poster automatisk. Simpelt at bygge |
| D13 | Opslag indekseres ved konfigurerbar tærskel (default: 50 tegn + 1 svar). Admin kan justere begge værdier via settings | Ingen krav, hardcodet tærskel | Undgår thin content penalty, sker automatisk, admin kan tilpasse |
| D14 | Tilføj `organizationId` på nye community-modeller (`CommunityRoom`, `RoomPromptQueue`) + `DiscussionPost` (da den nu kan tilhøre et rum). Resten (Journey, Product, Cohort osv.) er separat multi-tenant migration — noteret som tech debt (CTO S4) | Vent til white label bliver aktuelt | Konsistent med tenant-abstraktionsplan (2026-02-22). Scope nye queries med organizationId fra start uden at scope-creepe hele databasen |

---

## 9. Besvaret: Alle designspørgsmål afklaret

| Spørgsmål | Beslutning |
|-----------|-----------|
| Post-grænse for gratis brugere? | Ingen grænse (D8) |
| Moderator-roller? | Ja, MODERATOR-rolle fra start (D9) |
| Alumni-adgang? | Automatisk, ingen friktion (D10) |
| Antal start-rum? | 4 rum + admin kan oprette flere frit (D11) |
| Prompts i åbne rum? | Ja, via kø-system: admin forudfylder prompts, systemet poster automatisk (D12) |
| Indekserings-krav? | Mindst 50 tegn + mindst 1 svar (D13) |

### Standard-rum ved launch

| Rum | Slug | Beskrivelse |
|-----|------|-------------|
| Hverdagen som forælder | hverdagen | Del hverdagens op- og nedture |
| Spørgsmål & svar | spoergsmaal | Stil spørgsmål til andre forældre |
| Wins & fremskridt | wins | Del dine sejre, store som små |
| Tips & ressourcer | tips | Del artikler, bøger, værktøjer |

*Navne og beskrivelser kan redigeres af admin. Nye rum kan oprettes frit.*

### Prompt-kø-system (CTO S6 — detaljeret)

- Admin opretter prompts med: tekst, målrum, prioritet
- System poster automatisk fra køen
- Prompts postes som admin-bruger
- Køen kan forudfyldes med 20-30+ prompts inden launch
- **Når køen er tom:** Stopper — ingen loop, ingen genpostning

Alle prompt-kø-indstillinger er **admin-konfigurerbare**:

| Indstilling | Default | Konfigurerbar via |
|-------------|---------|-------------------|
| Frekvens pr. rum | Dagligt | Admin settings pr. rum (dagligt/ugentligt/fra) |
| Tidspunkt for posting | 08:00 | Admin settings (timeOfDay felt) |
| Pause/genoptag pr. rum | Aktiv | Admin kan pause/genoptage pr. rum |
| Prompt-forfatter | Første admin-bruger | Admin settings (vælg bruger) |

---

## 10. CTO Review — adresserede punkter

| # | Punkt | Status |
|---|-------|--------|
| S1 | Post-slug-strategi | Tilføjet i sektion 3 |
| S2 | GDPR / offentlig visning | Tilføjet i sektion 3 |
| S3 | Moderator-scope | Præciseret i D9 |
| S4 | organizationId scope | Afgrænset i D14 |
| S5 | Archival af gamle kohorter | Noteret som tech debt i sektion 5 |
| S6 | Prompt-kø detaljer | Specificeret i sektion 9 |
| S7 | Notifikationer for åbent community | Ny sektion 6b tilføjet |
| S8 | Data-migrationsstrategi | Tilføjet i sektion 5 |

---

## 11. Næste skridt

1. [x] Endelig godkendelse af dette design (2026-03-07)
2. [ ] Opdater brugervilkår med community/GDPR-tekst
3. [ ] Prioriter implementation (MVP: rum + offentlige sider + SEO + prompt-kø)
4. [ ] Planlæg migration af eksisterende community-kode
5. [ ] Forbered prompt-indhold til de 4 start-rum
6. [ ] Notér separat opgave: multi-tenant data migration (organizationId på Journey, Product, Cohort osv.)
