# Marketing Agent — Design Spec

**Dato:** 2026-04-18
**Stakeholder:** Jacob Hummel / Mette Hummel
**Status:** Udkast til godkendelse

---

## Formål

Bygge et marketing-system der hjælper Mette Hummel Academy (og FamilyMind som tillæg) med at drive Meta-annoncering og organisk tilstedeværelse. Systemet skal:

1. **Aflaste drift** — automatisk overvåge, pause underperformere og justere budgetter inden for sikre grænser
2. **Forslå ny copy + nye annoncer** — sammensat udelukkende af verbatim-uddrag fra Mettes eget materiale
3. **Overvåge konkurrenter og trends** — Meta Ad Library + parenting-nyheder
4. **Udkaste organiske posts** på Facebook og Instagram baseret på trends + brand voice
5. **Bevare Mettes stemme** — aldrig fabrikere tekst, altid autentisk, Mette godkender alt kreativt

Systemet skal kunne udvikle sig i takt med at Mette udvikler sig: soul og memory er redigerbare og versionskontrollerede.

---

## Scope og ikke-scope

### I scope
- Meta Ads (Facebook + Instagram paid)
- Facebook Page organic posts
- Instagram organic posts (feed, ikke reels/stories i fase 4 — kan tilføjes)
- Meta Ad Library konkurrent-scanning
- Google News / trends i parenting-feltet
- Slack som approval-kanal (fase 1-4)
- FamilyMind admin som approval-kanal (fase 5)

### Ikke i scope (eksplicit udskudt)
- Google Ads, LinkedIn Ads, TikTok Ads
- Email-marketing (separat system)
- SEO / blog-content
- Multi-tenancy (kun Mettes forretning)
- Native app notifikationer
- Automatisk AI-billedgenerering (kræver separat brand-gate)

---

## Grundprincipper

Disse principper er bindende. De begrænser designet bevidst for at bevare brand-integritet.

### 1. Verbatim-reglen
Agenten må aldrig opfinde tekst på annoncer, salgssider eller organiske posts. Al copy komponeres ved at **vælge og sammensætte** uddrag fra et indekseret corpus af Mettes eget materiale. Tilladte connective-ord er eksplicit hvidlistede.

### 2. Drift autonomt, kreativt med godkendelse
Operationelle ændringer (pause, budget-justering inden for grænser) kører autonomt. Alle kreative ændringer (ny copy, ny målgruppe, ny kampagne, nye posts) kræver Mettes godkendelse.

### 3. Mette forbliver forfatteren
Agenten er redaktør og assistent, aldrig ghostwriter. Kundernes tilknytning er til Mette, ikke til systemet.

### 4. Soul og memory udvikler sig
Mette skal kunne redigere soul-dokumentet, corpus, taboos og touchstones direkte — i Slack (fase 1-4) eller admin UI (fase 5). Hver afvisning med kommentar genererer et automatisk forslag til amendment.

### 5. Credentials forbliver hos os
Alle API-tokens (Meta, Slack, Claude) opbevares som Vercel encrypted env vars. MCP-servere kører selv-hostet in-process, ikke via tredjeparts-hosting.

### 6. Brand > kortsigtet ROAS
Hvis en performance-vinder drifter fra soul-dokumentet, droppes den alligevel. Performance-scoring vægter brand-alignment.

---

## Arkitektur — overordnet

```
[Vercel Cron]  ──┬── daglig 06:00 ──► /api/marketing/cron/daily
                 └── ugentlig mandag 07:00 ──► /api/marketing/cron/weekly
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Orchestrator         │
                    │  (Next.js API route)   │
                    └──────────┬────────────┘
                               │ Claude API m/ tool-use
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
      [Meta Ads MCP]   [Google News MCP]  [Ad Library MCP]
      [FB Pages MCP]    (self-hosted stdio subprocesses)
      [Instagram MCP]
                               │
                               ▼
                    ┌───────────────────────┐
                    │  Neon Postgres         │
                    │  - decisions_log       │
                    │  - drafts_queue        │
                    │  - corpus_entries      │
                    │  - performance_snaps   │
                    │  - mette_feedback      │
                    └──────────┬────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
        [Slack Block Kit]              [Resend Email]
        - drafts m/ godkend-knap        (fallback-rapport)
        - slash-commands
        - /soul-note, /corpus-add,
          /taboo-add, /feels-off
                ▼
        [Mette godkender/afviser]
                │
                ▼
        POST /api/marketing/slack/interactions
                │
                ▼
        Orchestrator publicerer via MCP
```

---

## Komponenter

### Living Knowledge Base
Mette-redigerbar, git-versioneret. Ligger i `familymind-platform/marketing-agent/knowledge/`:

- **`soul.md`** — Mettes kerne: oprindelsen, læseren, overbevisninger, æstetik, tabuer, indsats. Skrives i fase 0.
- **`touchstones.md`** — Referencer til Mettes egne peak-arbejder, hvorfor de virker. Bruges som gravitational centre for agentens copy-valg.
- **`taboos.md`** — Forbudte mønstre (shame-marketing, urgency-manipulation, quick-fix-sprog). Voksende liste.
- **`memory.md`** — Agentens akkumulerede indsigter om målgruppen, hvad der virker, hvad der ikke virker. Redigerbar af Mette.
- **`corpus/`** — Verbatim-kildemateriale, organiseret per type:
  - `sales-pages/` — masterclass-salgssider
  - `emails/` — email-sekvenser
  - `social/` — IG-captions, FB-posts
  - `webinars/` — transcripts
  - `index.json` — metadata og tags per entry

### MCP-servere (vendored forks)
Alle kører som stdio-subprocesses fra orchestrator. Ligger i `marketing-agent/mcp-servers/`:

- **`meta-ads/`** — fork af `hashcott/meta-ads-mcp-server` (MIT, TypeScript, Graph API v22). Valgt over Pipeboard pga. MIT-licens og bedre til selvhost.
- **`facebook/`** — fork af `HagaiHen/facebook-mcp-server` (MIT). Posts, scheduling, comments.
- **`instagram/`** — fork af `mcpware/instagram-mcp`. Posts, carousels, hashtag-research.
- **`google-news/`** — fork af `jmanek/google-news-trends-mcp`. Google News RSS + Google Trends.

Apify's Facebook Ad Library Scraper bruges som remote service (pay-per-use), da data er offentlige og ingen Meta-credentials sendes.

### Orchestrator
`marketing-agent/orchestrator/` — Next.js API routes + delte moduler:

- **`agents/drift.ts`** — daglig performance-scan, safety-net ændringer
- **`agents/copy-drafter.ts`** — corpus-retrieval, draft-komposition, provenance-validering
- **`agents/intelligence.ts`** — konkurrent-scan (Ad Library), news-scan (Google News), ugentlig syntese
- **`agents/organic.ts`** — FB/IG post-drafts baseret på intelligence + brand voice
- **`safety-net.ts`** — rene regler som TypeScript, unit-testet, ingen LLM-fortolkning
- **`provenance.ts`** — fuzzy-match validering (>90% threshold) mod corpus
- **`mcp-client.ts`** — spawner MCP-subprocesses, håndterer stdio-kommunikation
- **`claude.ts`** — Claude API wrapper m/ tool-use loop

### Slack-lag
`marketing-agent/slack/`:

- **`bot.ts`** — @slack/bolt app, håndterer slash-commands og interactions
- **`interactions.ts`** — webhook-handler for knap-klik
- **`blocks/`** — Block Kit-templates per draft-type
- Slash-commands: `/soul-note`, `/corpus-add`, `/taboo-add`, `/feels-off`, `/status`

### Database (Prisma, udvider eksisterende schema)

```prisma
model MarketingDecision {
  id           String   @id @default(cuid())
  campaignId   String
  action       String   // "pause", "budget_increase", "budget_decrease"
  before       Json     // snapshot før ændring
  after        Json     // snapshot efter ændring
  reasoning    String   @db.Text
  automated    Boolean  @default(true)
  createdAt    DateTime @default(now())
}

model MarketingDraft {
  id             String   @id @default(cuid())
  type           String   // "ad_copy", "fb_post", "ig_post", "new_campaign"
  status         String   // "pending", "approved", "rejected", "edit_requested"
  content        Json     // full draft m/ metadata
  provenance     Json     // per-sentence source refs
  slackMessageTs String?  // reference til Slack-besked
  rejectReason   String?  @db.Text
  approvedAt     DateTime?
  publishedAt    DateTime?
  externalId     String?  // Meta ad/post ID efter publish
  createdAt      DateTime @default(now())
}

model CorpusEntry {
  id          String   @id @default(cuid())
  source      String   // URL eller filsti
  type        String   // "sales_page", "email", "ig_caption", "fb_post", "webinar"
  content     String   @db.Text
  embedding   Unsupported("vector(1536)")?
  tags        String[] // ["teenage", "conflict", "empathy"]
  performance Float?   // beregnet score hvis brugt i annonce
  addedBy     String   // "mette" | "jacob" | "slack_command"
  createdAt   DateTime @default(now())
}

model PerformanceSnapshot {
  id           String   @id @default(cuid())
  campaignId   String
  adId         String?
  date         DateTime @db.Date
  impressions  Int
  clicks       Int
  spend        Float
  conversions  Int
  revenue      Float?
  metrics      Json     // fulde metrics fra Meta
  @@unique([campaignId, adId, date])
}

model MetteFeedback {
  id             String   @id @default(cuid())
  draftId        String
  feedback       String   @db.Text
  proposedSoulAmendment String? @db.Text
  accepted       Boolean?
  createdAt      DateTime @default(now())
}
```

---

## Copy-generering i detaljer

### Retrieval → Composition → Validation

1. **Retrieval (pgvector):** Agent får objektiv (fx "masterclass om teenage-konflikter, målgruppe mødre 35-50"). Embedding-søgning returnerer 5-10 relevante corpus-excerpts rangeret efter similarity + performance-score + touchstone-boost.

2. **Composition (Claude API):** Claude får: soul.md + touchstones.md + taboos.md + de hentede excerpts. Instruks: "Komponér annonce ved at vælge 2-4 fraser/sætninger fra excerpts. Du må kun tilføje disse bindeord: og, men, fordi, så, her, det, denne, når, hvis."

3. **Provenance-validering:** Hver non-trivial frase i draftet matches mod corpus (fuzzy >90%). Hvis noget er fabrikeret → draft afvises internt, Claude kaldes igen med feedback. Max 3 forsøg, ellers rejses error og ingen draft sendes til Slack.

4. **Soul-screening:** Second Claude-call scorer draftet mod soul.md og taboos.md (0-10). Hvis score <7 eller taboo triggeres → markér med rødt flag i Slack-rapporten.

5. **Output til Slack:** Draft + per-sætning provenance-refs + soul-score + objektiv-match. Mette ser "hvorfor tror agenten det virker" før hun godkender.

### Connective-whitelist (hårdkodet)
`og, men, fordi, så, her, det, denne, når, hvis, også, ikke, med, for, om`

Alt andet non-trivialt skal være traceable.

---

## Safety-net for drift-agenten

Implementeret som rene TypeScript-regler i `safety-net.ts`, unit-testet.

| Regel | Grænse |
|---|---|
| Max dagligt forbrug (agent-initieret) | 300 kr før approval kræves |
| Budget-ændring per kampagne | ±20% per dag, ±50% akkumuleret over rullende 7 dage |
| Minimum data før beslutning | 3 dage **og** 1.000 impressions |
| Må pause annoncer | Ja |
| Må slette annoncer | Nej (kun pause) |
| Må ændre målgruppe | Nej (kræver approval) |
| Må oprette ny kampagne | Nej (kræver approval med fuld draft) |
| Må ændre creative (copy/billede) | Nej (kræver approval) |
| Kill-switch | >5 ændringer/dag → agent stopper og alerter |
| Anomali-detection | Spend >50% over 7-dages gennemsnit → pause + alert |

Alle regler testes med unit-tests inden agenten får live adgang.

---

## Approval-gates

| Handling | Autonom | Slack-approval |
|---|:-:|:-:|
| Pause underperformer | ✓ | — |
| Juster budget ±20% | ✓ | — |
| Budget-ændring >20% eller >500 kr | — | ✓ |
| Ny copy/draft | — | ✓ |
| Målgruppe-ændring | — | ✓ |
| Ny kampagne | — | ✓ |
| Organic post (FB/IG) | — | ✓ |
| Soul/corpus/taboo-ændring | — | ✓ (via slash-command bekræftelse) |

---

## Feedback-loop: soul udvikler sig

```
Agent drafter → Slack-approval
     ↓
Mette afviser m/ /feels-off "tonen er for sælgende"
     ↓
Orchestrator genererer amendment-forslag til soul.md/taboos.md
     ↓
Slack-besked: "Foreslået tilføjelse til taboos.md: ... — Godkend/Rediger/Afvis"
     ↓
Mette godkender → git commit: "soul: læring fra Mette 2026-04-23"
     ↓
Næste draft bruger den opdaterede soul
```

Hvert kvartal: Mette reviewer hvad agenten har sendt ud, markerer "off"-mønstre, soul opdateres bredere.

---

## Faser og leverancer

### Fase 0 — Soul Session (4-6 timer + 1-2 dage destillation)
**Leverancer:**
- `soul.md` v1 — oprindelse, læser, overbevisninger, æstetik, tabuer, indsats
- `touchstones.md` v1 — 10 peak-arbejder med analyse
- `taboos.md` v1 — initial forbudt-liste
- `corpus/` med ~10 kerne-tekster indekseret i DB

**Fremgangsmåde:**
- **Session 1 (90 min, Mette + Jacob):** Oprindelsen, læseren, overbevisninger. Optages.
- **Session 2 (60 min):** Æstetik, tabuer, touchstones. Konkrete eksempler gennemgås.
- **Destillation:** Whisper-transskription → Claude struktureret prompt → første udkast af `soul.md` → Mette retter og godkender.

**Interview-guide:** Separat bilag (`docs/superpowers/specs/2026-04-18-soul-interview-guide.md`, skrives sammen med implementerings-plan).

### Fase 1 — Drift-agent (3-4 dage)
**Leverancer:**
- Self-hosted Meta Ads MCP (vendored fork)
- Orchestrator daglig cron m/ read + drift
- Safety-net regler implementeret + unit-testet
- Slack bot m/ daglig rapport (read-only drafts, ingen creation endnu)
- `decisions_log` + `performance_snapshots` DB-tabeller aktive

**Afgrænsning:** Ingen creation, ingen copy-generering. Kun pause/budget-justering inden for safety-net.

### Fase 2 — Copy-drafter (4-6 dage)
**Leverancer:**
- `corpus_entries` DB-tabel + pgvector-indeksering
- `/corpus-add` slash-command
- Retrieval + composition + provenance-validering
- Ny-annonce approval-flow i Slack
- Publish via Meta MCP efter approval

### Fase 3 — Intelligence (3-5 dage)
**Leverancer:**
- Apify Ad Library integration (konkurrent-ads)
- Google News MCP integration
- Ugentlig syntese-rapport i Slack (mandag 07:00)
- Trends-data gemt til brug i fase 4

### Fase 4 — Organic posts (3-5 dage)
**Leverancer:**
- FB Pages MCP + Instagram MCP integration
- Post-draft generator baseret på trends + brand voice
- Schedule-approval flow i Slack
- Publish + scheduling via MCPs

### Fase 5 — Admin-migration (5-7 dage, senere)
**Leverancer:**
- Admin UI under `(admin)/marketing/` i FamilyMind
- Rich soul.md editor m/ diff-view
- Corpus-browser m/ tag-filtrering
- Performance-dashboard
- Draft-kø m/ approve/reject direkte i UI
- Slack bliver sekundær notifikationskanal

**Total til fase 4 fuldt live:** ~3-4 ugers udvikling + Mettes Soul Session.

---

## Tech-stack

| Lag | Teknologi | Status |
|---|---|---|
| Web/API | Next.js 14 App Router | Eksisterende |
| Database | Neon Postgres + Prisma | Eksisterende |
| Scheduling | Vercel Cron | Eksisterende |
| AI reasoning | Claude API (`@anthropic-ai/sdk`) | Ny dependency |
| MCP-klient | `@modelcontextprotocol/sdk` | Ny |
| Slack | `@slack/bolt` | Ny |
| Email (fallback) | Resend | Eksisterende |
| Vector search | `pgvector` extension | Ny |
| Fuzzy-match | `fastest-levenshtein` | Ny |
| Transskription (fase 0) | OpenAI Whisper / lokal model | Engangs-brug |

---

## Credentials og sikkerhed

- Alle tokens i Vercel encrypted env vars
- `.env.local` for dev (i `.gitignore`)
- MCP-servere kører in-process på Vercel + lokalt dev
- Slack webhook verificeres m/ signing secret på hver request
- Meta Business app i development mode til start, submit til review når stabil
- Claude API key roteres kvartalsvist
- Audit log: alle MCP-kald logges m/ timestamp, tool, parametre, resultat

---

## Testing-strategi

- **Unit-tests:** `safety-net.ts`, `provenance.ts` — rene regler, 100% coverage påkrævet
- **Integration-tests:** MCP-client → mock MCP-server, verificer tool-calls
- **Contract-tests:** MCP-servere mod faste fixtures (når vi fork'er, tjek at tool-signaturer er stabile)
- **E2E dry-run:** Første uge kører drift-agent i "observe only"-mode — den logger hvad den *ville* gøre uden at gøre det
- **Shadow-mode copy-drafter:** Første uge efter fase 2, drafts sendes kun til Jacob (ikke Mette) for intern kvalitets-check
- **Live budget-grænse:** Første måned max 50 kr/dag autonome ændringer, derefter løft til 300 kr

---

## Risici og mitigation

| Risiko | Mitigation |
|---|---|
| MCP-upstream breaking changes | Vendored forks, ikke direct deps. Contract-tests fanger ændringer. |
| Meta API rate limits | Orchestrator implementerer exponential backoff, daglig scan fordeles over 30 min. |
| Agent laver dumme drift-beslutninger | Dry-run første uge, budget-grænser gradueret, kill-switch på 5 ændringer/dag. |
| Copy drifter fra brand over tid | Soul-screening før hver draft, kvartalsvis soul-review, performance-scoring vægter brand-alignment. |
| Mette bliver overvældet af approvals | Slack digest 1 gang daglig (ikke per draft), batching af drafts, tidsestimat på hver draft. |
| Corpus bliver forældet | Kvartalsvis reminder til Mette om at tilføje nyt materiale, `/corpus-add` slash-command er lavfriktion. |
| Slack-approval-flow single point of failure | Email-fallback via Resend hvis Slack er nede. |
| Meta tokens udløber | Automatisk refresh-flow, alert 7 dage inden udløb. |

---

## Åbne spørgsmål (besvares i planning-fase)

- **Pgvector embeddings model:** OpenAI `text-embedding-3-small` vs. lokal (Voyage AI / Cohere)? Afvejning cost vs. data-eksfiltration.
- **Claude model-valg per agent:** Opus til copy (kvalitet), Haiku til drift (hastighed, pris)? Eller Sonnet overalt?
- **Soul Session booking:** Hvornår kan Mette afsætte 4-6 timer?
- **Ad Library-scraping hyppighed:** Dagligt vs. ugentligt (koster på Apify pay-per-use)?
- **Hvilke konkurrenter skal scannes?** Liste skal leveres af Mette som del af fase 3 kickoff.

---

## Succes-kriterier

Systemet er en succes når:

1. **Fase 1:** Mette siger "jeg stoler på den med drift" efter 2 ugers daglig brug.
2. **Fase 2:** Mindst 60% af copy-drafts godkendes uden redigering. Drafts føles som Mette (subjektiv vurdering).
3. **Fase 3:** Mindst én actionable indsigt per ugentlig intelligence-rapport.
4. **Fase 4:** Organic posts føles autentiske — ingen klager fra Mettes community om "AI-agtigt indhold".
5. **Overordnet:** Mette bruger 50-70% mindre tid på Meta-drift end før, uden at ROAS falder.
