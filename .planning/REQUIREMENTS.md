# Requirements: FamilyMind Mobile-First Overhaul

**Defined:** 2026-04-03
**Core Value:** Forældre skal have en smooth, native-lignende mobiloplevelse

## v1.0 Requirements

Requirements for mobile-first overhaul. Each maps to roadmap phases.

### Safe Area & Viewport

- [ ] **SAFE-01**: Topbar har safe-area-inset-top for iPhones med notch/Dynamic Island
- [ ] **SAFE-02**: Bottom tab bar har safe-area-inset-bottom for iPhones med home indicator
- [ ] **SAFE-03**: Onboarding wizard fixed footer respekterer safe area
- [ ] **SAFE-04**: Check-in form sticky button har korrekt clearance over tab bar

### Layout & Overflow

- [ ] **LAYOUT-01**: Alle flex text-containers har min-w-0 så indhold ikke overflower
- [ ] **LAYOUT-02**: Dashboard, browse, community og journeys har konsistent max-width
- [ ] **LAYOUT-03**: Grids kollapser til single column på skærme under 640px hvor relevant
- [ ] **LAYOUT-04**: Cards og banners har overflow-hidden så indhold ikke bryder ud
- [ ] **LAYOUT-05**: Bundle cards har min-w-0 og line-clamp på titler

### Typography & Spacing

- [ ] **TYPO-01**: Landing page hero bruger responsive font sizes (text-2xl til text-5xl)
- [ ] **TYPO-02**: Alle sider har konsistent mobil-padding (px-4) og desktop-padding (px-8)
- [ ] **TYPO-03**: Bruger-genereret indhold (community posts) har break-words og hyphens
- [ ] **TYPO-04**: Progress-side headings er responsive (text-2xl til text-3xl)

### Navigation

- [ ] **NAV-01**: Alle bruger-routes har AppLayout med bottom tab bar og sidebar
- [ ] **NAV-02**: Topbar og footer skjules korrekt for indloggede brugere på app-routes
- [ ] **NAV-03**: Back-button fungerer korrekt på alle sub-sider

### Touch & Interaction

- [ ] **TOUCH-01**: Alle interaktive elementer har minimum 44px touch target
- [ ] **TOUCH-02**: Horisontale scroll-areas har usynlig scrollbar
- [ ] **TOUCH-03**: Lange titler i cards har line-clamp for at forhindre overflow

### PWA

- [ ] **PWA-01**: Web app manifest med app-navn, ikoner og theme-color
- [ ] **PWA-02**: Meta tags for standalone webapp (apple-mobile-web-app-capable)
- [ ] **PWA-03**: Theme-color matcher app-design

## v2 Requirements

Deferred to future milestones.

### Push Notifications

- **PUSH-01**: Service Worker registrering og push subscription
- **PUSH-02**: Server-side push via web-push med VAPID keys
- **PUSH-03**: Push subscription gemmes i database
- **PUSH-04**: Bruger kan aktivere/deaktivere push notifications

### Native App Feel

- **NATIVE-01**: Offline fallback side
- **NATIVE-02**: App install prompt (beforeinstallprompt)
- **NATIVE-03**: Splash screen konfiguration

## Out of Scope

| Feature | Reason |
|---------|--------|
| Admin-panel responsive design | Admin er desktop-only, lav prioritet |
| Native app (Capacitor) | Fokusér på webapp-kvalitet først |
| Nye features (AI, gamification) | Først polish, så features |
| Landscape orientation support | Forældre-app brugt primært i portrait |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SAFE-01 | — | Pending |
| SAFE-02 | — | Pending |
| SAFE-03 | — | Pending |
| SAFE-04 | — | Pending |
| LAYOUT-01 | — | Pending |
| LAYOUT-02 | — | Pending |
| LAYOUT-03 | — | Pending |
| LAYOUT-04 | — | Pending |
| LAYOUT-05 | — | Pending |
| TYPO-01 | — | Pending |
| TYPO-02 | — | Pending |
| TYPO-03 | — | Pending |
| TYPO-04 | — | Pending |
| NAV-01 | — | Pending |
| NAV-02 | — | Pending |
| NAV-03 | — | Pending |
| TOUCH-01 | — | Pending |
| TOUCH-02 | — | Pending |
| TOUCH-03 | — | Pending |
| PWA-01 | — | Pending |
| PWA-02 | — | Pending |
| PWA-03 | — | Pending |

**Coverage:**
- v1.0 requirements: 22 total
- Mapped to phases: 0
- Unmapped: 22

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after initial definition*
