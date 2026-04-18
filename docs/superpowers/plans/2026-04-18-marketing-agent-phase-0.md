# Marketing Agent — Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the `marketing-agent/` module, produce the Soul Session interview guide, build the ingestion CLIs (transcription, destillation, corpus ingestion), and deliver a runbook so Jacob can execute Soul Session with Mette and ingest the first corpus entries.

**Architecture:** A new top-level `marketing-agent/` folder inside `familymind-platform/` that holds knowledge documents (soul, touchstones, taboos, memory, corpus) and TypeScript CLI scripts. Shared utilities (embedding, scraping, Claude wrapper) live under `src/lib/marketing/`. Database gains one new Prisma model (`CorpusEntry`) with pgvector for embeddings. No runtime web endpoints yet — Phase 0 is entirely offline/CLI work.

**Tech Stack:** TypeScript, Next.js 16 (existing), Prisma 6 (existing), Vitest (existing), OpenAI SDK (new — Whisper + embeddings), Anthropic SDK (new — destillation), cheerio (new — scrape), tsx (new — CLI execution), pgvector Postgres extension (new).

**Spec reference:** `docs/superpowers/specs/2026-04-18-marketing-agent-design.md` — Fase 0.

---

## File Structure After Phase 0

```
familymind-platform/
├── marketing-agent/
│   ├── README.md
│   ├── knowledge/
│   │   ├── README.md
│   │   ├── soul.md                (template, to be filled in Soul Session)
│   │   ├── touchstones.md         (template)
│   │   ├── taboos.md              (template)
│   │   ├── memory.md              (template)
│   │   └── corpus/
│   │       ├── sales-pages/       (.gitkeep)
│   │       ├── emails/            (.gitkeep)
│   │       ├── social/            (.gitkeep)
│   │       └── webinars/          (.gitkeep)
│   └── scripts/
│       ├── transcribe.ts          (CLI: audio file → text transcript)
│       ├── destill-soul.ts        (CLI: transcript → soul.md draft)
│       └── corpus-add.ts          (CLI: URL → corpus entry in DB)
├── docs/superpowers/specs/
│   └── 2026-04-18-soul-interview-guide.md   (guide Jacob uses with Mette)
├── docs/superpowers/runbooks/
│   └── 2026-04-18-soul-session-runbook.md   (step-by-step for Jacob)
├── prisma/
│   └── schema.prisma              (add CorpusEntry model + enable pgvector)
├── src/lib/marketing/
│   ├── embed.ts                   (OpenAI embedding wrapper)
│   ├── scrape.ts                  (URL → text)
│   ├── claude.ts                  (Anthropic SDK wrapper)
│   └── whisper.ts                 (OpenAI Whisper wrapper)
└── tests/lib/marketing/
    ├── embed.test.ts
    ├── scrape.test.ts
    ├── claude.test.ts
    └── whisper.test.ts
```

---

## Task 1: Scaffold `marketing-agent/` folder and knowledge templates

**Files:**
- Create: `marketing-agent/README.md`
- Create: `marketing-agent/knowledge/README.md`
- Create: `marketing-agent/knowledge/soul.md`
- Create: `marketing-agent/knowledge/touchstones.md`
- Create: `marketing-agent/knowledge/taboos.md`
- Create: `marketing-agent/knowledge/memory.md`
- Create: `marketing-agent/knowledge/corpus/sales-pages/.gitkeep`
- Create: `marketing-agent/knowledge/corpus/emails/.gitkeep`
- Create: `marketing-agent/knowledge/corpus/social/.gitkeep`
- Create: `marketing-agent/knowledge/corpus/webinars/.gitkeep`

- [ ] **Step 1: Create marketing-agent/README.md**

```markdown
# marketing-agent

Implementation of the AI marketing agent described in
`docs/superpowers/specs/2026-04-18-marketing-agent-design.md`.

## Structure

- `knowledge/` — Mette-editable source of truth. Git-versioned. Never modified by the agent without a recorded Slack approval.
- `scripts/` — CLI utilities (transcribe, destill, corpus ingestion).
- `orchestrator/` — Runtime agents (added in Phase 1+).
- `mcp-servers/` — Self-hosted MCP forks (added in Phase 1+).

## Phase status

- [x] Phase 0 — Soul Session tooling
- [ ] Phase 1 — Drift agent
- [ ] Phase 2 — Copy-drafter
- [ ] Phase 3 — Intelligence
- [ ] Phase 4 — Organic posts
- [ ] Phase 5 — Admin migration
```

- [ ] **Step 2: Create marketing-agent/knowledge/README.md**

```markdown
# knowledge

Mette's voice, codified. This directory is the source of truth the
agent reasons from. It must only contain content Mette has approved.

## Files

- `soul.md` — Mette's core: origin, reader, beliefs, aesthetic, stakes.
- `touchstones.md` — Peak examples of Mette's own work with analysis.
- `taboos.md` — Forbidden patterns the agent must never produce.
- `memory.md` — Learned insights about audience and what works.
- `corpus/` — Verbatim source material indexed for composition.

## Editing

- Direct edits: Jacob during onboarding, Mette via admin UI (Phase 5).
- Slash-commands (Phase 1+): `/soul-note`, `/corpus-add`, `/taboo-add`, `/feels-off`.
- Every change is a git commit. History = how Mette's thinking evolved.
```

- [ ] **Step 3: Create knowledge/soul.md template**

```markdown
# soul.md

> This file is Mette's voice, codified. It is the system prompt context
> passed to every Claude call that generates copy or posts.
> Written in Soul Session (Phase 0). Updated via feedback loop.

## 1. Oprindelsen

_Hvorfor laver Mette det her arbejde? Hvad var det øjeblik der gjorde det uundværligt?_

TBD — udfyldes i Soul Session 1.

## 2. Læseren

_Konkret: hvor er hun, hvad tænker hun, hvad googler hun?_

TBD — udfyldes i Soul Session 1.

## 3. Overbevisninger

_Hvad ved Mette er sandt om børn, forældreskab, forandring?_
_Hvilke populære sandheder er hun uenig i?_

TBD — udfyldes i Soul Session 1.

## 4. Æstetik

_Nordic Editorial Calm — hvad betyder det konkret?_

TBD — udfyldes i Soul Session 2.

## 5. Tabuer

_Det Mette aldrig ville sige (forkortet — fuld liste i taboos.md)._

TBD — udfyldes i Soul Session 2.

## 6. Touchstones

_Mettes peak-arbejder (forkortet — fuld analyse i touchstones.md)._

TBD — udfyldes i Soul Session 2.

## 7. Indsats

_Hvad står på spil hvis Mette ikke når frem til den forælder der har brug for hende?_

TBD — udfyldes i Soul Session 1.
```

- [ ] **Step 4: Create knowledge/touchstones.md template**

```markdown
# touchstones.md

> Mettes peak-arbejder. Gravitational centre for agentens copy-valg.
> Hver touchstone har kilde, uddrag og analyse af hvorfor det virker.

## Format

```
### [Titel eller kontekst]

**Kilde:** [URL eller filsti]
**Type:** [sales_page | email | ig_caption | fb_post | webinar]
**Dato:** [YYYY-MM-DD hvis kendt]

**Uddrag (verbatim):**
> [selve teksten]

**Hvorfor dette virker:**
- [punkt 1]
- [punkt 2]
- [punkt 3]
```

## Entries

_(Udfyldes i Soul Session 2)_
```

- [ ] **Step 5: Create knowledge/taboos.md template**

```markdown
# taboos.md

> Mønstre agenten aldrig må producere. Valideres mod hver draft før Slack.

## Absolutte forbud

_(Udfyldes i Soul Session 2. Voksende liste.)_

- Shame-marketing ("du er en dårlig forælder hvis...")
- Frygt-trigger ("dit barn tager skade hvis du ikke...")
- Urgency-manipulation ("kun 3 pladser tilbage!!!")
- Quick-fix sprog ("løs det på 7 dage")

## Kontekstuelle forbud

_(Forbud der gælder specifikke situationer)_

_(Udfyldes i Soul Session 2.)_

## Historik

_(Læringer fra afviste drafts, tilføjet via /feels-off)_
```

- [ ] **Step 6: Create knowledge/memory.md template**

```markdown
# memory.md

> Agentens akkumulerede indsigter om målgruppen, hvad der virker,
> hvad der ikke virker. Redigerbar af Mette.

## Målgruppe-indsigter

_(Opdateres som agenten lærer fra performance-data og Mettes feedback)_

## Hvad virker

_(Mønstre i succesfulde annoncer og posts)_

## Hvad virker ikke

_(Mønstre i dårligt performende indhold)_

## Sæsonvariation

_(Hvornår på året/ugen performer hvad)_
```

- [ ] **Step 7: Create corpus/ subfolders with .gitkeep**

```bash
mkdir -p marketing-agent/knowledge/corpus/sales-pages
mkdir -p marketing-agent/knowledge/corpus/emails
mkdir -p marketing-agent/knowledge/corpus/social
mkdir -p marketing-agent/knowledge/corpus/webinars
touch marketing-agent/knowledge/corpus/sales-pages/.gitkeep
touch marketing-agent/knowledge/corpus/emails/.gitkeep
touch marketing-agent/knowledge/corpus/social/.gitkeep
touch marketing-agent/knowledge/corpus/webinars/.gitkeep
```

- [ ] **Step 8: Commit scaffolding**

```bash
git add marketing-agent/
git commit -m "feat(marketing): scaffold marketing-agent module with knowledge templates"
```

---

## Task 2: Write the Soul Interview Guide

**Files:**
- Create: `docs/superpowers/specs/2026-04-18-soul-interview-guide.md`

- [ ] **Step 1: Create the interview guide**

```markdown
# Soul Session — Interview Guide

**Stakeholder:** Mette Hummel
**Interviewer:** Jacob Hummel
**Varighed:** 2 sessioner, total ~2,5 timer
**Leverance:** `soul.md`, `touchstones.md`, `taboos.md` v1

---

## Før sessionerne

- Find et roligt rum, ingen forstyrrelser
- Optag lyden (iPhone Voice Memos eller computer mic)
- Lav en kop kaffe til Mette
- Fortæl Mette: "Det her er ikke et interview om hvordan *du laver marketing*. Det er et interview om hvordan du ser verden, og din stemme. Det er okay at svare langsomt."

---

## Session 1: Kerne (90 min)

### Del A — Oprindelsen (20 min)

1. Hvornår vidste du første gang at dette arbejde var det du skulle lave?
2. Hvad var det øjeblik — konkret, ikke abstrakt — hvor det blev uundværligt for dig?
3. Hvis du skulle vælge én oplevelse fra dit eget liv der forklarer hvorfor du gør det her, hvilken ville det være?
4. Hvis du ikke gjorde det her, hvad ville så være anderledes i verden?

### Del B — Læseren (35 min)

5. Beskriv for mig en specifik forælder du har hjulpet. Kald hende ved et navn. Hvor gammel er hun? Hvad er hendes situation?
6. Hvor er hun kl. 21:47 om aftenen, når hun ender med at lede efter dig online?
7. Hvad skriver hun i Google-søgefeltet?
8. Hvad er hun bange for at sige højt?
9. Hvad ville hun græde lettet over at høre nogen sige?
10. Hvem er IKKE din læser? Hvem er der også forældre, men som du ikke taler til?

### Del C — Overbevisninger (25 min)

11. Hvilke tre ting ved du om børn som du tror andre tager fejl af?
12. Hvad er den mest kontroversielle ting du står ved om forældreskab?
13. Hvilke populære råd i feltet får dig til at skrue op for kaffen?
14. Hvis du kun kunne give forældre én sætning, hvad ville det være?
15. Hvad er det du lærer i dine 1:1-samtaler der ikke står i nogen bog?

### Del D — Indsats (10 min)

16. Hvad sker der med den forælder der aldrig finder dig?
17. Hvad sker der med familien? Barnet? Hende selv om 10 år?
18. Hvorfor er det vigtigt at du når hende *nu*, ikke om et år?

**Pause.** Tag 10-15 min fri efter session 1. Det har været krævende.

---

## Session 2: Æstetik, tabuer, touchstones (60 min)

### Del A — Æstetik (15 min)

Medbring: 3 eksempler på markedsføring du *hader*. 3 eksempler du *elsker* (gerne uden for forældre-feltet).

19. Se på de tre du hader. Hvad er det præcis der er forkert?
20. Se på de tre du elsker. Hvad fanger dig? Er det ord, rytme, det der *ikke* bliver sagt?
21. Hvordan skal en Mette-annonce lyde når man læser den højt? Hurtigt? Langsomt? Med pauser?
22. Hvad er din holdning til udråbstegn? Emojis? "LIMITED TIME"? "Exclusive access"?

### Del B — Tabuer (15 min)

23. Hvad må man aldrig sige til en forælder der er på gulvet?
24. Hvis du så en annonce for dit eget kursus der sagde [skræmme-taktik], hvad ville du gøre?
25. Hvilke ord i marketing-verdenen får det til at krumme tæer? (Fx "transformation", "unlock", "breakthrough"...)
26. Er der nogle emner du *aldrig* vil lave en annonce om, selvom de performer godt?

### Del C — Touchstones (30 min)

Medbring: 5-10 af Mettes egne arbejder hun selv synes er bedst. Salgssider, IG-captions, e-mails, webinar-udsnit. Print dem ud hvis muligt.

For hvert arbejde:

27. Læs det højt. Hvad sker der i din krop når du hører det?
28. Hvad er den linje der gør det hele arbejde?
29. Hvis du skulle destillere essensen i én sætning, hvad ville den være?
30. Hvad gør dette arbejde *umisteligt Mette* — noget ingen andre i feltet ville have skrevet sådan?

---

## Efter sessionerne

1. Transskribér optagelserne med `pnpm marketing:transcribe`
2. Kør destillationen: `pnpm marketing:destill-soul <transcript-path>` → udkast til `soul.md`
3. Send udkastet til Mette. Hun læser igennem, markerer hvad der er forkert, og skriver hvad der mangler.
4. Ret `soul.md` baseret på hendes feedback.
5. Gentag for `touchstones.md` og `taboos.md` (destillation af Session 2).
6. Commit den færdige version. Dette er `soul.md v1`.

---

## Noter til Jacob som interviewer

- Spørg ikke ledende. Lad Mette definere begreberne.
- Hvis hun siger noget generisk som "jeg vil bare hjælpe forældre", bed om konkretisering: "Hvilken forælder? Sidst du hjalp nogen — hvem var det?"
- Tavshed er okay. Lad hende tænke.
- Skriv ikke under sessionerne. Optag. Vær til stede.
- Hvis hun bliver rørt: stop og vent. Det er som regel der sandheden er.
```

- [ ] **Step 2: Commit interview guide**

```bash
git add docs/superpowers/specs/2026-04-18-soul-interview-guide.md
git commit -m "docs(marketing): soul session interview guide for phase 0"
```

---

## Task 3: Enable pgvector extension and add CorpusEntry Prisma model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/{timestamp}_add_corpus_entry/migration.sql` (auto-generated by Prisma)

- [ ] **Step 1: Add pgvector preview feature to Prisma schema**

Open `prisma/schema.prisma` and modify the generator block at the top:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [vector]
}
```

- [ ] **Step 2: Add CorpusEntry model at the end of schema.prisma**

Append to `prisma/schema.prisma`:

```prisma
// ──────────────────────────────────────────────
// Marketing Agent — Phase 0
// ──────────────────────────────────────────────

enum CorpusType {
  SALES_PAGE
  EMAIL
  IG_CAPTION
  FB_POST
  WEBINAR
  OTHER
}

model CorpusEntry {
  id          String     @id @default(cuid())
  source      String     // URL or file path
  type        CorpusType
  title       String?
  content     String     @db.Text
  embedding   Unsupported("vector(1536)")?
  tags        String[]   @default([])
  performance Float?     // null until used in a campaign
  addedBy     String     // "jacob" | "mette" | "slack_command"
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([type])
  @@index([createdAt])
}
```

- [ ] **Step 3: Create the migration**

```bash
cd familymind-platform
npx prisma migrate dev --name add_corpus_entry
```

Expected: Prisma creates a new migration folder under `prisma/migrations/` and applies it. If the pgvector extension is not yet installed on the database, the migration will fail. If so, connect to the database and run `CREATE EXTENSION IF NOT EXISTS vector;` manually, then re-run the migration.

- [ ] **Step 4: Verify Prisma client generates**

```bash
npx prisma generate
```

Expected: "Generated Prisma Client" message. No errors.

- [ ] **Step 5: Commit schema change**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(marketing): add CorpusEntry model with pgvector support"
```

---

## Task 4: Add dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
cd familymind-platform
npm install @anthropic-ai/sdk openai cheerio
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D tsx @types/cheerio
```

- [ ] **Step 3: Add CLI scripts to package.json**

Edit `package.json`, add under `"scripts"`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest",
  "postinstall": "prisma generate",
  "marketing:transcribe": "tsx marketing-agent/scripts/transcribe.ts",
  "marketing:destill-soul": "tsx marketing-agent/scripts/destill-soul.ts",
  "marketing:corpus-add": "tsx marketing-agent/scripts/corpus-add.ts"
}
```

- [ ] **Step 4: Verify install**

```bash
npm list @anthropic-ai/sdk openai cheerio tsx
```

Expected: All four packages listed with versions.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(marketing): add SDK deps for Anthropic, OpenAI, cheerio, tsx"
```

---

## Task 5: Build `src/lib/marketing/claude.ts` wrapper (TDD)

**Files:**
- Create: `src/lib/marketing/claude.ts`
- Create: `tests/lib/marketing/claude.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/marketing/claude.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { callClaude } from "@/lib/marketing/claude";

const mockCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

describe("callClaude", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("returns text content from the first text block", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Hello from Claude" }],
    });

    const result = await callClaude({
      system: "You are helpful",
      user: "Say hi",
      model: "claude-opus-4-7",
    });

    expect(result).toBe("Hello from Claude");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-opus-4-7",
        system: "You are helpful",
        messages: [{ role: "user", content: "Say hi" }],
      })
    );
  });

  it("throws if ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(
      callClaude({ system: "s", user: "u", model: "claude-opus-4-7" })
    ).rejects.toThrow("ANTHROPIC_API_KEY");
  });

  it("throws if response has no text block", async () => {
    mockCreate.mockResolvedValue({ content: [] });
    await expect(
      callClaude({ system: "s", user: "u", model: "claude-opus-4-7" })
    ).rejects.toThrow("no text content");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/marketing/claude.test.ts
```

Expected: FAIL — module `@/lib/marketing/claude` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/marketing/claude.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";

export interface ClaudeCallOptions {
  system: string;
  user: string;
  model: string;
  maxTokens?: number;
}

export async function callClaude(opts: ClaudeCallOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });

  const firstText = response.content.find((b) => b.type === "text");
  if (!firstText || firstText.type !== "text") {
    throw new Error("Claude response had no text content");
  }
  return firstText.text;
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/lib/marketing/claude.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketing/claude.ts tests/lib/marketing/claude.test.ts
git commit -m "feat(marketing): add Claude API wrapper with tests"
```

---

## Task 6: Build `src/lib/marketing/embed.ts` (TDD)

**Files:**
- Create: `src/lib/marketing/embed.ts`
- Create: `tests/lib/marketing/embed.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/marketing/embed.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateEmbedding } from "@/lib/marketing/embed";

const mockCreate = vi.fn();
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: { create: mockCreate },
  })),
}));

describe("generateEmbedding", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns the embedding array from the API response", async () => {
    const fakeVector = new Array(1536).fill(0.1);
    mockCreate.mockResolvedValue({ data: [{ embedding: fakeVector }] });

    const result = await generateEmbedding("some text");

    expect(result).toEqual(fakeVector);
    expect(mockCreate).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "some text",
    });
  });

  it("throws if OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(generateEmbedding("x")).rejects.toThrow("OPENAI_API_KEY");
  });

  it("throws if input is empty", async () => {
    await expect(generateEmbedding("")).rejects.toThrow("empty");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/marketing/embed.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/marketing/embed.ts`:

```typescript
import OpenAI from "openai";

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("generateEmbedding called with empty input");
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey });
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/lib/marketing/embed.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketing/embed.ts tests/lib/marketing/embed.test.ts
git commit -m "feat(marketing): add OpenAI embedding wrapper with tests"
```

---

## Task 7: Build `src/lib/marketing/scrape.ts` (TDD)

**Files:**
- Create: `src/lib/marketing/scrape.ts`
- Create: `tests/lib/marketing/scrape.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/marketing/scrape.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { scrapeUrl } from "@/lib/marketing/scrape";

describe("scrapeUrl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts visible text from an HTML page", async () => {
    const html = `
      <html>
        <head><title>Test Page</title><script>var x=1;</script></head>
        <body>
          <h1>Hovedoverskrift</h1>
          <p>Første afsnit.</p>
          <style>p { color: red; }</style>
          <p>Andet afsnit.</p>
          <script>console.log("x");</script>
        </body>
      </html>
    `;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      })
    );

    const result = await scrapeUrl("https://example.com/page");

    expect(result.title).toBe("Test Page");
    expect(result.content).toContain("Hovedoverskrift");
    expect(result.content).toContain("Første afsnit");
    expect(result.content).toContain("Andet afsnit");
    expect(result.content).not.toContain("var x=1");
    expect(result.content).not.toContain("color: red");
  });

  it("throws on non-ok HTTP response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 })
    );

    await expect(scrapeUrl("https://example.com/missing")).rejects.toThrow(
      "404"
    );
  });

  it("rejects invalid URL", async () => {
    await expect(scrapeUrl("not-a-url")).rejects.toThrow("Invalid URL");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/marketing/scrape.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/marketing/scrape.ts`:

```typescript
import * as cheerio from "cheerio";

export interface ScrapeResult {
  url: string;
  title: string;
  content: string;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; FamilyMindCorpusBot/1.0)",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);

  $("script, style, noscript").remove();
  const title = $("title").first().text().trim();
  const content = $("body").text().replace(/\s+/g, " ").trim();

  return { url, title, content };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/lib/marketing/scrape.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketing/scrape.ts tests/lib/marketing/scrape.test.ts
git commit -m "feat(marketing): add URL scraper with cheerio + tests"
```

---

## Task 8: Build `src/lib/marketing/whisper.ts` (TDD)

**Files:**
- Create: `src/lib/marketing/whisper.ts`
- Create: `tests/lib/marketing/whisper.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/marketing/whisper.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { transcribeAudio } from "@/lib/marketing/whisper";
import { Readable } from "node:stream";

const mockCreate = vi.fn();
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    audio: { transcriptions: { create: mockCreate } },
  })),
}));

vi.mock("node:fs", () => ({
  createReadStream: vi.fn(() => Readable.from(["fake audio data"])),
  existsSync: vi.fn(() => true),
}));

describe("transcribeAudio", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns the transcript text from Whisper", async () => {
    mockCreate.mockResolvedValue({ text: "Dette er en transskription." });

    const result = await transcribeAudio("/path/to/audio.m4a", "da");

    expect(result).toBe("Dette er en transskription.");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "whisper-1",
        language: "da",
      })
    );
  });

  it("throws if OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(transcribeAudio("/path", "da")).rejects.toThrow(
      "OPENAI_API_KEY"
    );
  });

  it("throws if file does not exist", async () => {
    const fs = await import("node:fs");
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);
    await expect(transcribeAudio("/missing", "da")).rejects.toThrow("not found");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/marketing/whisper.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/marketing/whisper.ts`:

```typescript
import OpenAI from "openai";
import { createReadStream, existsSync } from "node:fs";

export async function transcribeAudio(
  audioPath: string,
  language: string = "da"
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  const client = new OpenAI({ apiKey });
  const response = await client.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: "whisper-1",
    language,
  });

  return response.text;
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/lib/marketing/whisper.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketing/whisper.ts tests/lib/marketing/whisper.test.ts
git commit -m "feat(marketing): add Whisper transcription wrapper with tests"
```

---

## Task 9: Build the transcription CLI

**Files:**
- Create: `marketing-agent/scripts/transcribe.ts`

No test for the CLI wrapper itself — it's thin glue over `whisper.ts` which is tested. Just verify manually.

- [ ] **Step 1: Write the CLI**

Create `marketing-agent/scripts/transcribe.ts`:

```typescript
#!/usr/bin/env tsx
import { transcribeAudio } from "../../src/lib/marketing/whisper";
import { writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

async function main() {
  const audioPath = process.argv[2];
  const language = process.argv[3] ?? "da";

  if (!audioPath) {
    console.error("Usage: pnpm marketing:transcribe <audio-file> [language]");
    console.error("Example: pnpm marketing:transcribe ./session-1.m4a da");
    process.exit(1);
  }

  console.log(`Transcribing ${audioPath} (language: ${language})...`);
  const text = await transcribeAudio(audioPath, language);

  const outputPath = join(
    dirname(audioPath),
    `${basename(audioPath, /\.[^.]+$/.exec(audioPath)?.[0] ?? "")}.transcript.txt`
  );
  writeFileSync(outputPath, text, "utf-8");

  console.log(`Transcript written to: ${outputPath}`);
  console.log(`Length: ${text.length} characters`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Verify CLI runs (dry check without real audio)**

```bash
npm run marketing:transcribe
```

Expected: Exit code 1 with usage message printed.

- [ ] **Step 3: Commit**

```bash
git add marketing-agent/scripts/transcribe.ts
git commit -m "feat(marketing): add transcribe CLI for soul session recordings"
```

---

## Task 10: Build the destillation CLI (TDD for the prompt composer)

**Files:**
- Create: `src/lib/marketing/destill-prompt.ts`
- Create: `tests/lib/marketing/destill-prompt.test.ts`
- Create: `marketing-agent/scripts/destill-soul.ts`

- [ ] **Step 1: Write the failing test for the prompt builder**

Create `tests/lib/marketing/destill-prompt.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildSoulDestillPrompt } from "@/lib/marketing/destill-prompt";

describe("buildSoulDestillPrompt", () => {
  it("includes the transcript verbatim in the user message", () => {
    const result = buildSoulDestillPrompt("Mette sagde: dette er min tro.");
    expect(result.user).toContain("Mette sagde: dette er min tro.");
  });

  it("system prompt forbids fabrication and demands verbatim quotes", () => {
    const result = buildSoulDestillPrompt("x");
    expect(result.system).toMatch(/verbatim|ordret/i);
    expect(result.system).toMatch(/opfind|fabricate/i);
  });

  it("system prompt asks for 7 sections matching soul.md template", () => {
    const result = buildSoulDestillPrompt("x");
    expect(result.system).toContain("1. Oprindelsen");
    expect(result.system).toContain("2. Læseren");
    expect(result.system).toContain("3. Overbevisninger");
    expect(result.system).toContain("4. Æstetik");
    expect(result.system).toContain("5. Tabuer");
    expect(result.system).toContain("6. Touchstones");
    expect(result.system).toContain("7. Indsats");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/marketing/destill-prompt.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/marketing/destill-prompt.ts`:

```typescript
export interface DestillPrompt {
  system: string;
  user: string;
}

export function buildSoulDestillPrompt(transcript: string): DestillPrompt {
  const system = `
Du er en redaktør der destillerer en interviewtransskription til et "soul document" for Mette Hummel Academy.

ABSOLUTTE REGLER:
- Du må KUN bruge ordret tekst (verbatim) fra transskriptionen. Du må IKKE opfinde eller fabrikere nogen sætning.
- Hvis Mette ikke har sagt noget konkret om et afsnit, skriv: "TBD — ikke dækket i denne session, følg op."
- Hvis du bruger en sætning fra transskriptionen, sæt den i "citat-tegn" og angiv kilde som [Mette, session 1, ~timestamp].
- Bevar Mettes sprog, rytme, tavsheder. Omformulér ikke for at gøre det "pænere".

STRUKTUR — du skal producere markdown med præcis disse 7 afsnit:

1. Oprindelsen
   Hvorfor gør Mette dette arbejde? Hvad er det øjeblik der gjorde det uundværligt?

2. Læseren
   Konkret beskrivelse af den forælder Mette taler til. Navn, alder, situation, hvad hun googler.

3. Overbevisninger
   Hvad Mette ved er sandt. Hvor hun er uenig med feltet.

4. Æstetik
   Hvordan Mettes arbejde skal lyde. Rytme, ord, tavsheder.

5. Tabuer
   Hvad Mette aldrig ville sige. Mønstre hun afviser.

6. Touchstones
   Referencer til Mettes peak-arbejder (hvis nævnt i transskriptionen).

7. Indsats
   Hvad står på spil hvis Mette ikke når forælderen.

Dit output er udelukkende markdown, klar til at gemme som soul.md. Ingen preamble, ingen kommentarer.
`.trim();

  const user = `Transskription:\n\n${transcript}`;

  return { system, user };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/lib/marketing/destill-prompt.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Write the destillation CLI**

Create `marketing-agent/scripts/destill-soul.ts`:

```typescript
#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { callClaude } from "../../src/lib/marketing/claude";
import { buildSoulDestillPrompt } from "../../src/lib/marketing/destill-prompt";

async function main() {
  const transcriptPath = process.argv[2];
  if (!transcriptPath) {
    console.error("Usage: pnpm marketing:destill-soul <transcript.txt>");
    process.exit(1);
  }

  const transcript = readFileSync(transcriptPath, "utf-8");
  console.log(`Read transcript: ${transcript.length} chars`);

  const { system, user } = buildSoulDestillPrompt(transcript);
  console.log("Calling Claude (Opus 4.7) for destillation...");
  const soulDraft = await callClaude({
    system,
    user,
    model: "claude-opus-4-7",
    maxTokens: 8192,
  });

  const outputPath = join(dirname(transcriptPath), "soul.draft.md");
  writeFileSync(outputPath, soulDraft, "utf-8");

  console.log(`Soul draft written to: ${outputPath}`);
  console.log("NEXT: review the draft, edit, then copy into marketing-agent/knowledge/soul.md");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
```

- [ ] **Step 6: Verify CLI runs (dry check)**

```bash
npm run marketing:destill-soul
```

Expected: Exit code 1 with usage message.

- [ ] **Step 7: Commit**

```bash
git add src/lib/marketing/destill-prompt.ts tests/lib/marketing/destill-prompt.test.ts marketing-agent/scripts/destill-soul.ts
git commit -m "feat(marketing): add soul destillation prompt + CLI"
```

---

## Task 11: Build the corpus ingestion CLI with DB insert (integration test)

**Files:**
- Create: `src/lib/marketing/corpus-store.ts`
- Create: `tests/lib/marketing/corpus-store.test.ts`
- Create: `marketing-agent/scripts/corpus-add.ts`

- [ ] **Step 1: Write the failing test for the store layer**

Create `tests/lib/marketing/corpus-store.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { insertCorpusEntry } from "@/lib/marketing/corpus-store";

const mockExecuteRaw = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { $executeRaw: mockExecuteRaw },
}));

vi.mock("@/lib/marketing/embed", () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}));

describe("insertCorpusEntry", () => {
  beforeEach(() => {
    mockExecuteRaw.mockReset();
    mockExecuteRaw.mockResolvedValue(1);
  });

  it("generates embedding and inserts row with pgvector syntax", async () => {
    await insertCorpusEntry({
      source: "https://example.com/page",
      type: "SALES_PAGE",
      title: "Test Page",
      content: "Verbatim text here.",
      tags: ["teenage", "conflict"],
      addedBy: "jacob",
    });

    expect(mockExecuteRaw).toHaveBeenCalledOnce();
    const [sqlFragments, ...values] = mockExecuteRaw.mock.calls[0];
    const sqlString = sqlFragments.join("?");
    expect(sqlString).toContain("CorpusEntry");
    expect(sqlString).toContain("embedding");
    expect(values).toContain("Verbatim text here.");
  });

  it("throws if content is empty", async () => {
    await expect(
      insertCorpusEntry({
        source: "x",
        type: "SALES_PAGE",
        content: "",
        tags: [],
        addedBy: "jacob",
      })
    ).rejects.toThrow("empty content");
  });
});
```

- [ ] **Step 2: Check if prisma singleton exists, create if not**

```bash
ls src/lib/prisma.ts 2>/dev/null || echo "need to create"
```

If it does not exist, create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run tests/lib/marketing/corpus-store.test.ts
```

Expected: FAIL — module `corpus-store` not found.

- [ ] **Step 4: Write minimal implementation**

Create `src/lib/marketing/corpus-store.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/marketing/embed";
import { Prisma } from "@prisma/client";

export interface CorpusInput {
  source: string;
  type: "SALES_PAGE" | "EMAIL" | "IG_CAPTION" | "FB_POST" | "WEBINAR" | "OTHER";
  title?: string;
  content: string;
  tags: string[];
  addedBy: string;
}

export async function insertCorpusEntry(input: CorpusInput): Promise<void> {
  if (!input.content || input.content.trim().length === 0) {
    throw new Error("Cannot insert corpus entry with empty content");
  }

  const embedding = await generateEmbedding(input.content);
  const embeddingLiteral = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO "CorpusEntry" (id, source, type, title, content, embedding, tags, "addedBy", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid()::text,
      ${input.source},
      ${input.type}::"CorpusType",
      ${input.title ?? null},
      ${input.content},
      ${embeddingLiteral}::vector,
      ${input.tags}::text[],
      ${input.addedBy},
      NOW(),
      NOW()
    )
  `;
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
npx vitest run tests/lib/marketing/corpus-store.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 6: Write the CLI**

Create `marketing-agent/scripts/corpus-add.ts`:

```typescript
#!/usr/bin/env tsx
import { scrapeUrl } from "../../src/lib/marketing/scrape";
import { insertCorpusEntry } from "../../src/lib/marketing/corpus-store";

type CorpusType = "SALES_PAGE" | "EMAIL" | "IG_CAPTION" | "FB_POST" | "WEBINAR" | "OTHER";
const VALID_TYPES: CorpusType[] = ["SALES_PAGE", "EMAIL", "IG_CAPTION", "FB_POST", "WEBINAR", "OTHER"];

async function main() {
  const url = process.argv[2];
  const type = (process.argv[3] ?? "OTHER").toUpperCase() as CorpusType;
  const tagsArg = process.argv[4] ?? "";

  if (!url) {
    console.error("Usage: pnpm marketing:corpus-add <url> <TYPE> [tag1,tag2]");
    console.error(`Types: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }
  if (!VALID_TYPES.includes(type)) {
    console.error(`Invalid type: ${type}. Must be one of: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  const tags = tagsArg ? tagsArg.split(",").map((t) => t.trim()).filter(Boolean) : [];

  console.log(`Scraping ${url}...`);
  const scraped = await scrapeUrl(url);
  console.log(`  Title: ${scraped.title}`);
  console.log(`  Content length: ${scraped.content.length} chars`);

  console.log("Generating embedding and inserting...");
  await insertCorpusEntry({
    source: url,
    type,
    title: scraped.title,
    content: scraped.content,
    tags,
    addedBy: "jacob",
  });

  console.log("✓ Corpus entry added.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
```

- [ ] **Step 7: Verify CLI runs (dry check)**

```bash
npm run marketing:corpus-add
```

Expected: Exit code 1 with usage message.

- [ ] **Step 8: Commit**

```bash
git add src/lib/marketing/corpus-store.ts tests/lib/marketing/corpus-store.test.ts marketing-agent/scripts/corpus-add.ts src/lib/prisma.ts
git commit -m "feat(marketing): add corpus ingestion CLI with pgvector insert"
```

---

## Task 12: Write the Soul Session runbook for Jacob

**Files:**
- Create: `docs/superpowers/runbooks/2026-04-18-soul-session-runbook.md`

- [ ] **Step 1: Create the runbook**

```markdown
# Soul Session Runbook

**For:** Jacob
**Leverance:** `soul.md`, `touchstones.md`, `taboos.md` + første 10 corpus-entries

---

## Før-tjek

- [ ] Interview-guide læst: `docs/superpowers/specs/2026-04-18-soul-interview-guide.md`
- [ ] Optager klar (iPhone Voice Memos eller computer mic)
- [ ] Mette har afsat 2,5 timer (fordelt på 2 sessioner med pause imellem)
- [ ] Mette har medbragt: 3 annoncer hun hader + 3 hun elsker + 5-10 af sine egne peak-arbejder
- [ ] `ANTHROPIC_API_KEY` og `OPENAI_API_KEY` er i `.env.local`
- [ ] DB-migration er kørt: `npx prisma migrate status` viser alt applied
- [ ] `marketing-agent/knowledge/corpus/` findes

---

## Sessions-kørsel

### Session 1 (90 min)

- [ ] Start optager
- [ ] Følg interview-guidens Session 1 (Del A-D)
- [ ] Gem audio-fil som `marketing-agent/recordings/session-1-YYYY-MM-DD.m4a` (denne mappe er i .gitignore — se nedenfor)
- [ ] Tag 15 min pause

### Session 2 (60 min)

- [ ] Start optager igen
- [ ] Følg interview-guidens Session 2 (Del A-C)
- [ ] Gem som `marketing-agent/recordings/session-2-YYYY-MM-DD.m4a`

---

## Efter-behandling

### 1. Transskribér (5 min compute + 20 min review)

```bash
cd familymind-platform
npm run marketing:transcribe marketing-agent/recordings/session-1-YYYY-MM-DD.m4a da
npm run marketing:transcribe marketing-agent/recordings/session-2-YYYY-MM-DD.m4a da
```

Output: `session-1-YYYY-MM-DD.transcript.txt` og `session-2-YYYY-MM-DD.transcript.txt` ved siden af audio-filerne.

- [ ] Læs begge transskriptioner igennem. Ret tydelige fejl i transskriptionen (navne, danske specialord).

### 2. Destillér soul.md

```bash
npm run marketing:destill-soul marketing-agent/recordings/session-1-YYYY-MM-DD.transcript.txt
```

Output: `session-1-YYYY-MM-DD.soul.draft.md` ved siden af transskriptionen.

- [ ] Åbn draft. Sammenhold med transskription — er alle citater faktisk fra Mette? (Verbatim-reglen.)
- [ ] Send draft til Mette. Bed hende markere:
  - [ ] Grønt: dette er mig
  - [ ] Gult: dette er tæt på, men skal rettes
  - [ ] Rødt: dette har jeg ikke sagt / dette er ikke mig
- [ ] Tag hendes rettelser → opdater draft → kopiér indholdet til `marketing-agent/knowledge/soul.md`

### 3. Destillér touchstones.md og taboos.md

_(Lav ad-hoc ved manuel gennemgang af session-2-transskriptionen, eller spørg mig om at tilføje dedikerede destill-CLIs i senere fase.)_

- [ ] Udfyld `marketing-agent/knowledge/touchstones.md` manuelt ud fra Mettes 5-10 peak-arbejder (session 2, del C)
- [ ] Udfyld `marketing-agent/knowledge/taboos.md` manuelt ud fra session 2, del B

### 4. Indekser de første ~10 corpus-entries

For hver af Mettes peak-arbejder:

```bash
npm run marketing:corpus-add "https://academy.mettehummel.dk/qwjyrdtn" SALES_PAGE "masterclass,teenage"
npm run marketing:corpus-add "https://..." IG_CAPTION "empathy,family"
# ... osv
```

- [ ] Mindst 10 entries indsat
- [ ] Verificér med: `npx prisma studio` → se CorpusEntry tabellen

### 5. Commit alt sammen

```bash
git add marketing-agent/knowledge/
git commit -m "docs(marketing): soul.md, touchstones.md, taboos.md v1 — Soul Session YYYY-MM-DD"
```

- [ ] Push til GitHub

---

## Pre-flight til fase 1

Før drift-agenten bygges, tjek:

- [ ] `soul.md` er ikke længere en template (alle 7 afsnit har rigtigt indhold)
- [ ] Mindst 10 corpus-entries i DB
- [ ] Mette har godkendt soul.md-indholdet skriftligt (slack-besked eller git-commit fra hendes konto)
- [ ] `.env.local` indeholder `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, samt Meta-tokens (forberedelse til fase 1)

---

## Filer der IKKE skal commits

Tilføj til `.gitignore`:

```
marketing-agent/recordings/
*.transcript.txt
*.soul.draft.md
```

Lydfiler og rå-transskriptioner er private — kun det destillerede og godkendte kommer i git.
```

- [ ] **Step 2: Update `.gitignore`**

Append to root `.gitignore` in `familymind-platform/`:

```
# Marketing agent — private Soul Session artifacts
marketing-agent/recordings/
*.transcript.txt
*.soul.draft.md
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/runbooks/2026-04-18-soul-session-runbook.md .gitignore
git commit -m "docs(marketing): soul session runbook for phase 0 execution"
```

---

## Task 13: Final verification — run all tests

- [ ] **Step 1: Run the full test suite**

```bash
cd familymind-platform
npm test -- --run
```

Expected: All new marketing tests pass. No regressions in existing tests.

- [ ] **Step 2: Verify file tree**

```bash
find marketing-agent -type f | sort
find src/lib/marketing -type f | sort
find tests/lib/marketing -type f | sort
```

Expected output includes all files listed in the File Structure section at the top of this plan.

- [ ] **Step 3: Verify Prisma schema**

```bash
npx prisma validate
```

Expected: "The schema at prisma/schema.prisma is valid"

- [ ] **Step 4: Tag the phase completion**

```bash
git tag -a "marketing-phase-0" -m "Marketing agent phase 0 scaffolding complete"
```

---

## Done criteria for Phase 0

Phase 0 is **code-complete** when:

- [ ] All 13 tasks above are checked off
- [ ] `npm test -- --run` passes with >0 new tests, all green
- [ ] Prisma migration `add_corpus_entry` is applied on dev DB
- [ ] Runbook exists for Jacob to execute Soul Session with Mette

Phase 0 is **content-complete** when Jacob has executed the runbook with Mette:

- [ ] `marketing-agent/knowledge/soul.md` contains real content (no TBDs)
- [ ] `touchstones.md` has ≥5 entries with analysis
- [ ] `taboos.md` has both absolute + contextual forbids filled in
- [ ] ≥10 corpus entries exist in the `CorpusEntry` table

**Only once both are true does Phase 1 (drift agent) begin.**
