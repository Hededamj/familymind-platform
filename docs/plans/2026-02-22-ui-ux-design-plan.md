# FamilyMind — Komplet UI/UX Designplan

> "Den mest fantastiske platform til forældre"
> Nordisk. Kvalitet. Ro. Overskud. Indbydende. Lækkert.

---

## 1. Designfilosofi

### Kerneværdier i designet

| Værdi | Visuelt udtryk |
|-------|---------------|
| **Ro** | Masser af whitespace, dæmpet palette, bløde overgange, ingen visuel støj |
| **Kvalitet** | Konsistent typografi, præcis spacing, gennemført detaljering |
| **Overskud** | Generøse marginer, luft mellem elementer, aldrig overfyldt |
| **Indbydende** | Varme farver, bløde hjørner, venligt sprog, imødekommende billeder |
| **Nordisk** | Minimalistisk, funktionelt, naturlige toner, lys og lethed |

### Designprincipper

1. **Mindre er mere** — Hver side har én primær handling. Fjern alt der ikke hjælper brugeren.
2. **Følelsesmæssig tryghed** — Platformen skal føles som et trygt sted. Aldrig stressende, aldrig dømmende.
3. **Progressiv afsløring** — Vis kun det brugeren har brug for lige nu. Mere vises når de er klar.
4. **Konsistens** — Samme mønstre, samme spacing, samme sprog overalt.
5. **Tilgængelighed** — WCAG AA kontrast, fokus-states, screen reader support.

---

## 2. Farvepalette

### Primære farver (fra mettehummel.dk brand + nordisk tilpasning)

```
Primær (Varm Blå):     #3878FF  → Handlinger, links, CTA'er
Primær Mørk:           #2B5EC5  → Hover-states, aktive elementer
Primær Lys:            #EBF1FF  → Baggrunde, subtile highlights
```

### Sekundære farver (nordisk natur-inspireret)

```
Varm Sand:             #F5F0EB  → Sektionsbaggrunde, cards (ikke kold grå!)
Dyb Grøn:              #2A6B5A  → Succes, fremgang, fuldført
Blød Koral:            #E8715A  → Accenter, vigtige badges (sparsommeligt)
Varm Grå:              #6B7280  → Sekundær tekst, metadata
```

### Neutrale farver

```
Baggrund:              #FAFAF8  → Hovedbaggrund (varm hvid, IKKE ren hvid)
Overflade:             #FFFFFF  → Cards, modals
Kant:                  #E8E4DF  → Borders (varm tone)
Tekst Primær:          #1A1A1A  → Overskrifter
Tekst Sekundær:        #4A4A4A  → Brødtekst
Tekst Dæmpet:          #8B8680  → Hjælpetekst, metadata
```

### Funktionelle farver

```
Succes:                #2A6B5A  → Fuldført, aktiv
Advarsel:              #D4A853  → OBS, info
Fejl:                  #C44B3F  → Fejlbeskeder
Info:                  #3878FF  → Info, tips
```

### Farveregler
- **Aldrig ren hvid (#FFF) som sidebaggrund** — brug #FAFAF8 (varm hvid)
- **Aldrig kold grå** — alle grå toner har en varm undertone
- **Koral (#E8715A) kun som accent** — maks 5% af fladen
- **Primær blå til handlinger** — kun interaktive elementer

---

## 3. Typografi

### Font-valg

```
Overskrifter:   "DM Serif Display" (serif)    → Varme, klassisk, premium
Brødtekst:      "Inter" (sans-serif)          → Ren, læsbar, moderne
Monospace:       "Geist Mono"                  → Kode, slugs, teknisk
```

**Begrundelse:** Kombinationen af serif (overskrifter) og sans-serif (brødtekst) skaber en premium, editorial følelse der signalerer kvalitet og troværdighed — som et velskrevet magasin for forældre.

### Typografisk skala

```
Hero:           48px / 56px line-height / -0.02em tracking / DM Serif Display
H1:             36px / 44px / -0.02em / DM Serif Display
H2:             28px / 36px / -0.01em / DM Serif Display
H3:             22px / 30px / 0 / DM Serif Display
H4:             18px / 26px / 0 / Inter Semibold
Body Large:     18px / 28px / 0 / Inter Regular
Body:           16px / 26px / 0 / Inter Regular
Body Small:     14px / 22px / 0 / Inter Regular
Caption:        12px / 18px / 0.01em / Inter Medium
Overline:       11px / 16px / 0.08em / Inter Semibold UPPERCASE
```

### Typografi-regler
- Overskrifter: Altid DM Serif Display, aldrig all-caps
- Brødtekst: Max 65 tegn per linie (optimal læselængde)
- Liniehøjde: Generøs (1.6-1.75x) for ro og læsbarhed
- Bogstavafstand: Let negativ på overskrifter, neutral på brødtekst

---

## 4. Spacing & Layout System

### Spacing-skala (8px grid)

```
xs:     4px     → Mellem ikon og label
sm:     8px     → Inden i kompakte elementer
md:     16px    → Mellem relaterede elementer
lg:     24px    → Mellem sektioner i en card
xl:     32px    → Mellem cards/sektioner
2xl:    48px    → Mellem hovedsektioner
3xl:    64px    → Sektionsafstand på landingssiden
4xl:    96px    → Hero-sektion padding
```

### Container-bredder

```
Landingsside:   max-w-6xl (1152px)  → Hero, features
Indholdsside:   max-w-3xl (768px)   → Artikler, video
Dashboard:      max-w-2xl (672px)   → Bruger-dashboard
Auth-sider:     max-w-md (448px)    → Login, signup
Admin:          Full width           → Med sidebar
```

### Grid-system

```
Browse:         3 kolonner (desktop) → 2 (tablet) → 1 (mobil)
Dashboard:      2 kolonner (desktop) → 1 (mobil)
Admin:          Sidebar (256px) + Fluid content
Stats:          3 kolonner (desktop) → 2 (tablet) → 1 (mobil)
```

---

## 5. Komponent-designsystem

### 5.1 Knapper

```
Primær:         bg-[#3878FF], text-white, rounded-xl, py-3 px-6
                hover: bg-[#2B5EC5], transform scale(1.02)
                Brug: Én primær CTA per sektion

Sekundær:       bg-transparent, border border-[#E8E4DF], text-[#1A1A1A]
                hover: bg-[#F5F0EB]
                Brug: Sekundære handlinger

Ghost:          bg-transparent, text-[#3878FF]
                hover: bg-[#EBF1FF]
                Brug: Tertiære handlinger, navigation

Destructive:    bg-[#C44B3F], text-white
                Brug: Slet-handlinger (altid med bekræftelse)
```

**Knap-regler:**
- Altid mindst 44px høj (touch target)
- Runde hjørner: rounded-xl (12px)
- Aldrig mere end 2 knapper ved siden af hinanden
- Primær knap: Maks én per synligt viewport

### 5.2 Cards

```
Standard:       bg-white, rounded-2xl, border border-[#E8E4DF]
                shadow-none (flat nordisk stil)
                padding: 24px
                hover: shadow-sm, border-[#3878FF]/20

Elevated:       bg-white, rounded-2xl, shadow-md
                Brug: Modals, dropdowns, popovers

Tinted:         bg-[#F5F0EB], rounded-2xl, border-none
                Brug: Feature-highlights, info-sektioner

Success:        bg-[#2A6B5A]/5, border-l-4 border-[#2A6B5A]
                Brug: Fuldført, succes-beskeder
```

**Card-regler:**
- Aldrig skygger som standard — kun ved hover eller elevation
- Generøs indre padding (24-32px)
- Aldrig mere end 3 niveauer af indlejrede cards

### 5.3 Badges

```
Status:         Afrundede pills (rounded-full), py-1 px-3
                Gratis:      bg-[#2A6B5A]/10, text-[#2A6B5A]
                Abonnement:  bg-[#3878FF]/10, text-[#3878FF]
                Køb:         bg-[#E8715A]/10, text-[#E8715A]
                Fuldført:    bg-[#2A6B5A]/10, text-[#2A6B5A]
                Kladde:      bg-[#8B8680]/10, text-[#8B8680]

Type:           Samme stil men med ikon prefix
                Video:  ▶ Video
                Tekst:  📄 Tekst
                Lyd:    🎧 Lyd
                PDF:    📋 PDF
```

### 5.4 Inputfelter

```
Standard:       bg-white, border border-[#E8E4DF], rounded-xl
                focus: border-[#3878FF], ring-2 ring-[#3878FF]/20
                padding: py-3 px-4
                placeholder: text-[#8B8680]

Error:          border-[#C44B3F], ring-2 ring-[#C44B3F]/20
                + fejlbesked under feltet i text-[#C44B3F]
```

### 5.5 Navigation

```
Topbar (bruger-sider):
    bg-white/80 backdrop-blur-md
    border-b border-[#E8E4DF]
    sticky top-0 z-50
    Logo venstre, navigation center, bruger-menu højre
    Højde: 64px

Sidebar (admin):
    bg-[#1A1A1A]
    text-white/70
    Aktiv: bg-white/10, text-white
    Bredde: 280px
    Logo top, nav items, bruger-info bund
```

### 5.6 Progress-indikatorer

```
Progress bar:   bg-[#E8E4DF], bar bg-[#2A6B5A], rounded-full, h-2
                Aldrig rød/gul — altid grøn (ingen stress)

Dag-status:
    Fuldført:   ✓ cirkel med bg-[#2A6B5A], text-white
    Aktuel:     ● fyldt cirkel bg-[#3878FF]
    Kommende:   ○ tom cirkel border-[#E8E4DF]
    Låst:       🔒 ikon, opacity-50
```

---

## 6. Ikoner & Illustrationer

### Ikon-stil
- **Bibliotek:** Lucide React (allerede installeret)
- **Stil:** Outline (strokeWidth: 1.5), aldrig fyldte
- **Størrelse:** 20px (standard), 24px (navigation), 16px (inline)
- **Farve:** Matcher tekst-farven, aldrig selvstændig farve

### Illustrationer (fremtidigt)
- Stil: Bløde, håndtegnede line-art illustrationer
- Motiver: Familier, natur, forbindelse, hænder, hjerter
- Farver: Monokrome i primærfarve eller dæmpede toner
- Placering: Tomme states, onboarding, hero-sektioner

### Fotografi-stil (fra mettehummel.dk)
- Varme, naturlige farver
- Blødt lys, aldrig hårdt flash
- Autentiske familiesituationer
- Fokus på forbindelse mellem forælder og barn
- Aldrig poserede stock-fotos

---

## 7. Animationer & Overgange

### Principper
- **Subtile og formålstjenlige** — animation skal hjælpe, aldrig distrahere
- **Hurtige** — max 200-300ms for UI-feedback
- **Ease-out** — naturlig deceleration

### Specifikke animationer

```
Sideskift:          fade-in 200ms ease-out
Card hover:         transform translateY(-2px) 200ms + subtle shadow
Knap hover:         scale(1.02) 150ms ease-out
Modal åbn:          fade-in + scale(0.95→1) 250ms ease-out
Toast:              slide-in fra bund 300ms ease-out
Progress bar:       width transition 500ms ease-out
Accordion åbn:      height auto 200ms ease-out
Skeleton loading:   pulse animation (allerede i Tailwind)
```

### Ingen animation på:
- Tekstændringer
- Farveændringer ved states
- Badge-visning

---

## 8. Sidespecifikke designs

### 8.1 Landingsside (`/`)

**Formål:** Skabe begejstring og konvertere besøgende til brugere.

**Struktur:**

```
┌─────────────────────────────────────────────┐
│  TOPBAR: Logo | [Login] [Kom i gang →]      │
├─────────────────────────────────────────────┤
│                                             │
│  HERO SEKTION (fuld bredde, bg-[#F5F0EB])   │
│                                             │
│  Overline: EVIDENSBASERET FORÆLDREGUIDE     │
│                                             │
│  "Giv dit barn den                          │
│   bedste start"                             │
│                                             │
│  Din strukturerede vej til et trygt og      │
│  kærligt forældreskab — med viden der       │
│  virker og værktøjer du kan bruge i dag.    │
│                                             │
│  [Prøv FamilyMind gratis →]   [Se hvordan]  │
│                                             │
│  Hero-billede: Familie i varmt lys          │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  SOCIAL PROOF                               │
│  "Brugt af 500+ familier i Danmark"         │
│  ★★★★★  Testimonial-citat                   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  HVORDAN DET VIRKER (3 trin)                │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 1. Start │ │ 2. Lær   │ │ 3. Mærk  │   │
│  │ dit      │ │ i dit    │ │ for-     │   │
│  │ forløb   │ │ tempo    │ │ skellen  │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  INDHOLD PREVIEW (bg-[#F5F0EB])             │
│  "Alt hvad du har brug for"                 │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Forløb  │ │ Video-  │ │ Fælles- │      │
│  │ dag-for-│ │ kurser  │ │ skab    │      │
│  │ dag     │ │         │ │         │      │
│  └─────────┘ └─────────┘ └─────────┘      │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  TESTIMONIALS (karrusel)                    │
│  "FamilyMind har ændret vores              │
│   aftener fuldstændigt"                     │
│  — Maria, mor til 2                         │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  PRISER                                     │
│  ┌────────────────────┐                     │
│  │  149 kr/md         │                     │
│  │  Alt inkluderet    │                     │
│  │  ✓ Alle forløb     │                     │
│  │  ✓ Videokurser     │                     │
│  │  ✓ Fællesskab      │                     │
│  │  ✓ Ugentlige tips  │                     │
│  │                    │                     │
│  │  [Start i dag →]   │                     │
│  └────────────────────┘                     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  OM METTE HUMMEL                            │
│  Portræt + kort bio + "Læs mere"           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  FAQ (accordion)                            │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  FINAL CTA (bg-[#3878FF])                  │
│  "Klar til at komme i gang?"               │
│  [Opret din konto gratis →]                │
│                                             │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
│  Logo | Links | Social | © 2026            │
└─────────────────────────────────────────────┘
```

**Design-detaljer:**
- Hero: Stor DM Serif Display overskrift (48px), subtil gradient baggrund
- Sektioner veksler mellem hvid og varm sand baggrund
- Illustrative ikoner ved "Hvordan det virker"
- Testimonials med runde profilbilleder
- Pris-card med subtle border + shadow, centreret

---

### 8.2 Login/Signup (`/login`, `/signup`)

```
┌─────────────────────────────────────────────┐
│                                             │
│         Baggrund: bg-[#F5F0EB]              │
│                                             │
│         ┌────────────────────┐              │
│         │  FamilyMind Logo   │              │
│         │                    │              │
│         │  "Velkommen        │              │
│         │   tilbage"         │              │
│         │                    │              │
│         │  [Google login]    │              │
│         │  [Apple login]     │              │
│         │                    │              │
│         │  ── eller ──       │              │
│         │                    │              │
│         │  Email:  [______]  │              │
│         │  Kode:   [______]  │              │
│         │                    │              │
│         │  [Log ind →]       │              │
│         │                    │              │
│         │  Har du ikke en    │              │
│         │  konto? Opret her  │              │
│         └────────────────────┘              │
│                                             │
└─────────────────────────────────────────────┘
```

**Design-detaljer:**
- Card: bg-white, rounded-2xl, shadow-lg, max-w-md
- Baggrund: Varm sand med subtil tekstur/mønster
- OAuth-knapper: Full-width, outline-stil med ikon
- Separator: Tynd linje med "eller" centreret
- "Glemt kode?" link under kodeord-felt

---

### 8.3 Onboarding (`/onboarding`)

**Formål:** Personalisere oplevelsen og skabe tilknytning.

```
┌─────────────────────────────────────────────┐
│                                             │
│  Progress: ●───●───○───○   Trin 2 af 4     │
│                                             │
│         ┌────────────────────┐              │
│         │                    │              │
│         │  "Hvad er dit      │              │
│         │   barns alder?"    │              │
│         │                    │              │
│         │  ┌──────────────┐  │              │
│         │  │ 0-12 måneder │  │              │
│         │  └──────────────┘  │              │
│         │  ┌──────────────┐  │              │
│         │  │ 1-3 år       │  │              │
│         │  └──────────────┘  │              │
│         │  ┌──────────────┐  │              │
│         │  │ 3-6 år       │  │              │
│         │  └──────────────┘  │              │
│         │  ┌──────────────┐  │              │
│         │  │ 6+ år        │  │              │
│         │  └──────────────┘  │              │
│         │                    │              │
│         │  [Næste →]         │              │
│         │                    │              │
│         └────────────────────┘              │
│                                             │
└─────────────────────────────────────────────┘
```

**Design-detaljer:**
- Ét spørgsmål per skærm (ingen scroll)
- Store, klikbare option-cards (ikke radio buttons)
- Valgt option: border-[#3878FF], bg-[#EBF1FF]
- Progress-indikator: Forbundne dots øverst
- Blødt slide-animation mellem trin
- Velkomst-trin først: "Hej [navn]! Lad os finde det rette forløb til dig."
- Afsluttende trin: "Perfekt! Vi har fundet dit forløb." med konfetti-lignende effekt

---

### 8.4 Dashboard (`/dashboard`)

**Formål:** Brugerens trygge base. Overblik og næste skridt.

```
┌─────────────────────────────────────────────┐
│  TOPBAR: Logo | [🔔] [Fremgang] [⚙]        │
├─────────────────────────────────────────────┤
│                                             │
│  Godmorgen, Mette ☀️                         │
│  Dag 4 af dit forløb                        │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ DASHBOARD BESKED (valgfri)          │    │
│  │ Tinted card med opmuntrende besked  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ DIN NÆSTE DAG                       │    │
│  │                                     │    │
│  │ Dag 4: Forstå dit barns signaler    │    │
│  │                                     │    │
│  │ ┌─────────┐                         │    │
│  │ │ Video   │  15 min · Video         │    │
│  │ │ thumb   │  + 1 øvelse             │    │
│  │ └─────────┘                         │    │
│  │                                     │    │
│  │ ████████████░░░░░░ 60% fuldført     │    │
│  │                                     │    │
│  │ [Fortsæt dag 4 →]                   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  DINE KURSER                                │
│  ┌───────────┐  ┌───────────┐              │
│  │ Kursus 1  │  │ Kursus 2  │              │
│  │ thumb     │  │ thumb     │              │
│  │ ████░░ 50%│  │ ░░░░░░ 0% │              │
│  └───────────┘  └───────────┘              │
│                                             │
│  ANBEFALET TIL DIG                          │
│  ┌───────────┐  ┌───────────┐              │
│  │ Produkt 1 │  │ Produkt 2 │              │
│  └───────────┘  └───────────┘              │
│                                             │
│  [Se alle forløb og kurser →]              │
│                                             │
└─────────────────────────────────────────────┘
```

**Design-detaljer:**
- Velkomst-hilsen med tidsbetinget emoji (☀️ morgen, 🌙 aften)
- Dagens forløbsdag som prominent card med video-thumbnail
- Progress bar: Altid grøn, aldrig stressende rødt/gult
- Kurser i 2-kolonne grid med thumbnails og progress
- Anbefalinger som horisontalt scrollbar sektion
- Subtil separator mellem sektioner

---

### 8.5 Forløbsoversigt (`/journeys/[slug]`)

```
┌─────────────────────────────────────────────┐
│  ← Tilbage til dashboard                    │
├─────────────────────────────────────────────┤
│                                             │
│  Overline: FORLØB · 21 DAGE                 │
│                                             │
│  "De første 1000 dage"                      │
│  Beskrivelse i 2-3 linjer...                │
│                                             │
│  ████████████░░░░░░░ Dag 8 af 21 (38%)     │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 👥 Fællesskab · 24 medlemmer       │    │
│  │ Del erfaringer med andre forældre → │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ── Fase 1: Grundlaget ──                   │
│                                             │
│  ✓  Dag 1: Velkommen til forløbet     ✓    │
│  ✓  Dag 2: Forstå dit barn           ✓    │
│  ●  Dag 3: Kommunikation         [Fortsæt] │
│  ○  Dag 4: Grænser med kærlighed           │
│  ○  Dag 5: Rutiner der virker              │
│  🔒 Dag 6: Håndter modstand                │
│  🔒 Dag 7: Refleksion                      │
│                                             │
│  ── Fase 2: Fordybelse ──                   │
│                                             │
│  🔒 Dag 8-14 (låst)                        │
│                                             │
│  ── Fase 3: Mestring ──                     │
│                                             │
│  🔒 Dag 15-21 (låst)                       │
│                                             │
└─────────────────────────────────────────────┘
```

**Design-detaljer:**
- Fase-sektioner som collapsible med fade for låste dage
- Aktuel dag fremhævet med blå kant og pulserende dot
- Fuldførte dage har grønt check og kan klikkes igen
- Låste dage er grayed out men synlige (motivation)
- Fællesskabs-card med varm sand baggrund

---

### 8.6 Dagvisning (`/journeys/[slug]/day/[dayId]`)

```
┌─────────────────────────────────────────────┐
│  ← Fase 1 · Dag 3 af 21                    │
├─────────────────────────────────────────────┤
│                                             │
│  "Kommunikation der virker"                 │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │         VIDEO PLAYER                │    │
│  │         (16:9 aspect ratio)         │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  15 min · Video                             │
│                                             │
│  Beskrivelse af dagens indhold...           │
│                                             │
│  ── Dagens øvelse ──                        │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 📋 Øvelse                          │    │
│  │                                     │    │
│  │ Prøv i dag at bruge "jeg-sprog"    │    │
│  │ i stedet for "du-sprog" når du     │    │
│  │ taler med dit barn.                │    │
│  │                                     │    │
│  │ ┌───────────────────────────────┐  │    │
│  │ │ 💭 Refleksion:               │  │    │
│  │ │ Hvad lagde du mærke til?     │  │    │
│  │ └───────────────────────────────┘  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ── Hvordan har du det i dag? ──            │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │   😊  😐  😢  😤  🤔              │    │
│  │                                     │    │
│  │  Vil du dele mere?                  │    │
│  │  [____________________________]     │    │
│  │                                     │    │
│  │  [Send check-in →]                  │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

**Design-detaljer:**
- Video player med bløde hjørner, sort baggrund
- Øvelse-card med varm sand baggrund og venstre border-accent
- Check-in emojis som store, klikbare cirkler (48px)
- Valgt emoji: scale(1.2) + ring i primærfarve
- Refleksions-felt: Textarea med blødt placeholder-tekst
- Ingen "fuldført"-knap synlig før check-in er sendt

---

### 8.7 Browse (`/browse`)

```
┌─────────────────────────────────────────────┐
│  TOPBAR                                      │
├─────────────────────────────────────────────┤
│                                             │
│  "Udforsk"                                  │
│  Find forløb, kurser og værktøjer           │
│  der passer til din familie                 │
│                                             │
│  [Alle] [Forløb] [Kurser] [Artikler]       │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ thumb   │ │ thumb   │ │ thumb   │      │
│  │         │ │         │ │         │      │
│  │ Titel   │ │ Titel   │ │ Titel   │      │
│  │ Type·Min│ │ Type·Min│ │ Type·Min│      │
│  │ [Gratis]│ │ [149kr] │ │ [Abon.] │      │
│  └─────────┘ └─────────┘ └─────────┘      │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │  ...    │ │  ...    │ │  ...    │      │
│  └─────────┘ └─────────┘ └─────────┘      │
│                                             │
└─────────────────────────────────────────────┘
```

**Design-detaljer:**
- Filter-knapper som pills (rounded-full), aktiv: filled, inaktiv: outline
- Produktkort med thumbnail (aspect-video), titel, meta, pris-badge
- Hover: Subtle lift + shadow
- Gratis indhold markeret med grøn badge
- Thumbnail fallback: Gradient baggrund med ikon for medietype

---

### 8.8 Indholds-side (`/content/[slug]`)

**Med adgang:**
- Ren, fokuseret visning
- Video player prominently displayed
- Metadata i diskret linje under player
- Beskrivelse i prose-stil med god linjelængde
- "Markér som fuldført" som stor, grøn knap i bunden
- Tags som subtile pills under beskrivelsen

**Uden adgang (gated):**
- Thumbnail med glasmorfisme lock-overlay
- Kort beskrivelse (max 3 linjer, line-clamp)
- CTA-card med tydelig handlingsmulighed
- Aldrig aggressiv — venlig tone: "Få adgang til dette og alt andet indhold"

---

### 8.9 Fremgang (`/dashboard/progress`)

```
┌─────────────────────────────────────────────┐
│  ← Tilbage                                  │
├─────────────────────────────────────────────┤
│                                             │
│  "Din fremgang"                              │
│  Du er på en fantastisk rejse ✨             │
│                                             │
│  ┌────┐ ┌────┐ ┌────┐                      │
│  │ 12 │ │  8 │ │  5 │                      │
│  │dage│ │ind-│ │chk │                      │
│  │akt.│ │hold│ │ins │                      │
│  └────┘ └────┘ └────┘                      │
│                                             │
│  ┌────┐ ┌────┐ ┌────┐                      │
│  │  1 │ │  4 │ │  3 │                      │
│  │forl│ │ 🔥 │ │ ⭐ │                      │
│  │genf│ │stre│ │mile│                      │
│  └────┘ └────┘ └────┘                      │
│                                             │
│  ── Milepæle ──                             │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 🏆 Første uge fuldført!            │    │
│  │ Du har gennemført 7 dage i træk    │    │
│  │ Optjent 3. februar 2026            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ── Månedlig aktivitet ──                   │
│                                             │
│  Feb 2026                                   │
│  ┌─┬─┬─┬─┬─┬─┬─┐                          │
│  │●│●│●│○│●│●│○│  ← aktivitetsgrid         │
│  │●│○│●│●│●│○│ │                            │
│  └─┴─┴─┴─┴─┴─┴─┘                          │
│                                             │
└─────────────────────────────────────────────┘
```

**Design-detaljer:**
- Stat-cards med stort tal, ikon, og label — farvekodet men subtilt
- Milepæle som cards med emoji-ikon og beskrivelse
- Månedlig aktivitet som GitHub-lignende contribution grid
- Aldrig sammenlignende/kompetitiv — kun personlig fremgang
- Opmuntrende sprog: "Fantastisk!", "Du klarer det godt"

---

### 8.10 Indstillinger (`/dashboard/settings`)

```
┌─────────────────────────────────────────────┐
│  ← Tilbage                                  │
├─────────────────────────────────────────────┤
│                                             │
│  "Indstillinger"                            │
│                                             │
│  ── Profil ──                               │
│  ┌─────────────────────────────────────┐    │
│  │ Navn:    Mette Hummel              │    │
│  │ Email:   mette@example.dk          │    │
│  │ [Rediger profil]                    │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ── Abonnement ──                           │
│  ┌─────────────────────────────────────┐    │
│  │ Status:  ● Aktivt                   │    │
│  │ Plan:    FamilyMind · 149 kr/md    │    │
│  │ Næste:   1. marts 2026             │    │
│  │ [Administrer abonnement]            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ── Notifikationer ──                       │
│  ┌─────────────────────────────────────┐    │
│  │ Email-påmindelser    [toggle ●]     │    │
│  │ Ugentlig opsummering [toggle ●]     │    │
│  │ Fællesskab-svar      [toggle ○]     │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 8.11 Admin-panel (`/admin/*`)

**Design-principper for admin:**
- **Desktop-first** (admin bruges primært på computer)
- **Effektivt** — data-tæt men organiseret
- **Mørk sidebar** (#1A1A1A) med lys content area
- **Professionelt** men stadig on-brand

```
┌──────────┬──────────────────────────────────┐
│          │                                  │
│ SIDEBAR  │  CONTENT AREA                    │
│ (280px)  │                                  │
│          │  Breadcrumb: Admin > Indhold     │
│ Family-  │                                  │
│ Mind     │  "Indhold"                       │
│ Admin    │  Administrer alt indhold         │
│          │                                  │
│ ─────    │  [Søg...        ] [+ Opret]     │
│ 📄 Indh. │                                  │
│ 🏷 Tags  │  ┌──┬────────┬─────┬────┬───┐  │
│ 📦 Prod. │  │▪ │Titel   │Type │Adg.│...│  │
│ 🎫 Rabat │  ├──┼────────┼─────┼────┼───┤  │
│ 🗺 Rejser│  │🖼│5 tips..│Video│Grat│ ⋮ │  │
│ 👥 Koho. │  │🖼│Når dit.│Tekst│Abon│ ⋮ │  │
│ 🛡 Mod.  │  │🖼│Følelse.│Video│Køb │ ⋮ │  │
│ ⚙ Indst. │  └──┴────────┴─────┴────┴───┘  │
│          │                                  │
│ ─────    │  Viser 1-20 af 45               │
│ ← Dashb. │  [← Forrige] [Næste →]         │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

**Admin-specifikke forbedringer:**
- Thumbnail-kolonne i alle lister med indhold
- Søgefelt øverst i alle listevisninger
- Pagination med antal-info
- Bulk-actions mulighed (fremtidigt)
- Inline-redigering af status (publish/unpublish toggle)
- Drag-and-drop reordering for lektioner/dage

---

## 9. Mobile-specifikke mønstre

### Navigation (mobil)
- Hamburger-menu (☰) øverst til højre
- Slide-in drawer fra højre med glasmorfisme overlay
- Bottom navigation bar for primære sektioner:
  ```
  ┌────┬────┬────┬────┐
  │ 🏠 │ 🗺 │ 📚 │ 👤 │
  │Hjem│Forl│Udfo│Mig │
  └────┴────┴────┴────┘
  ```

### Touch-interaktioner
- Swipe mellem dage i forløb
- Pull-to-refresh på dashboard og feeds
- Long-press for hurtige handlinger (kopier link, del)
- Touch targets: minimum 44x44px

### Mobil-specifikke tilpasninger
- Sticky CTA-bar i bunden på konverteringssider
- Cards fylder fuld bredde (ingen side-margin)
- Video player: Fuld bredde, landscape-optimeret
- Check-in emojis: Større (56px) for touch
- Formularer: Én kolonne, store inputfelter

---

## 10. Tilgængelighed

### Krav (WCAG AA)
- Kontrast: Minimum 4.5:1 for brødtekst, 3:1 for stor tekst
- Fokus-states: Synlig ring (2px solid #3878FF, 2px offset)
- Skip-links: "Spring til indhold" link øverst
- Alt-tekst: Alle billeder og ikoner
- Aria-labels: Alle interaktive elementer uden synlig tekst
- Keyboard-navigation: Tab-rækkefølge matcher visuel rækkefølge

### Farveblindhed
- Aldrig farve som eneste informationsbærer
- Status kommunikeres med ikon + tekst + farve
- Testet med Protanopia, Deuteranopia, Tritanopia simulatorer

---

## 11. Dark Mode

### Tilgang
Dark mode understøttes men er **ikke standard**. Forældre-målgruppen foretrækker typisk light mode, men dark mode er rart om aftenen.

### Mørk palette

```
Baggrund:       #0F0F0E     → Varm sort (ikke ren sort)
Overflade:      #1A1A18     → Cards
Overflade 2:    #252523     → Elevated cards
Kant:           #333330     → Borders
Tekst Primær:   #F5F0EB     → Varm hvid
Tekst Sekundær: #A8A29E     → Dæmpet
Tekst Dæmpet:   #6B6560     → Metadata
Primær:         #5B96FF     → Lidt lysere blå for kontrast
```

---

## 12. Brugerrejse & Konverteringsflow

### Ny bruger-rejse

```
Landingsside → Signup → Onboarding (3-4 spørgsmål)
  → Anbefalet forløb → Start gratis prøveperiode
  → Dashboard med første dag klar
```

### Aktiv bruger-cyklus

```
Notifikation/email → Dashboard → Dagens dag → Video + øvelse
  → Check-in → Fællesskab → Dashboard (næste dag låst op)
```

### Konvertering (gratis → betalt)

```
Gratis indhold → Møder gated indhold → Ser værdi
  → Subscribe CTA (kontekstuel, ikke aggressiv)
  → Checkout → Umiddelbar adgang
```

### Genaktivering

```
Inaktiv 3 dage → Venlig email-påmindelse
  → Inaktiv 7 dage → "Vi savner dig" email
  → Inaktiv 14 dage → Tilbud/motivation email
```

---

## 13. Implementeringsrækkefølge

### Fase 1: Fundament (design tokens + layout)
1. Opdater `globals.css` med ny farvepalette (CSS custom properties)
2. Installér og konfigurér DM Serif Display + Inter fonte
3. Opdater root layout med ny topbar-navigation
4. Opdater admin layout med ny mørk sidebar
5. Tilføj footer-komponent

### Fase 2: Kernesider
6. Redesign landingsside (ny hero, sektioner, testimonials, pris)
7. Redesign login/signup (ny stil, varm baggrund)
8. Redesign dashboard (ny hilsen, cards, layout)
9. Redesign browse (nyt grid, filter-pills, produktkort)

### Fase 3: Indholdsoplevelse
10. Redesign forløbsoversigt (faser, dag-status, progress)
11. Redesign dagvisning (video, øvelse, check-in)
12. Redesign indholdssider (video player, gated view)
13. Redesign fremgangsside (stats, milepæle, aktivitetsgrid)

### Fase 4: Polish
14. Tilføj animationer og overgange
15. Mobil bottom navigation
16. Dark mode support
17. Loading skeletons i nyt design
18. Error states i nyt design

### Fase 5: Admin polish
19. Ny admin sidebar
20. Forbedrede admin-tabeller med thumbnails og søgning
21. Admin dashboard med statistik

---

## 14. Tekniske krav

### Nye dependencies
```
@fontsource/dm-serif-display    → Overskrift-font
@fontsource/inter               → Brødtekst-font (eller via next/font)
```

### CSS-arkitektur
- Alle farver som CSS custom properties i `globals.css`
- Tailwind v4 theme-extension for custom farver
- Komponent-specifikke varianter via Tailwind utility classes
- Ingen separate CSS-filer — alt via Tailwind

### Billedhåndtering
- Next.js `<Image>` for alle statiske billeder
- `<img>` for eksterne Bunny.net thumbnails (eller konfigurér `next.config.ts` domains)
- Lazy loading standard
- Blur placeholder for store billeder

---

## Appendiks: Ordliste for dansk UI-tekst

| Kontekst | Tekst |
|----------|-------|
| CTA primær | "Kom i gang" / "Start nu" |
| CTA sekundær | "Læs mere" / "Se mere" |
| Login | "Log ind" |
| Signup | "Opret konto" |
| Navigation | "Hjem", "Udforsk", "Min profil" |
| Fremgang | "Din fremgang", "Fortsæt", "Fuldført" |
| Fejl | "Noget gik galt. Prøv igen." |
| Tom state | "Intet at vise endnu." |
| Loading | "Henter..." |
| Succes | "Gemt!", "Fuldført!", "Godt klaret!" |
| Abonnement | "Start abonnement", "149 kr/md" |
| Opmuntring | "Du klarer det fantastisk!", "Hver dag tæller" |
