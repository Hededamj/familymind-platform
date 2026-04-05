# Requirements: FamilyMind Mobile-First Overhaul

**Defined:** 2026-04-03
**Core Value:** Forældre skal have en smooth, native-lignende mobiloplevelse

## v1.0 Requirements

Requirements for mobile-first overhaul. Each maps to roadmap phases.

### Safe Area & Viewport

- [x] **SAFE-01**: Topbar har safe-area-inset-top for iPhones med notch/Dynamic Island
- [x] **SAFE-02**: Bottom tab bar har safe-area-inset-bottom for iPhones med home indicator
- [x] **SAFE-03**: Onboarding wizard fixed footer respekterer safe area
- [x] **SAFE-04**: Check-in form sticky button har korrekt clearance over tab bar

### Layout & Overflow

- [x] **LAYOUT-01**: Alle flex text-containers har min-w-0 så indhold ikke overflower
- [x] **LAYOUT-02**: Dashboard, browse, community og journeys har konsistent max-width
- [x] **LAYOUT-03**: Grids kollapser til single column på skærme under 640px hvor relevant
- [x] **LAYOUT-04**: Cards og banners har overflow-hidden så indhold ikke bryder ud
- [x] **LAYOUT-05**: Bundle cards har min-w-0 og line-clamp på titler

### Typography & Spacing

- [ ] **TYPO-01**: Landing page hero bruger responsive font sizes (text-2xl til text-5xl)
- [ ] **TYPO-02**: Alle sider har konsistent mobil-padding (px-4) og desktop-padding (px-8)
- [x] **TYPO-03**: Bruger-genereret indhold (community posts) har break-words og hyphens
- [ ] **TYPO-04**: Progress-side headings er responsive (text-2xl til text-3xl)

### Navigation

- [ ] **NAV-01**: Alle bruger-routes har AppLayout med bottom tab bar og sidebar
- [ ] **NAV-02**: Topbar og footer skjules korrekt for indloggede brugere på app-routes
- [ ] **NAV-03**: Back-button fungerer korrekt på alle sub-sider

### Touch & Interaction

- [ ] **TOUCH-01**: Alle interaktive elementer har minimum 44px touch target
- [ ] **TOUCH-02**: Horisontale scroll-areas har usynlig scrollbar
- [x] **TOUCH-03**: Lange titler i cards har line-clamp for at forhindre overflow

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
| SAFE-01 | Phase 1 | Complete |
| SAFE-02 | Phase 1 | Complete |
| SAFE-03 | Phase 1 | Complete |
| SAFE-04 | Phase 1 | Complete |
| LAYOUT-01 | Phase 2 | Complete |
| LAYOUT-02 | Phase 2 | Complete |
| LAYOUT-03 | Phase 2 | Complete |
| LAYOUT-04 | Phase 2 | Complete |
| LAYOUT-05 | Phase 2 | Complete |
| TYPO-01 | Phase 3 | Pending |
| TYPO-02 | Phase 3 | Pending |
| TYPO-03 | Phase 3 | Complete |
| TYPO-04 | Phase 3 | Pending |
| TOUCH-01 | Phase 3 | Pending |
| TOUCH-02 | Phase 3 | Pending |
| TOUCH-03 | Phase 3 | Complete |
| NAV-01 | Phase 4 | Pending |
| NAV-02 | Phase 4 | Pending |
| NAV-03 | Phase 4 | Pending |
| PWA-01 | Phase 4 | Pending |
| PWA-02 | Phase 4 | Pending |
| PWA-03 | Phase 4 | Pending |

**Coverage:**
- v1.0 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after roadmap creation*
