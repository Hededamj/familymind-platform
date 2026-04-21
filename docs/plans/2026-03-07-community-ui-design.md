# FamilyMind Community — UI/UX Design Specification (Mobile-First)

> **Status:** GODKENDT 2026-03-07 — mobil-first revision
> **Dato:** 2026-03-07
> **Design-tilgang:** Nordic Editorial — varm, magasin-kvalitet, touch-first
> **DFII Score:** 17 (Excellent) | **MFRI Score:** 4 (Moderate — UX-valideret)

---

## 1. Design System Snapshot

### Fonts (eksisterende)
- **Display/headings:** DM Serif Display (font-serif)
- **Body:** Inter (font-sans)

### Farvepalette — white-label-sikker

**Princip:** Community bruger KUN CSS-variabler bundet til tenant-config via `layout.tsx themeVars`. Ingen hardcodede hex-værdier.

#### Tenant-bundne variabler (brugt i community)
| CSS-variabel | Default (FamilyMind) | Tailwind-klasse | Brug |
|-------------|---------------------|-----------------|------|
| `--primary` | #86A0A6 | `text-primary`, `bg-primary/5` | Prompts, rum-ikoner, links |
| `--accent` | #E8715A | `bg-accent`, `text-accent` | CTA, alumni-badge, FAB |
| `--background` | #FAFAF8 | `bg-background` | Sidebaggrund |
| `--foreground` | #1A1A1A | `text-foreground` | Primær tekst |
| `--border` | #E8E4DF | `border-border` | Grænser, dividers |
| `--color-sand` | #F5F0EB | `bg-sand` | Sektioner, pills, tomme tilstande |

#### VIGTIGT: Coral = Accent
Community bruger **altid `accent`** i stedet for `coral` — `accent` er tenant-konfigurerbar.

#### Tech debt: variabler der mangler i tenant-config
`--card`, `--muted`, `--secondary`, `--accent-foreground`, `--color-sand-dark` — tilføjes når `tenant.service.ts` bygges.

### Ingen community-specifikke tokens
Alt styres via eksisterende design tokens.

### Spacing rhythm
- Container: `max-w-2xl mx-auto px-4 py-6 sm:px-8 sm:py-8`
- Mellem sektioner: `space-y-6`
- Mellem kort: `space-y-3` (mobil), `space-y-4` (desktop)
- Intern kort-padding: `px-4 pt-4 pb-2` (mobil), `p-5 sm:p-6` (desktop)

### Motion philosophy
- Entry: `animate-fade-in-up` + `stagger-children` (kun desktop)
- Tap-feedback: `active:scale-95` (FAB), `active:bg-muted/50` (knapper)
- Hover: `card-hover` kun på `sm:` — ingen hover-effekter på mobil
- Ingen nye animationer

---

## 2. Mobile-First Designprincipper

### Baseline: 375px (iPhone SE/13 mini)

### Thumb Zone
```
┌─────────────┐
│  HARD REACH │  ← Breadcrumbs (skjult mobil), sekundær nav
│             │
│  OK REACH   │  ← Feed-indhold, scroll
│             │
│  EASY REACH │  ← Like, svar, FAB, sticky bars
│  ▓▓▓▓▓▓▓▓▓ │
└─────────────┘
```

### Touch Targets
- **Minimum:** 44px (Apple HIG) — gælder ALLE interaktive elementer
- Action-knapper: `min-h-[44px] min-w-[44px]`
- Links i tekst: ekstra `py-1` padding

### Ingen Hover-afhængighed
- `active:` feedback i stedet for `hover:`
- Alumni-badge info via tap (bottom sheet fremtidig), ikke hover tooltip

---

## 3. Skærmbilleder — Oversigt

| # | Skærm | Route | Mobil-nøgle |
|---|-------|-------|-------------|
| A | Rum-oversigt | `/community` | Horisontale rum-pills + feed |
| B | Rum-feed | `/community/[rum-slug]` | Sticky rum-bar + FAB |
| C | Enkelt opslag | `/community/[rum-slug]/[post-slug]` | Sticky svar-bar i bund |
| D | Opret opslag | Bottom sheet / inline | Full-screen på mobil |
| E | Svar-form | Sticky i bund | Keyboard-aware full-screen |
| F | CTA for anonyme | Komponent | Sticky bottom bar |
| G | Alumni-badge | Komponent | Tap → bottom sheet (fremtidig) |
| H | Tomme tilstande | Diverse | Kompakt, CTA i thumb zone |

---

## 4. Skærm A: Rum-oversigt (`/community`)

### Mobil-layout (375px)
```
┌──────────────────────────┐
│ ← Community     [Søg]   │  44px header
├──────────────────────────┤
│  Fællesskab              │  Kompakt hero
│  142 medlemmer · 38 uge  │
├──────────────────────────┤
│ ┌────┐┌────┐┌────┐┌────┐│  Horisontale rum-pills
│ │☕  ││❓  ││🏆  ││💡  ││  (scroll horisontalt)
│ └────┘└────┘└────┘└────┘│
├──────────────────────────┤
│  Populære samtaler       │
│  ┌──────────────────────┐│
│  │ 👤 Marie  · Alumni   ││  Post-preview
│  │ i Spørgsmål & svar   ││
│  │ "Vores 2-årige vil   ││
│  │  ikke sove alene..." ││
│  │ 💬 12  ❤️ 8  · 2t    ││
│  └──────────────────────┘│
│  ┌──────────────────────┐│
│  │ ...                  ││
│  └──────────────────────┘│
│  ┌──────────────────────┐│
│  │ CTA: Bliv en del     ││  Kun anonyme
│  └──────────────────────┘│
└──────────────────────────┘
```

### Desktop-layout (sm+)
Hero + 2-kolonne rum-grid (fulde kort med ikon, navn, beskrivelse) + populære samtaler.

### Komponent-specifikationer

#### Kompakt hero
```tsx
<div className="mb-4">
  <h1 className="font-serif text-2xl sm:text-4xl">Fællesskab</h1>
  <p className="mt-1 hidden text-base text-muted-foreground leading-relaxed sm:block">
    Et trygt sted at dele hverdagen som forælder
  </p>
  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground sm:mt-4 sm:gap-4 sm:text-sm">
    <span className="flex items-center gap-1.5">
      <Users className="size-3.5 sm:size-4" />
      {stats.members} medlemmer
    </span>
    <span className="flex items-center gap-1.5">
      <MessageSquare className="size-3.5 sm:size-4" />
      {stats.postsThisWeek} denne uge
    </span>
  </div>
</div>
```

#### Horisontale rum-pills (mobil) + grid (desktop)
```tsx
{/* MOBIL: horisontale pills — indhold starter med det samme */}
<div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:hidden">
  <div className="flex gap-2 pb-2">
    {rooms.map(room => (
      <Link
        key={room.id}
        href={`/community/${room.slug}`}
        className="flex shrink-0 items-center gap-2 rounded-full border border-border
                   bg-white px-4 py-2.5 text-sm font-medium
                   active:scale-95 active:bg-sand"
      >
        <RoomIcon className="size-4 text-primary" />
        <span className="whitespace-nowrap">{room.name}</span>
        <span className="text-xs text-muted-foreground">{room._count.posts}</span>
      </Link>
    ))}
  </div>
</div>

{/* DESKTOP: fulde rum-kort i 2-kolonne grid */}
<div className="hidden gap-4 sm:grid sm:grid-cols-2 stagger-children">
  {rooms.map(room => (
    <Link href={`/community/${room.slug}`} key={room.id}>
      <div className="card-hover group rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-sand">
          <RoomIcon className="size-5 text-primary" />
        </div>
        <h3 className="font-serif text-lg">{room.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{room.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{room._count.posts} opslag</span>
          <span>·</span>
          <span>Seneste: {timeAgo(room.lastPostAt)}</span>
        </div>
      </div>
    </Link>
  ))}
</div>
```

**Rum-ikoner:** Lucide-ikon i databasen. Default: Hverdagen→`Coffee`, Spørgsmål→`HelpCircle`, Wins→`Trophy`, Tips→`Lightbulb`

**Hvorfor pills:** 4 rum-kort i 1-kolonne = ~4 skærmhøjder scroll. Pills = 44px, alt synligt, indhold starter med det samme.

#### Populære diskussioner
```tsx
<section className="mt-6 sm:mt-10">
  <h2 className="font-serif text-lg sm:text-2xl">Populære samtaler</h2>
  <div className="mt-3 space-y-3 sm:mt-4">
    {popularPosts.map(post => (
      <Link href={`/community/${post.room.slug}/${post.slug}`} key={post.id}>
        <article className="rounded-xl border border-border bg-white p-4 sm:p-5
                            active:bg-muted/30 sm:card-hover">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full
                            bg-sand text-xs font-bold sm:size-8">
              {post.author.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              {/* flex-wrap: bryder til 2. linje ved overflow på 375px */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                <span className="font-medium">{post.author.firstName}</span>
                {post.author.alumniJourneys?.length > 0 && (
                  <AlumniBadge journey={post.author.alumniJourneys[0]} size="sm" />
                )}
                <span className="text-muted-foreground">
                  i {post.room.name} · {timeAgo(post.createdAt)}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed">{post.body}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="size-3.5" /> {post._count.replies}
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="size-3.5" /> {post._count.reactions}
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    ))}
  </div>
</section>
```

### SEO (Skærm A)
- `<title>`: "Fællesskab — [Org]"
- JSON-LD: `DiscussionForum`
- Breadcrumbs: JSON-LD altid + visuelt kun `sm:` (skjult mobil)

---

## 5. Skærm B: Rum-feed (`/community/[rum-slug]`)

### Mobil-layout (375px)
```
┌──────────────────────────┐
│ ← Spørgsmål & svar      │  44px back-header
├──────────────────────────┤
│ ☕ Hve. ❓ Spø. 🏆 Wi. 💡│  Sticky rum-pills
├──────────────────────────┤
│ [Nyeste] [Populære]      │  Sortering (40px tabs)
├──────────────────────────┤
│  ┌──────────────────────┐│
│  │ 👤 Marie             ││
│  │ Alumni · 2t siden    ││
│  │ "Tekst..."           ││
│  │ ❤️ 8    💬 12    ··· ││  44px actions
│  └──────────────────────┘│
│  ┌──────────────────────┐│
│  │ ...                  ││
│  └──────────────────────┘│
│  [ Vis flere opslag ]    │
│              ┌──────┐    │
│              │  ✏️  │    │  FAB (56px, accent)
│              └──────┘    │
└──────────────────────────┘
```

### Komponent-specifikationer

#### Mobil back-header (erstatter breadcrumbs)
```tsx
<div className="flex min-h-[44px] items-center gap-3 sm:hidden">
  <Link href="/community"
    className="flex size-[44px] items-center justify-center -ml-3"
    aria-label="Tilbage til community">
    <ArrowLeft className="size-5" />
  </Link>
  <h1 className="truncate font-serif text-lg min-w-0 flex-1">{room.name}</h1>
</div>

{/* Desktop: fuld header med ikon + beskrivelse */}
<div className="mb-6 hidden sm:block">
  <Link href="/community"
    className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
    <ArrowLeft className="size-3.5" /> Community
  </Link>
  <div className="flex items-start gap-4">
    <div className="flex size-12 items-center justify-center rounded-xl bg-sand">
      <RoomIcon className="size-6 text-primary" />
    </div>
    <div>
      <h1 className="font-serif text-2xl sm:text-3xl">{room.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{room.description}</p>
      <Badge variant="secondary" className="mt-2 rounded-full text-xs">
        {room._count.posts} opslag
      </Badge>
    </div>
  </div>
</div>
```

#### Sticky rum-pills (kun mobil)
```tsx
<div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95
                px-4 py-2 backdrop-blur-sm sm:hidden">
  <div className="scrollbar-none flex gap-2 overflow-x-auto">
    {rooms.map(room => (
      <Link key={room.id} href={`/community/${room.slug}`}
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium',
          room.slug === currentSlug
            ? 'bg-primary text-primary-foreground'
            : 'bg-sand text-foreground active:bg-sand-dark'
        )}>
        <RoomIcon className="size-3.5" />
        {room.name}
      </Link>
    ))}
  </div>
</div>
```

**Hvorfor sticky:** Brugeren kan skifte rum uden back-navigation. Inspiration: Instagram stories, Slack channels.

#### Sortering — touchvenlig
```tsx
<div className="mb-4 flex gap-1 rounded-lg bg-sand p-1">
  {(['newest', 'popular'] as const).map(option => (
    <button key={option} onClick={() => setSort(option)}
      className={cn(
        'min-h-[40px] flex-1 rounded-md px-3 text-sm font-medium transition-colors',
        sort === option
          ? 'bg-white text-foreground shadow-sm'
          : 'text-muted-foreground active:bg-white/50'
      )}>
      {option === 'newest' ? 'Nyeste' : 'Populære'}
    </button>
  ))}
</div>
```

#### Post-kort — mobil-optimeret
```tsx
<article>
  <Card className={cn(
    post.isPrompt && 'border-primary/30 bg-primary/5',
    post.isFeatured && 'border-accent/20 bg-sand',
  )}>
    <CardContent className="px-4 pt-4 pb-2 sm:px-6 sm:pt-5 sm:pb-3">
      {/* Forfatter — flex-wrap safe på 375px */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full
                          bg-muted text-xs font-bold sm:size-8">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium">{firstName}</span>
              {alumni && <AlumniBadge journey={alumni} size="sm" />}
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        {post.isPinned && (
          <Pin className="size-4 shrink-0 text-muted-foreground" aria-label="Fastgjort" />
        )}
      </div>

      {/* Body */}
      <Link href={`/community/${room.slug}/${post.slug}`}>
        <p className="mb-3 whitespace-pre-wrap text-[15px] leading-relaxed
                       active:text-foreground/70">
          {post.body}
        </p>
      </Link>

      {isOwner && !post.isPublic && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <EyeOff className="size-3" /> Kun for medlemmer
        </div>
      )}

      {/* Action bar — 44px touch targets */}
      <div className="flex items-center gap-1 border-t border-border pt-1 -mx-1">
        <button className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5
                           rounded-lg px-3 text-xs text-muted-foreground active:bg-muted/50"
                aria-label={hasLiked ? 'Fjern like' : 'Like'}>
          <Heart className={cn('size-4', hasLiked && 'fill-current text-red-500')} />
          {reactions > 0 && <span>{reactions}</span>}
        </button>
        <button className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5
                           rounded-lg px-3 text-xs text-muted-foreground active:bg-muted/50"
                aria-label="Svar">
          <MessageSquare className="size-4" />
          {replies > 0 && <span>{replies}</span>}
        </button>
        <div className="flex-1" />
        <button className="flex min-h-[44px] min-w-[44px] items-center justify-center
                           rounded-lg text-muted-foreground active:bg-muted/50"
                aria-label="Flere handlinger">
          <MoreHorizontal className="size-4" />
        </button>
      </div>
    </CardContent>
  </Card>
</article>
```

#### FAB — kun mobil, kun auth
```tsx
{isAuthenticated && (
  <button onClick={() => setPostFormOpen(true)}
    className="fixed bottom-6 right-4 z-30 flex size-14 items-center justify-center
               rounded-full bg-accent text-accent-foreground shadow-lg
               active:scale-95 sm:hidden"
    aria-label="Opret opslag">
    <Plus className="size-6" />
  </button>
)}
```

#### Load more
```tsx
<div className="mt-4 flex justify-center pb-20"> {/* pb-20: plads til FAB */}
  <Button variant="outline" className="min-h-[44px] rounded-full px-6">
    Vis flere opslag
  </Button>
</div>
```

### SEO (Skærm B)
- `<title>`: "{Rum} — Fællesskab — [Org]"
- JSON-LD: `DiscussionForum` + `DiscussionForumPosting` items
- Breadcrumbs: JSON-LD altid + visuelt kun `sm:`

---

## 6. Skærm C: Enkelt opslag (`/community/[rum-slug]/[post-slug]`)

### Mobil-layout (375px)
```
┌──────────────────────────┐
│ ← Spørgsmål & svar      │  44px back
├──────────────────────────┤
│  ┌──────────────────────┐│
│  │ 👤 Marie · Alumni    ││  Hoved-opslag
│  │ 3. mar 2026          ││
│  │ "Fuld tekst..."      ││
│  │ ❤️ 8  💬 12  ···     ││
│  └──────────────────────┘│
│  12 svar                 │
│  ┃ ┌────────────────────┐│
│  ┃ │ 👤 Anders · 1t     ││  Border-l svar
│  ┃ │ "Svar-tekst..."    ││
│  ┃ │ ❤️ 3               ││
│  ┃ └────────────────────┘│
│  ┌──────────────────────┐│
│  │ Fra samme rum        ││  Relaterede
│  └──────────────────────┘│
│  (padding for sticky)    │
├──────────────────────────┤
│ 👤 Skriv et svar...  [→]│  Sticky svar-bar
└──────────────────────────┘
```

### Hoved-opslag
```tsx
<Card>
  <CardContent className="px-4 pt-4 sm:px-6 sm:pt-6">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
        {initial}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{firstName}</span>
          {alumni && <AlumniBadge journey={alumni} />}
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
      </div>
    </div>
    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</p>
    {isOwner && !post.isPublic && (
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <EyeOff className="size-3" /> Kun for medlemmer
      </div>
    )}
    {/* Action bar — same 44px pattern som post-kort */}
    <div className="mt-4 flex items-center gap-1 border-t border-border pt-1 -mx-1">
      {/* ... same as post-kort action bar ... */}
    </div>
  </CardContent>
</Card>
```

### Svar-tråd — mobil-tilpasset indent
```tsx
<div className="mt-6">
  <h3 className="font-serif text-lg">{replies.length} svar</h3>
  {/* Reduceret indent mobil: ml-1 pl-3 vs ml-4 pl-6 desktop */}
  <div className="mt-4 ml-1 space-y-3 border-l-2 border-muted pl-3 sm:ml-4 sm:pl-6">
    {replies.map(reply => (
      <div key={reply.id} className="rounded-lg bg-muted/50 px-3 py-3 sm:px-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
            {reply.author.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium">{reply.author.firstName}</span>
          {reply.author.alumniJourneys?.length > 0 && (
            <AlumniBadge journey={reply.author.alumniJourneys[0]} size="sm" />
          )}
          <span className="text-xs text-muted-foreground">{timeAgo(reply.createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply.body}</p>
        <button className="mt-1 flex min-h-[44px] items-center gap-1.5 rounded-lg
                           px-2 -ml-2 text-xs text-muted-foreground active:bg-muted/50">
          <Heart className={cn('size-3.5', hasLiked && 'fill-current text-red-500')} />
          {reply._count.reactions > 0 && reply._count.reactions}
        </button>
      </div>
    ))}
  </div>
</div>
```

### Sticky svar-bar (mobil — nøglekomponent)
```tsx
{isAuthenticated ? (
  <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white
                  p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:hidden">
    <div className="flex items-center gap-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full
                      bg-muted text-[10px] font-bold">{initial}</div>
      <button onClick={() => setReplyFormOpen(true)}
        className="min-h-[40px] flex-1 rounded-full border border-border bg-muted/30
                   px-4 text-left text-sm text-muted-foreground">
        Skriv et svar...
      </button>
    </div>
  </div>
) : (
  <StickyAnonymousCTA />
)}
<div className="h-20 sm:hidden" /> {/* Padding for sticky bar */}
```

### Relaterede diskussioner
```tsx
<section className="mt-6 rounded-2xl bg-sand p-4 sm:mt-8 sm:p-6">
  <h3 className="font-serif text-base">Fra samme rum</h3>
  <div className="mt-3 space-y-2">
    {relatedPosts.map(rp => (
      <Link key={rp.id} href={`/community/${room.slug}/${rp.slug}`}
        className="block min-h-[44px] rounded-lg bg-white p-3 text-sm
                   active:bg-white/80 sm:hover:bg-white/80">
        <p className="line-clamp-1">{rp.body}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="size-3" /> {rp._count.replies} svar
        </div>
      </Link>
    ))}
  </div>
</section>
```

### SEO (Skærm C)
- `<title>`: Auto fra post-body (60 tegn) + " — [Rum]"
- `<meta description>`: Post-body (155 tegn)
- JSON-LD: `DiscussionForumPosting` (+ `QAPage` for Q&A-rum)
- `<meta robots>`: `noindex` under indekseringstærskel
- `rel="ugc"` på bruger-links

---

## 7. Skærm D: Opret opslag

### Mobil: Full-screen overlay (fra FAB)
```tsx
<div className="fixed inset-0 z-50 bg-background sm:hidden">
  {/* Header */}
  <div className="flex min-h-[56px] items-center justify-between border-b border-border px-4">
    <button onClick={handleClose}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center -ml-2">
      <X className="size-5" />
    </button>
    <span className="font-serif text-base">Nyt opslag</span>
    <Button size="sm" className="min-h-[36px]"
      onClick={handleSubmit} disabled={isPending || !body.trim()}>
      {isPending ? 'Deler...' : 'Del'}
    </Button>
  </div>

  {/* Form */}
  <div className="p-4">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-bold">
        {initial}
      </div>
      <div>
        <span className="text-sm font-medium">{firstName}</span>
        {/* isPublic: kompakt pill-toggle */}
        <button onClick={() => setIsPublic(!isPublic)}
          className="mt-0.5 flex items-center gap-1 rounded-full bg-sand px-2 py-0.5
                     text-[11px] text-muted-foreground active:bg-sand-dark">
          {isPublic ? <><Globe className="size-3" /> Offentligt</> : <><EyeOff className="size-3" /> Kun medlemmer</>}
        </button>
      </div>
    </div>
    {/* 16px font: forhindrer iOS autozoom */}
    <textarea value={body} onChange={(e) => setBody(e.target.value)}
      placeholder="Hvad tænker du på? Del en oplevelse, stil et spørgsmål..."
      className="w-full resize-none bg-transparent text-[16px] leading-relaxed
                 placeholder:text-muted-foreground focus:outline-none"
      style={{ minHeight: 'calc(100vh - 200px)' }}
      maxLength={5000} autoFocus />
  </div>

  <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background
                  px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
    <span className="text-xs text-muted-foreground">{body.length}/5000</span>
  </div>
</div>
```

### Desktop: Inline collapsed → expanded (sm+)
```tsx
<div className="hidden sm:block">
  {!isOpen ? (
    <Card className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => setIsOpen(true)}>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
          {initial}
        </div>
        <p className="text-sm text-muted-foreground">Del noget med fællesskabet...</p>
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardContent className="pt-5">
        {/* Avatar + navn */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
            {initial}
          </div>
          <span className="text-sm font-medium">{firstName}</span>
        </div>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="Hvad tænker du på? Del en oplevelse, stil et spørgsmål..."
          rows={4} className="resize-none text-sm" maxLength={5000} autoFocus />
        <div className="mt-3 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            {isPublic ? <><Globe className="size-3" /> Synligt for alle</> : <><EyeOff className="size-3" /> Kun for medlemmer</>}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{body.length}/5000</span>
            <Button variant="ghost" size="sm" onClick={handleCancel}>Annuller</Button>
            <Button size="sm" onClick={handleSubmit} disabled={isPending || !body.trim()}>
              {isPending ? 'Opretter...' : 'Del opslag'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )}
</div>
```

---

## 8. Skærm E: Svar-form

### Mobil: Full-screen (fra sticky bar)
```tsx
<div className="fixed inset-0 z-50 flex flex-col bg-background sm:hidden">
  <div className="flex min-h-[56px] items-center justify-between border-b border-border px-4">
    <button onClick={handleClose}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center -ml-2">
      <X className="size-5" />
    </button>
    <span className="font-serif text-base">Svar</span>
    <Button size="sm" className="min-h-[36px]"
      onClick={handleSubmit} disabled={isPending || !body.trim()}>
      {isPending ? 'Sender...' : 'Svar'}
    </Button>
  </div>
  {/* Original post kontekst */}
  <div className="border-b border-border px-4 py-3 bg-sand/50">
    <p className="line-clamp-2 text-xs text-muted-foreground">{originalPost.body}</p>
  </div>
  <div className="flex-1 p-4">
    <textarea value={body} onChange={(e) => setBody(e.target.value)}
      placeholder="Skriv et svar..."
      className="w-full resize-none bg-transparent text-[16px] leading-relaxed
                 placeholder:text-muted-foreground focus:outline-none"
      maxLength={2000} autoFocus />
  </div>
  <div className="border-t border-border px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
    <span className="text-xs text-muted-foreground">{body.length}/2000</span>
  </div>
</div>
```

### Desktop: Inline form (sm+)
```tsx
<div className="mt-4 hidden rounded-xl border border-border bg-white p-4 sm:block">
  <div className="mb-2 flex items-center gap-2">
    <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
      {initial}
    </div>
    <span className="text-xs font-medium">{firstName}</span>
  </div>
  <Textarea value={body} onChange={(e) => setBody(e.target.value)}
    placeholder="Skriv et svar..." rows={2} className="resize-none text-sm" maxLength={2000} />
  <div className="mt-2 flex items-center justify-between">
    <span className="text-xs text-muted-foreground">{body.length}/2000</span>
    <Button size="sm" onClick={handleSubmit} disabled={isPending || !body.trim()}>
      {isPending ? 'Sender...' : 'Svar'}
    </Button>
  </div>
</div>
```

---

## 9. Skærm F: CTA for anonyme

### Variant 1: Inline (erstatter form)
```tsx
<div className="rounded-xl border border-border bg-sand p-5 text-center">
  <MessageSquare className="mx-auto mb-2 size-6 text-primary" />
  <p className="text-sm font-medium">Vil du deltage i samtalen?</p>
  <p className="mt-1 text-xs text-muted-foreground">Opret en gratis konto og del dine erfaringer</p>
  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
    <Button className="min-h-[44px] w-full sm:w-auto" asChild>
      <Link href="/auth/signup?from=community">Opret gratis konto</Link>
    </Button>
    <Button variant="ghost" className="min-h-[44px] w-full sm:w-auto" asChild>
      <Link href="/auth/login?from=community">Log ind</Link>
    </Button>
  </div>
</div>
```

### Variant 2: Sticky bottom-bar (mobil)
```tsx
<div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95
                p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:hidden">
  <div className="flex items-center gap-3">
    <p className="flex-1 text-sm font-medium">Bliv en del af fællesskabet</p>
    <Button size="sm" className="min-h-[40px] shrink-0 bg-accent text-accent-foreground" asChild>
      <Link href="/auth/signup?from=community">Opret konto</Link>
    </Button>
  </div>
</div>
```

### Variant 3: Sektion-CTA (bund af oversigt)
```tsx
<section className="mt-8 overflow-hidden rounded-2xl border border-border sm:mt-10">
  <div className="bg-sand p-5 text-center sm:p-8">
    <div className="mx-auto max-w-sm">
      <h2 className="font-serif text-xl sm:text-2xl">Bliv en del af fællesskabet</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Danske forældre deler hverdagens udfordringer og sejre. Vær med.
      </p>
      <Button className="mt-4 min-h-[44px] w-full bg-accent text-accent-foreground sm:w-auto" asChild>
        <Link href="/auth/signup?from=community">Opret gratis konto</Link>
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Allerede medlem? <Link href="/auth/login?from=community" className="underline active:text-foreground">Log ind</Link>
      </p>
    </div>
  </div>
</section>
```

---

## 10. Skærm G: Alumni-badge
```tsx
function AlumniBadge({ journey, size = 'default' }: { journey: { title: string }, size?: 'sm' | 'default' }) {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[9px] gap-0.5' : 'px-2 py-0.5 text-[10px] gap-1'
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full font-medium bg-accent/10 text-accent', sizeClasses)}>
      <Award className={size === 'sm' ? 'size-2.5' : 'size-3'} />
      Alumni
    </span>
  )
}
```
- `shrink-0`: badge komprimeres aldrig, navn truncates i stedet
- Ingen `title`-attribut (virker ikke mobil) — fremtidig: tap → bottom sheet

---

## 11. Skærm H: Tomme tilstande

### Tomt rum
```tsx
<div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center sm:px-8 sm:py-12">
  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-sand">
    <MessageSquare className="size-6 text-muted-foreground/40" />
  </div>
  <h3 className="font-serif text-lg">Ingen opslag endnu</h3>
  <p className="mt-1 text-sm text-muted-foreground">Vær den første til at starte en samtale</p>
  {isAuthenticated && (
    <Button className="mt-4 min-h-[44px]" onClick={() => setFormOpen(true)}>Opret det første opslag</Button>
  )}
</div>
```

### Intet community
```tsx
<div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center sm:p-12">
  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-sand">
    <Users className="size-7 text-muted-foreground/40" />
  </div>
  <h2 className="font-serif text-xl">Fællesskabet åbner snart</h2>
  <p className="mt-2 mx-auto max-w-xs text-sm text-muted-foreground">
    Vi arbejder på at skabe et trygt rum for danske forældre.
  </p>
  <Button className="mt-4 min-h-[44px] w-full bg-accent text-accent-foreground sm:w-auto" asChild>
    <Link href="/auth/signup">Opret gratis konto</Link>
  </Button>
</div>
```

---

## 12. Kohorte locked state
```tsx
<Card className="relative overflow-hidden">
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
    <div className="mx-4 max-w-xs rounded-2xl bg-white p-5 text-center shadow-lg sm:p-6">
      <Lock className="mx-auto mb-3 size-6 text-primary" />
      <h3 className="font-serif text-base">Eksklusivt for deltagere</h3>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
        Starter du et forløb, får du adgang til en lille gruppe
      </p>
      <Button className="mt-3 min-h-[44px] w-full sm:w-auto" asChild>
        <Link href="/browse">Udforsk forløb</Link>
      </Button>
    </div>
  </div>
  <CardContent className="pt-5 blur-[3px] select-none" aria-hidden />
</Card>
```

---

## 13. Mobil-specifik UX

### Safe Area Insets
Alle sticky bottom-elementer: `pb-[calc(0.75rem+env(safe-area-inset-bottom))]`
Kræver `viewport-fit=cover` i meta viewport.

### Keyboard Handling
- Post + svar: Full-screen overlay → keyboard skubber ikke indhold
- `text-[16px]` på alle inputs → forhindrer iOS Safari autozoom

### Scroll Restoration
Next.js `scrollRestoration: 'auto'` — brugeren vender tilbage til scroll-position.

### Pull-to-Refresh
Native browser PTR virker fordi feeds er server-rendered.

---

## 14. Responsiv strategi — samlet

| Element | Mobil (< 640px) | Desktop (sm+) |
|---------|-----------------|---------------|
| **Navigation** | Back-arrow + sticky rum-pills | Breadcrumbs + fuld header |
| **Rum-oversigt** | Horisontale pills → feed | 2-kolonne grid → feed |
| **Opret opslag** | FAB → full-screen | Inline collapsed → expanded |
| **Svar** | Sticky bar → full-screen | Inline form under tråd |
| **Actions** | 44px min, `active:` feedback | shadcn buttons, `hover:` |
| **Forfatter-linje** | `flex-wrap` + `truncate` | 1-linje |
| **Breadcrumbs** | Skjult (kun JSON-LD) | Visuelt + JSON-LD |
| **CTA (anonym)** | Sticky bottom-bar | Inline/sektion |
| **Input font** | 16px (anti-zoom) | Standard |
| **Safe area** | `env(safe-area-inset-bottom)` | N/A |

---

## 15. Tilgængelighed

| Krav | Implementation |
|------|----------------|
| Touch targets | Min 44px ALLE elementer |
| Farvekontrast | WCAG AA |
| Keyboard | Alle elementer focusable (shadcn) |
| Skærmlæser | `<article>`, `<section>`, aria-labels |
| Focus | `outline-ring/50` |
| Reduced motion | `prefers-reduced-motion` |
| Safe areas | `env(safe-area-inset-bottom)` |
| Zoom prevention | `text-[16px]` på inputs |

---

## 16. Komponent-hierarki

```
app/community/
├── page.tsx                          ← Rum-oversigt
├── layout.tsx                        ← Shared layout (max-w, breadcrumbs desktop)
├── [roomSlug]/
│   ├── page.tsx                      ← Rum-feed
│   └── [postSlug]/
│       └── page.tsx                  ← Enkelt opslag
└── _components/
    ├── community-hero.tsx            ← Kompakt hero
    ├── room-pills.tsx                ← Horisontale rum-pills (mobil)
    ├── room-card.tsx                 ← Rum-kort (desktop grid)
    ├── room-header.tsx               ← Back-header (mobil) + fuld header (desktop)
    ├── sticky-room-bar.tsx           ← Sticky rum-navigation (mobil)
    ├── sort-tabs.tsx                 ← Sortering (touch-safe)
    ├── post-card.tsx                 ← Post-kort (44px actions)
    ├── reply-card.tsx                ← Svar-kort (44px like)
    ├── post-form.tsx                 ← FAB + full-screen (mobil) / inline (desktop)
    ├── reply-form.tsx                ← Sticky bar + full-screen (mobil) / inline (desktop)
    ├── alumni-badge.tsx              ← Alumni-badge (shrink-0)
    ├── community-cta.tsx             ← CTA (3 varianter, 44px knapper)
    ├── related-posts.tsx             ← Relaterede diskussioner
    ├── empty-room.tsx                ← Tom tilstand
    ├── empty-community.tsx           ← Intet community
    ├── locked-cohort.tsx             ← Blur-overlay
    ├── community-breadcrumbs.tsx     ← Kun desktop
    └── community-seo.tsx             ← SEO meta/JSON-LD
```

---

## 17. Differentiation Callout

> **Denne design undgår generisk forum-UI ved at:**
> - Bruge horisontale rum-pills (som Instagram stories) i stedet for en menu/sidebar
> - FAB + full-screen post-overlay i stedet for inline form der kæmper med keyboard
> - Sticky svar-bar (som iMessage) i stedet for scroll-til-bund form
> - 44px touch targets med `active:` feedback i stedet for desktop-shrunk buttons
> - Back-arrow + rumnavn i stedet for breadcrumbs der spiser plads
> - Full-screen forms med 16px font i stedet for cramped inline inputs
> - Sand-farvede pills og varme kort i stedet for blå/grå tech-forum

---

## 18. Admin-perspektiv (kort)

`/admin/community` (omdøbt fra `/admin/cohorts`):
- **Rum-tab:** CRUD (navn, slug, beskrivelse, ikon, synlighed, sortering)
- **Prompt-kø-tab:** Opret/rediger prompts, kø-status, pause/genoptag
- **Moderation-tab:** Rapporterede opslag + rum-filter
- **Statistik:** Opslag pr. rum, aktive brugere, engagement-rate

Admin følger eksisterende admin-patterns (desktop-first, tabel, tabs).

---

## 19. Næste skridt

1. [ ] Godkend dette UI/UX-design
2. [ ] Opdater implementeringsplan med mobile-first specifikationer
3. [ ] Start udvikling via subagent-driven approach
