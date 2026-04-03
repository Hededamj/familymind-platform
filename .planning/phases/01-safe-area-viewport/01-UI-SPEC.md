---
phase: 1
slug: safe-area-viewport
status: draft
shadcn_initialized: true
preset: new-york / neutral / css-variables
created: 2026-04-03
---

# Phase 1 — UI Design Contract: Safe Area & Viewport

> Visual and interaction contract for Phase 1. This phase applies CSS safe-area-inset values to fixed and sticky UI chrome. It is NOT a visual redesign — no colors, fonts, or layouts change. The contract below specifies precise behavior for the four affected elements.

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn/ui | components.json |
| Style | new-york | components.json |
| Base color | neutral | components.json |
| CSS variables | true | components.json |
| Component library | Radix UI (via shadcn) | components.json |
| Icon library | lucide-react | components.json |
| Font (sans) | Inter | globals.css --font-sans |
| Font (serif) | DM Serif Display | globals.css --font-serif |
| Font (mono) | Geist Mono | globals.css --font-mono |
| Registry | shadcn official only | components.json registries: {} |

---

## Spacing Scale

Declared values (Tailwind default 4pt scale — unchanged by this phase):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 16px | Default element spacing, px-4 |
| lg | 24px | Section padding, pt-6 |
| xl | 32px | Layout gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions:
- Bottom tab bar fixed height: 56px (h-14) — unchanged
- Topbar fixed height: 56px (h-14) — unchanged
- Onboarding footer button height: 48px (h-12) — unchanged
- Check-in submit button: standard `size="lg"` from shadcn Button — unchanged
- Safe-area clearance values are device-reported (env() functions), not fixed tokens

---

## Typography

Typography is unchanged in this phase. Recorded here as baseline for downstream phases.

| Role | Size | Weight | Line Height | Font | Source |
|------|------|--------|-------------|------|--------|
| Body | 16px (text-base) | 400 | 1.5 | Inter (sans) | globals.css |
| Label / small | 14px (text-sm) | 400 | 1.5 | Inter (sans) | globals.css |
| Tab label | 10px (text-[10px]) | 400 | 1 | Inter (sans) | bottom-tab-bar.tsx |
| Sub-heading | 18px (text-lg) | serif | 1.2 | DM Serif Display | app-topbar.tsx, wizard |
| Heading | 20–24px (text-xl/2xl) | serif | 1.2 | DM Serif Display | onboarding-wizard.tsx |

---

## Color

Colors are unchanged in this phase. Recorded here as baseline.

| Role | Value | Usage | Source |
|------|-------|-------|--------|
| Dominant (60%) | #FAFAF8 (--background) | Page background, topbar bg, tab bar bg, wizard bg | globals.css |
| Secondary (30%) | #FFFFFF (--card) / #F5F0EB (--secondary) | Cards, option buttons, input fields | globals.css |
| Accent (10%) | #E8715A (--accent) | Active tab indicator, unread notification dot | globals.css |
| Primary | #86A0A6 (--primary) | Selected state borders, progress bar fill, slider | globals.css |
| Destructive | #C44B3F (--destructive) | Error messages only | globals.css |
| Border | #E8E4DF (--border) | Topbar bottom border, tab bar top border, wizard footer border | globals.css |

Accent (#E8715A) reserved for:
1. Active tab icon and label in BottomTabBar
2. Unread notification dot in AppTopbar
No other elements in Phase 1 use the accent color.

---

## Safe-Area Behavior Contract

This section is the primary contract for Phase 1. It specifies exact CSS behavior per component.

### SAFE-01 — AppTopbar (components/layout/app-topbar.tsx)

**Current state:** `sticky top-0 h-14` — no safe-area-inset-top applied.

**Problem:** On iPhones with notch or Dynamic Island, the status bar overlaps the topbar because `top-0` places the element at the physical screen edge, not the safe viewport edge.

**Required change:**
- Add `padding-top: env(safe-area-inset-top, 0px)` to the `<header>` element.
- Increase the header's total height dynamically: `height: calc(56px + env(safe-area-inset-top, 0px))`.
- The visible content area (brand name, back button, bell icon) must remain centered within the 56px below the inset — not stretched.

**Implementation pattern:**
```
style={{
  paddingTop: 'env(safe-area-inset-top, 0px)',
  height: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
}}
```
Remove `h-14` from className (height is now controlled via style). Keep all other classes unchanged.

**Visual contract:** On a notch device, the topbar background fills behind the status bar (correct). The brand name / back button / bell icon sit 16px below the notch, not under it.

---

### SAFE-02 — BottomTabBar (components/layout/bottom-tab-bar.tsx)

**Current state:** `fixed bottom-0 h-14` with `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}`.

**Problem:** `paddingBottom` shifts content upward but does NOT increase total height — the home indicator overlaps the bottom of the bar because the bar height stays 56px regardless of inset.

**Required change:**
- Keep the `paddingBottom: 'env(safe-area-inset-bottom, 0px)'` on the `<nav>`.
- Add `height: calc(56px + env(safe-area-inset-bottom, 0px))` to grow the bar downward.
- The 5 tab links must stay vertically centered within the upper 56px, not spread across the full height.

**Implementation pattern:**
```
style={{
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  height: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
}}
```
Remove `h-14` from className. All other classes unchanged.

**Visual contract:** On a home-indicator device, the bar background fills behind the home indicator (correct). Tab icons and labels sit centered in the upper 56px with no overlap.

**Downstream impact:** Any element that uses `pb-14` or `mb-14` to clear the tab bar must be updated to `calc(3.5rem + env(safe-area-inset-bottom, 0px))`. Record for Phase 2 audit.

---

### SAFE-03 — Onboarding Wizard Fixed Footer (app/onboarding/_components/onboarding-wizard.tsx)

**Current state:** `fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm`.

**Problem:** The fixed footer sits at `bottom-0` with `py-4` (16px) vertical padding. On home-indicator devices, the home indicator obscures the lower portion of the footer, potentially covering the "Næste" / "Kom i gang" buttons.

**Required change:**
- Replace `py-4` with `pt-4` to preserve top padding.
- Add `padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px))` via inline style.

**Implementation pattern:**
```
className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 pt-4 backdrop-blur-sm sm:relative sm:border-t-0 sm:bg-transparent sm:backdrop-blur-none"
style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
```

**Visual contract:** Both "Tilbage" and "Næste"/"Kom i gang" buttons are fully above the home indicator. The backdrop fill extends behind the home indicator bar (correct for native feel).

**Note:** The `sm:relative` variant has no safe-area concern — the style only applies on mobile where `fixed` is active.

---

### SAFE-04 — Check-In Form Sticky Button (app/journeys/[slug]/_components/check-in-form.tsx)

**Current state:** `sticky bottom-4` wrapper around the submit Button. The button scrolls with the page and sticks 16px from the viewport bottom when it would otherwise scroll off-screen.

**Problem:** `bottom-4` (16px) does not account for:
1. The BottomTabBar height (56px) which sits fixed above the bottom edge.
2. The safe-area-inset-bottom on home-indicator devices.

The button risks being hidden behind the BottomTabBar when it sticks.

**Required change:**
- Replace `bottom-4` with a calculated value that clears both the tab bar and the safe area.
- Use an inline style: `bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)`.
  - `3.5rem` = 56px (tab bar height)
  - `env(safe-area-inset-bottom, 0px)` = device home indicator clearance
  - `1rem` = 16px gap above tab bar

**Implementation pattern:**
```
className="sticky pt-2"
style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)' }}
```

**Visual contract:** The "Færdiggør denne dag" button is always fully visible above the bottom tab bar with 16px clearance, on all iPhone models including those with home indicators.

---

## Copywriting Contract

This phase does not introduce new user-visible copy. Existing copy in affected components is unchanged. Recorded here for completeness.

| Element | Copy | Component | Source |
|---------|------|-----------|--------|
| Onboarding back CTA | "Tilbage" | onboarding-wizard.tsx | existing |
| Onboarding next CTA | "Næste" | onboarding-wizard.tsx | existing |
| Onboarding final CTA | "Kom i gang" | onboarding-wizard.tsx | existing |
| Onboarding submitting state | "Gemmer..." | onboarding-wizard.tsx | existing |
| Check-in submit CTA | "Færdiggør denne dag" | check-in-form.tsx | existing |
| Check-in submitting state | "Gemmer..." | check-in-form.tsx | existing |
| Check-in error | "Vælg venligst hvordan det gik." | check-in-form.tsx | existing |
| Check-in network error | "Noget gik galt. Prøv igen." | check-in-form.tsx | existing |
| Topbar back label | "Gå tilbage" (aria-label) | app-topbar.tsx | existing |
| Topbar notifications label | "Notifikationer" (aria-label) | app-topbar.tsx | existing |

No empty states, no new destructive actions, no new error states introduced in this phase.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Button, Progress, Slider, Textarea | Not required — official registry |
| Third-party | None | Not applicable |

No third-party registries are used. No registry vetting gate required.

---

## Component Inventory (Phase 1 scope)

| File | Change Type | Requirement |
|------|-------------|-------------|
| components/layout/app-topbar.tsx | Add paddingTop + dynamic height via style | SAFE-01 |
| components/layout/bottom-tab-bar.tsx | Add dynamic height via style (keeps existing paddingBottom) | SAFE-02 |
| app/onboarding/_components/onboarding-wizard.tsx | Replace py-4 with pt-4 + dynamic paddingBottom via style | SAFE-03 |
| app/journeys/[slug]/_components/check-in-form.tsx | Replace bottom-4 with calculated bottom via style | SAFE-04 |

No new components are introduced. No component library additions required.

---

## Interaction Contract

All touch targets are unchanged and already meet 44px minimum (min-h-[44px] min-w-[44px] present on topbar buttons and tab links). This phase does not modify interaction behavior — only safe-area geometry.

| Element | Touch Target | State |
|---------|-------------|-------|
| AppTopbar back button | 44x44px min | Already correct |
| AppTopbar bell icon link | 44x44px min | Already correct |
| BottomTabBar each tab | 44x44px min | Already correct |
| Onboarding Tilbage button | h-12 (48px), flex-1 | Already correct |
| Onboarding Næste button | h-12 (48px), flex-1 | Already correct |
| Check-in submit button | size="lg" (~48px) w-full | Already correct |

---

## Device Testing Targets

| Device | Safe Area Concern | Inset Values |
|--------|------------------|--------------|
| iPhone SE (3rd gen) | No notch, no home indicator | All insets = 0, no visual change |
| iPhone 14 / 15 (non-Pro) | Notch | safe-area-inset-top ~47px |
| iPhone 14 Pro / 15 Pro | Dynamic Island | safe-area-inset-top ~59px |
| iPhone X / 11 / 12 / 13 | Notch + home indicator | top ~44px, bottom ~34px |
| iPhone 14 / 15 (any) | Home indicator | safe-area-inset-bottom ~34px |
| Android (Chrome) | Varies | env() defaults to 0 — no regression |

The `env(safe-area-inset-*, 0px)` fallback ensures zero-inset devices see no change.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
