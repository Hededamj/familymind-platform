# FamilyMind Platform UI/UX Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

**Goal:** Redesign hele FamilyMinds bruger- og admin-oplevelse fra "kursus-system" til "et sted man føler sig hjemme"

**Aesthetic Direction:** *Nordic Hearth* — Organic/Natural + Luxury/Refined. DFII: 16 (Excellent).

**Status:** DESIGN GODKENDT 2026-03-08

---

## 1. Overordnet arkitektur

### To shells

| Shell | Routes | Navigation | Header | Footer |
|---|---|---|---|---|
| **Website-mode** | `/`, `/browse`, `/subscribe`, `/community` (anon), `/login`, `/signup` | Mørk topbar (som nu) | Ja | Ja |
| **App-mode** | `/dashboard`, `/journeys/*`, `/community/*` (logget ind), `/settings`, `/admin/*` | Sidebar + bottom tabs | Kun mobil topbar | Nej |

### Responsive breakpoints

| Breakpoint | Navigation | Sidebar |
|---|---|---|
| Mobil (< 768px) | Bottom tab bar (56px) + simpel topbar (56px, logo + klokke) | Ingen |
| Tablet (768-1024px) | Collapsed sidebar (64px, kun ikoner, expand on hover/click) | Ja, collapsed |
| Desktop (> 1024px) | Fuld sidebar (260px, altid synlig) | Ja, fuld |

---

## 2. Design System

### Aesthetic: Nordic Hearth

**Fonts:**
- Display: DM Serif Display (varm, autoritativ)
- Body: Inter (læsbart, neutralt)

**Color Story (CSS variables, uændret):**
- Dominant: Sand `--color-sand: #F5F0EB` — sidebar, baggrunde
- Primary: `--primary: #86A0A6` — tillid, ro
- Accent: `--accent: #E8715A` — handling, aktive states
- Foreground: `--foreground: #1A1A1A`
- Border: `--border: #E8E4DF`
- Background: `--background: #FAFAF8`

**Spacing:** 4px base. Konsistent `gap-3` / `gap-4` / `gap-6`.

**Border radius:** `rounded-xl` (16px) på kort, `rounded-lg` (12px) på knapper/inputs.

**Motion:**
- Sidebar collapse/expand: `width 200ms ease`
- Page transitions: `fade 150ms`
- Hover states: `translate-y-[-1px]` + `shadow-md` på kort
- Ingen decorativ micro-motion

**Shadows:**
- Default: `shadow-sm`
- Hover: `shadow-md`
- Ingen `shadow-lg` eller `shadow-xl`

---

## 3. Bruger-sidebar (App-mode, desktop)

**Bredde:** 260px
**Baggrund:** `bg-[var(--color-sand)]` med `border-r border-[var(--color-border)]`

### Struktur

```
┌─────────────────────────┐
│                         │
│  FamilyMind             │  ← serif, --foreground, 20px
│                         │
│  ─────────────────────  │  ← border-color
│                         │
│  🏠  Hjem               │  ← 44px høj, rounded-lg
│  💬  Fællesskab          │     px-3, gap-2 ikon+tekst
│  📚  Mine forløb         │     hover: bg-white/60
│  🔍  Opdag              │     aktiv: bg-white
│                         │           border-l-2 accent
│                         │
│        (spacer)         │  ← flex-1
│                         │
│  ─────────────────────  │
│  ┌───┐                  │
│  │ MH│ Mette Hummel     │  ← 40px avatar, bg-primary
│  └───┘ mette@fami...    │     hvide initialer
│                         │     klik → dropdown
│  🔧 Administration →    │  ← kun ADMIN/MODERATOR
└─────────────────────────┘
```

### Nav items

| Ikon (Lucide) | Label | Route | Badge |
|---|---|---|---|
| `Home` | Hjem | `/dashboard` | — |
| `MessageCircle` | Fællesskab | `/community` | Ulæste dot |
| `BookOpen` | Mine forløb | `/dashboard/courses` | — |
| `Compass` | Opdag | `/browse` | — |

### Avatar dropdown

- 👤 Rediger profil → `/dashboard/settings`
- 🔔 Notifikationer → `/dashboard/notifications`
- 💳 Abonnement → `/dashboard/settings#subscription`
- ⚙️ Indstillinger → `/dashboard/settings`
- 🚪 Log ud

### Collapsed sidebar (tablet, 64px)

- Kun ikoner, centreret vertikalt
- Tooltip med label ved hover
- Logo → monogram eller lille ikon
- Avatar → kun cirkel
- Hamburger-ikon øverst udvider til fuld sidebar som overlay

---

## 4. Bottom Tab Bar (App-mode, mobil)

**Højde:** `h-14` (56px) + safe-area padding
**Baggrund:** hvid, `border-t border-[var(--color-border)]`, subtle `shadow-[0_-1px_3px_rgba(0,0,0,0.05)]`

### Tabs

| Ikon (Lucide) | Label | Route |
|---|---|---|
| `Home` | Hjem | `/dashboard` |
| `MessageCircle` | Fællesskab | `/community` |
| `BookOpen` | Forløb | `/dashboard/courses` |
| `Compass` | Opdag | `/browse` |
| `User` | Profil | `/dashboard/profile` |

- Aktiv: accent-farve (`--accent`) på ikon + label
- Inaktiv: muted grå
- Touch targets: 44px minimum
- Labels: 10px, under ikon

### Mobil Topbar

- `h-14` (56px), hvid baggrund, bottom border
- Venstre: FamilyMind logo (lille) ELLER back-arrow på undersider
- Højre: Notifikation-klokke med badge-dot

---

## 5. Admin-sidebar

**Samme visuelle DNA som bruger-sidebar.** Sand baggrund, samme spacing, hover/aktiv states.

### Forskelle

- "ADMIN" label under logo (11px, uppercase, muted, tracking-wide)
- "← Tilbage til min side" link øverst (accent-farve, 44px)
- Sektions-headers som uppercase muted labels

### Struktur

```
FamilyMind
ADMIN

← Tilbage til min side

INDHOLD
📦 Produkter
📄 Lektioner
🗺️ Forløb
🏷️ Rabatkoder

MEDLEMMER
👥 Brugere
👥 Kohorter
🏷️ Segmentering

FÆLLESSKAB
💬 Rum
✨ Prompts
🛡️ Moderering

SYSTEM
⚙️ Indstillinger

───────────
[Avatar] Mette Hummel
         Admin
```

### Admin på mobil

- Topbar med hamburger-menu (ingen bottom tabs — admin er desktop-first)
- Hamburger åbner sidebar som slide-over fra venstre
- Overlay: `bg-black/20` backdrop
- Swipe-to-close

---

## 6. Hjem-siden (Dashboard)

**Indholdsområde:** `max-w-4xl` (896px), centreret i flex-1 container.

### Layout

#### 1. Velkomst-header
- "God aften, [Navn]" — serif, text-2xl
- Kompakt, ingen ekstra info

#### 2. Community-pills (horisontalt scroll)
- Runde pills med ikon + rumnavn + aktivitetstal
- `rounded-full`, `bg-white`, `border`, `px-4 py-2`
- Aktiv/ny: accent dot eller "(3 nye)" tekst
- Scrollbar på mobil, flex-wrap på desktop
- Klik → navigerer til `/community` med rum valgt

#### 3. Aktive forløb (store tiles)
- Sektions-header: "Dine aktive forløb"
- Store kursus-tiles (se sektion 7)
- Grid: 1 kolonne mobil, 2 kolonner desktop
- Viser dagens dag, progress, CTA

#### 4. Anbefalede kurser
- Sektions-header: "Anbefalet til dig"
- Horisontalt scroll af tiles
- Baseret på onboarding-profil

#### 5. Gennemførte (collapsed)
- Sektions-header: "Gennemførte" med expand/collapse
- Kompakte tiles med ✅ badge overlay
- Dimmed visuelt

---

## 7. Kursus-tiles

### Størrelse

- Minimum højde: 280px
- Mobil: 1 kolonne, fuld bredde
- Tablet: 2 kolonner
- Desktop: 2-3 kolonner (kontekstafhængigt)

### Struktur

```
┌──────────────────────────────────┐
│                                  │
│         [Kursus-billede]         │  ← aspect-video (16:9)
│         rounded-t-xl             │     object-cover
│                                  │     blur placeholder
│                                  │
├──────────────────────────────────┤
│  p-5                             │
│  Rolig Aften — komplet kursus   │  ← serif, 18px, max 2 linjer
│                                  │
│  Lær at skabe en tryg og rolig  │  ← body 14px, muted
│  aftenrutine for hele familien   │     line-clamp-3
│                                  │
│  📄 8 lektioner · ⏱️ 2,5 timer   │  ← 13px, muted
│                                  │
│  ████████░░░░  62%               │  ← progress bar, accent
│                                  │     6px høj, rounded-full
│  [ Fortsæt →                  ]  │  ← CTA, fuld bredde, 44px
│                                  │     accent bg
└──────────────────────────────────┘
```

### Varianter

| Kontekst | Viser | CTA |
|---|---|---|
| Aktive forløb (dashboard) | Billede + progress + fase | "Fortsæt" |
| Anbefalede (dashboard) | Billede + beskrivelse + meta | "Læs mere" |
| Gennemførte | Billede + ✅ overlay, dimmed | "Se igen" |
| Browse | Billede + beskrivelse + pris | "Køb" / "Start" |
| Mine forløb | Billede + progress + tidslinje | "Fortsæt" / "Se igen" |

### Styling

- `rounded-xl` (16px) på hele kortet
- `bg-white` med `border border-[var(--color-border)]`
- Default: `shadow-sm`
- Hover: `shadow-md` + `translate-y-[-2px]` (200ms ease)
- Ingen billede: sand-baggrund med kursus-ikon som fallback
- Skeleton: animated pulse i sand-farve

---

## 8. Community-sider (App-mode)

### Community-oversigt

```
Fællesskab                                     serif h1

[❤️ Hverdagen (3)] [❓ Spørgsmål (1)] [🏆 Wins] [💡 Tips]   ← pills

─── Hverdagen som forælder ─────────────       ← aktiv rum label

┌──────────────────────────────────────┐
│ MH  Mette · 2 timer siden           │  ← avatar + navn + tid
│                                      │
│ Velkommen til Hverdagen som          │  ← line-clamp-4
│ forælder! Her er et trygt rum...     │
│                                      │
│ 💬 3 svar · ❤️ 5                     │  ← engagement bar
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ JH  Jakob · 1 dag siden             │
│ ...                                  │
└──────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✏️ Skriv et indlæg...               │  ← sticky compose bar
└─────────────────────────────────────┘
```

### Nøgle-features

- Room pills: klik skifter feed (client-side, ingen page nav)
- Avatar-cirkler med initialer (bg-primary, hvid tekst)
- Alumni-badge 🎓 ved navn for brugere med gennemførte forløb
- Sticky compose-bar: bunden (mobil), under pills (desktop)
- Optimistic UI: indlæg vises straks
- 44px touch targets overalt

### Single post

- Back-arrow i topbar/sidebar context
- Fuld post body (ingen clamp)
- Svar i tråd-format
- Reply-bar sticky i bunden

---

## 9. Mine forløb

```
Mine forløb                                     serif h1

AKTIVE                                          section label
┌────────────────┐ ┌────────────────┐
│ [tile]         │ │ [tile]         │           2 col desktop
│ Rolig Aften    │ │ Grænser        │           1 col mobil
│ ████░░ 62%     │ │ ██░░ 25%       │
│ [Fortsæt →]   │ │ [Fortsæt →]   │
└────────────────┘ └────────────────┘

GENNEMFØRTE                                     section label
┌────────────────┐
│ [tile] ✅       │                              dimmed
│ Søvnrutiner    │
│ [Se igen →]    │
└────────────────┘
```

---

## 10. Opdag

```
Opdag                                           serif h1
Find dit næste forløb

[Alle] [Forløb] [Kurser] [Pakker]              filter pills

ANBEFALET TIL DIG                               section label
┌──────┐ ┌──────┐ ┌──────┐                     horisontalt scroll
│ tile │ │ tile │ │ tile │                     accent-border
└──────┘ └──────┘ └──────┘

ALLE FORLØB                                     section label
┌──────────┐ ┌──────────┐
│   tile   │ │   tile   │                      grid 2-3 col
└──────────┘ └──────────┘
```

---

## 11. Profil

```
┌────┐
│ MH │  Mette Hummel                            serif
└────┘  mette@familymind.dk
        Medlem siden mar. 2026

─────────────────────────────────────

👤 Rediger profil                          →    44px list items
🔔 Notifikationer                          →
💳 Abonnement                              →
📊 Min fremgang                            →
⚙️ Indstillinger                           →

─────────────────────────────────────

🔧 Administration                          →    kun ADMIN

🚪 Log ud                                       rød tekst
```

---

## 12. Website-mode (uændret)

Offentlige sider bevarer nuværende design:
- Mørk topbar (`bg-[#1A1A1A]`, `max-w-6xl`)
- Footer med fire kolonner
- Landingsside, browse (anon), subscribe, login/signup
- Community (anon) viser SEO-venlige sider med CTA

---

## 13. Max-width oversigt (ny vs. gammel)

| Side | Gammel | Ny |
|---|---|---|
| Dashboard | `max-w-2xl` (672px) | `max-w-4xl` (896px) |
| Browse | `max-w-6xl` (1152px) | `max-w-4xl` i app-mode |
| Community | `max-w-5xl` (960px) | `max-w-3xl` (768px) for feed |
| Forløb oversigt | `max-w-2xl` (672px) | `max-w-4xl` (896px) |
| Subscribe | `max-w-lg` (512px) | Uændret (website-mode) |
| Admin indhold | Ingen max | `max-w-5xl` (1024px) |

---

## 14. Implementeringsstrategi

### Fase 1: App Shell (foundation)
- AppLayout komponent (sidebar + bottom tabs + mobile topbar)
- AdminLayout redesign (lys sidebar)
- Route-based shell switching (website vs app)

### Fase 2: Dashboard redesign
- Ny hjem-side med community pills + kursus tiles
- Mine forløb side
- Profil side

### Fase 3: Community integration
- Community pills som client-side rum-switcher
- Sticky compose bar
- Avatars og alumni badges

### Fase 4: Polish
- Opdag redesign i app-mode
- Skeleton loading states
- Transitions og hover states
- Tablet collapsed sidebar

---

## Decision Log

| # | Beslutning | Alternativer | Begrundelse |
|---|---|---|---|
| 1 | Hybrid platform (kursus + community) | Kun kursus, kun community | "Et sted man føler sig hjemme" |
| 2 | Sidebar + bottom tabs | Kun sidebar, kun topbar, kun tabs | App-følelse på alle devices |
| 3 | 5 sektioner (Hjem, Fællesskab, Forløb, Opdag, Profil) | Færre/flere | Balanceret |
| 4 | To shells (website + app) | Én shell | SEO + app-følelse |
| 5 | Bevar mørk topbar (website) | Lys, transparent | Fungerer allerede |
| 6 | Nordic Hearth æstetik | Helt nyt, bevar uændret | Moderniseret uden identitetstab |
| 7 | Admin separat, samme designsprog | Integreret, helt adskilt | Rent UI, sammenhængende |
| 8 | Store kursus-tiles (min 280px) | Små kort, liste | Visuelt tydelige |
| 9 | Community pills + inline feed | Grid af kort | Hurtigere navigation |
| 10 | Profil som liste-view | Dashboard-stil | Simpelt, velkendt |
| 11 | Sand sidebar (lys) | Mørk sidebar (nuværende) | Varm, indbydende, moderne |
