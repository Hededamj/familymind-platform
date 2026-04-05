---
phase: 04-navigation-pwa
plan: "02"
subsystem: ui
tags: [pwa, manifest, next.js, meta-tags, ios, android, theme-color]

# Dependency graph
requires:
  - phase: 01-safe-area-viewport
    provides: viewport export pattern in app/layout.tsx
provides:
  - public/manifest.json with PWA install metadata
  - iOS standalone mode via apple-mobile-web-app-capable meta tag
  - Android theme-color via viewport themeColor and meta tag
  - manifest link wired into generateMetadata
affects: [future-pwa-phases, service-worker, push-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PWA manifest: static public/manifest.json using hardcoded FamilyMind defaults (manifest served before JS, cannot use DB values)"
    - "Next.js viewport export: add themeColor alongside viewportFit=cover"
    - "generateMetadata: extend with manifest field and other{} for apple/android meta tags"

key-files:
  created:
    - public/manifest.json
  modified:
    - app/layout.tsx

key-decisions:
  - "theme_color #1A1A1A chosen to match app dark topbar/footer (brand identity color), not the primary color #5C6AC4"
  - "manifest.json uses hardcoded values — static file served before JS, cannot read from DB"
  - "icons use existing logo.png with purpose any+maskable — rectangular logo is acceptable for v1, proper square icon is a v2 improvement"
  - "apple-mobile-web-app-status-bar-style: default (not black-translucent) — safer since header does not extend behind status bar"

patterns-established:
  - "PWA meta tags live in generateMetadata other{} field, themeColor in viewport export"
  - "manifest.json is static in public/ — use hardcoded tenant defaults matching DEFAULT_TENANT_CONFIG"

requirements-completed: [PWA-01, PWA-02, PWA-03]

# Metrics
duration: 5min
completed: 2026-04-05
---

# Phase 04 Plan 02: PWA Manifest and Meta Tags Summary

**PWA manifest.json created and iOS/Android meta tags wired into Next.js layout — app installable from home screen with correct name, icon, and #1A1A1A theme color**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-05
- **Completed:** 2026-04-05
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created public/manifest.json with display:standalone, theme_color:#1A1A1A, start_url:/dashboard, and icons via existing logo.png
- Added themeColor:#1A1A1A to viewport export — Android Chrome browser chrome matches app design
- Extended generateMetadata to include manifest link and all required Apple PWA meta tags (standalone mode, status bar style, app title)
- All three PWA requirements (PWA-01, PWA-02, PWA-03) satisfied

## Task Commits

Each task was committed atomically:

1. **Task 1: Create public/manifest.json** - `c6d4c37` (feat)
2. **Task 2: Add PWA meta tags to layout viewport and generateMetadata** - `d8fd980` (feat)

## Files Created/Modified
- `public/manifest.json` - PWA manifest with name, icons, theme_color, display:standalone, start_url
- `app/layout.tsx` - Added themeColor to viewport, extended generateMetadata with manifest link and Apple/Android meta tags

## Decisions Made
- `theme_color: "#1A1A1A"` chosen over `colorPrimary` (#5C6AC4) — the dark color is the app's brand identity used in the topbar and footer, giving a consistent native feel when the browser chrome adopts it
- `manifest.json` uses hardcoded values because it is a static file served before JS executes and cannot query the DB
- Existing `logo.png` used as icon with `purpose: "any"` — rectangular shape is acceptable for v1, a proper 192x192 square icon is a planned v2 improvement
- `apple-mobile-web-app-status-bar-style: "default"` chosen over `"black-translucent"` — the app header does not extend behind the status bar so translucent is not needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

- `public/manifest.json` icons array references `/images/logo.png` which is a rectangular brand logo, not a proper square PWA icon. The `"sizes": "any"` field allows the OS to crop/letterbox it. This is intentional for v1. A dedicated square icon should be created in a future plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 04 is now complete — all PWA meta infrastructure is in place
- The app can be added to iOS home screen in standalone mode and Android Chrome will show the themed browser chrome
- Future improvement: create a proper 192x192 square icon at `/images/icon-192.png` and update manifest.json

---
*Phase: 04-navigation-pwa*
*Completed: 2026-04-05*
