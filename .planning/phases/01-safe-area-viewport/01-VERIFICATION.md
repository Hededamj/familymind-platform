---
phase: 01-safe-area-viewport
verified: 2026-04-03T00:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 1: Safe Area & Viewport — Verification Report

**Phase Goal:** Every fixed UI element respects device safe areas so content is never obscured by notch, Dynamic Island, or home indicator
**Verified:** 2026-04-03
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                       | Status     | Evidence                                                                                                         |
|----|---------------------------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------|
| 1  | On iPhone with notch/Dynamic Island, topbar content sits below the status bar              | VERIFIED   | `paddingTop: 'env(safe-area-inset-top, 0px)'` + `height: 'calc(3.5rem + env(safe-area-inset-top, 0px))'` on `<header>` at app-topbar.tsx:26-27 |
| 2  | On iPhone with home indicator, tab bar icons sit above the home indicator with no overlap  | VERIFIED   | `paddingBottom: 'env(safe-area-inset-bottom, 0px)'` + `height: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))'` on `<nav>` at bottom-tab-bar.tsx:22-23 |
| 3  | On devices without safe areas (Android, iPhone SE), UI is visually unchanged               | VERIFIED   | All `env()` calls include `0px` fallback — resolves to original 3.5rem (56px) on zero-inset devices            |
| 4  | The viewport-fit=cover meta tag is present, enabling env(safe-area-inset-*) values        | VERIFIED   | `export const viewport: Viewport = { viewportFit: 'cover' }` at app/layout.tsx:39-43                          |
| 5  | Onboarding wizard footer buttons are fully visible above the home indicator                | VERIFIED   | `style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}` at onboarding-wizard.tsx:337; `pt-4` preserves 16px top padding; `py-4` absent from footer div |
| 6  | Check-in submit button floats above the tab bar with 16px clearance                        | VERIFIED   | `style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)' }}` at check-in-form.tsx:147; `bottom-4` absent |
| 7  | On devices without safe areas, both page components look identical to before               | VERIFIED   | All env() fallbacks are `0px`; onboarding resolves to 1rem bottom padding (same as removed py-4); check-in resolves to 4.5rem clearance (56px tab + 16px gap) |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact                                                            | Expected                                    | Status   | Details                                                                                    |
|---------------------------------------------------------------------|---------------------------------------------|----------|--------------------------------------------------------------------------------------------|
| `app/layout.tsx`                                                    | viewport-fit=cover metadata                 | VERIFIED | `export const viewport: Viewport` with `viewportFit: 'cover'`; `Viewport` imported from "next" at line 1 |
| `components/layout/app-topbar.tsx`                                  | Safe-area-aware topbar with dynamic height  | VERIFIED | `h-14` absent; `paddingTop` + `height` with `env(safe-area-inset-top)` in style prop; `sticky top-0 z-40` retained |
| `components/layout/bottom-tab-bar.tsx`                              | Safe-area-aware tab bar with dynamic height | VERIFIED | `h-14` absent; `paddingBottom` + `height` with `env(safe-area-inset-bottom)` in style prop; `fixed bottom-0 left-0 right-0 z-50` retained |
| `app/onboarding/_components/onboarding-wizard.tsx`                  | Safe-area-aware onboarding footer           | VERIFIED | Footer div has `pt-4` className + `paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'` in style prop; `sm:relative` variants unchanged |
| `app/journeys/[slug]/_components/check-in-form.tsx`                 | Tab-bar-clearing sticky submit button       | VERIFIED | Sticky wrapper has `className="sticky pt-2"` + `style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)' }}`; `bottom-4` absent |

---

### Key Link Verification

| From                              | To                             | Via                                                           | Status  | Details                                                    |
|-----------------------------------|--------------------------------|---------------------------------------------------------------|---------|------------------------------------------------------------|
| `app/layout.tsx`                  | all components using env()     | viewport-fit=cover enables non-zero safe-area-inset values    | WIRED   | `viewportFit: 'cover'` confirmed at line 42                |
| `components/layout/app-topbar.tsx` | device safe area              | `paddingTop: env(safe-area-inset-top, 0px)` in style prop    | WIRED   | Pattern confirmed at line 26                               |
| `components/layout/bottom-tab-bar.tsx` | device safe area          | `height: calc(3.5rem + env(safe-area-inset-bottom, 0px))` in style prop | WIRED | Pattern confirmed at lines 22-23                     |
| `app/onboarding/_components/onboarding-wizard.tsx` | device safe area | `paddingBottom: calc(1rem + env(safe-area-inset-bottom))` in style prop | WIRED | Pattern confirmed at line 337                       |
| `app/journeys/[slug]/_components/check-in-form.tsx` | device safe area + tab bar clearance | `bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)` in style prop | WIRED | Pattern confirmed at line 147 |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase modifies CSS/style props only. No data variables are rendered; the changes are purely presentational (CSS env() functions resolved by the browser at paint time). No state, fetch, or store is involved.

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — safe-area changes are CSS-only and require a real iOS device to observe non-zero `env(safe-area-inset-*)` values. No runnable check can verify device-reported insets in a CI/command-line environment. See Human Verification section below.

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                                          | Status    | Evidence                                                                                  |
|-------------|-------------|--------------------------------------------------------------------------------------|-----------|-------------------------------------------------------------------------------------------|
| SAFE-01     | 01-01-PLAN  | Topbar har safe-area-inset-top for iPhones med notch/Dynamic Island                 | SATISFIED | `paddingTop: env(safe-area-inset-top, 0px)` + dynamic height on `<header>` in app-topbar.tsx |
| SAFE-02     | 01-01-PLAN  | Bottom tab bar har safe-area-inset-bottom for iPhones med home indicator             | SATISFIED | `paddingBottom` + `height: calc(3.5rem + env(safe-area-inset-bottom, 0px))` on `<nav>` in bottom-tab-bar.tsx |
| SAFE-03     | 01-02-PLAN  | Onboarding wizard fixed footer respekterer safe area                                 | SATISFIED | `paddingBottom: calc(1rem + env(safe-area-inset-bottom, 0px))` on footer div in onboarding-wizard.tsx |
| SAFE-04     | 01-02-PLAN  | Check-in form sticky button har korrekt clearance over tab bar                       | SATISFIED | `bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)` on sticky wrapper in check-in-form.tsx |

No orphaned requirements — all four Phase 1 requirements are claimed by plans and verified in the codebase. REQUIREMENTS.md traceability table confirms SAFE-01 through SAFE-04 are marked Complete for Phase 1.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No TODO/FIXME/placeholder comments found in any modified file. No empty implementations. The `py-4` occurrences in onboarding-wizard.tsx (lines 169, 205, 271) are on unrelated option buttons and a date input — not the footer div — and are correct.

---

### Human Verification Required

#### 1. Topbar safe area on notch/Dynamic Island device

**Test:** Open the app on an iPhone 14 Pro (or simulator with Dynamic Island enabled). Navigate to /dashboard.
**Expected:** The topbar background extends into the notch/Dynamic Island zone and the brand name / bell icon sit fully below the status bar with no overlap.
**Why human:** `env(safe-area-inset-top)` returns 0 in all non-device environments. Only a real iOS device or iOS Simulator with a notch-model reports the actual inset value.

#### 2. Tab bar safe area on home-indicator device

**Test:** Open the app on an iPhone 14 (or any Face ID iPhone without a home button, or simulator). View the bottom tab bar.
**Expected:** The tab bar background fills the home indicator zone; tab icons are fully visible and centred in the upper 56px with no overlap onto the home indicator stripe.
**Why human:** Same as above — `env(safe-area-inset-bottom)` is 0 on non-iOS environments.

#### 3. Onboarding wizard footer on home-indicator device

**Test:** Navigate to the onboarding flow on an iPhone with a home indicator. Reach any question step.
**Expected:** The Back/Next buttons are fully tappable; the footer does not overlap the home indicator. On a device without a home indicator the footer bottom matches the original py-4 spacing.
**Why human:** Visual overlap detection requires device rendering.

#### 4. Check-in form sticky button clearance

**Test:** Open a journey day page with a check-in form on an iPhone with home indicator.
**Expected:** The "Færdiggør denne dag" button is visible above the bottom tab bar with approximately 16px gap. On a zero-inset device (e.g. Android) the button is 16px above the tab bar's 56px height = 72px from bottom.
**Why human:** Requires an iOS device for safe-area verification; on Android the fallback value should be visually confirmed to not overlap.

---

### Gaps Summary

No gaps found. All five artifacts exist, are substantive, and are wired correctly. All four requirement IDs (SAFE-01 through SAFE-04) are satisfied with direct code evidence. The four committed task hashes (`ec901ef`, `aaa2147`, `e7c93aa`, `16be3ea`) are present in git history. The only open items are the four human verification checks above, which require an iOS device and are not blocking — the code is correctly implemented.

---

_Verified: 2026-04-03_
_Verifier: Claude (gsd-verifier)_
