---
created: 2026-05-04T22:40:00.000Z
title: Image upload fails (admin → branding logo/favicon)
area: bug
files:
  - app/api/upload/route.ts
  - lib/bunny-storage.ts
  - components/image-uploader.tsx
---

## Problem

Bruger rapporterede 2026-05-04 at billede-upload fejler i admin → settings → branding (logo/favicon-upload tilføjet i PR #24).

Det er sandsynligvis ikke isoleret til branding-siden — `/api/upload` rammes også fra:
- Course covers
- Bundle covers
- PDF/lyd-upload til content units
- Alle andre admin-uploads

## Mistænkte årsager

1. **Bunny.net trial udløbet 2026-04-30** (per memory `project_bunny_trial_expired.md`) — Storage 401, kan ikke skrive nye filer. Stadig ikke afgjort om vi går for option A (aktivér betaling) eller B (ny konto).
2. **BUNNY_STORAGE_API_KEY** ikke sat i Vercel-env (eller forkert key)
3. **Auth-fejl i `/api/upload`** — `requireAdmin()` kaster 401 hvis sessionen ikke ses som admin (men det burde admin være)

## Diagnose-trin

1. Åbn DevTools → Network mens du uploader → se hvilken status `/api/upload` svarer med
   - **401**: auth eller Bunny-API-key issue
   - **400**: filtype/-størrelse afvist
   - **500**: Bunny upload kaster (mest sandsynligt trial-udløbet)
2. Tjek Vercel-logs (Functions → upload-route) for den eksakte fejlbesked
3. Bekræft Bunny-konto-status på dashboard.bunny.net

## Followup

Når årsag er fundet:
- Hvis Bunny-trial er problemet → tag stilling til betalt konto (eller migrér til alternative storage)
- Hvis env-key mangler → tilføj og redeploy
- Hvis auth → tjek `requireAdmin()` flow

Når dette er løst: overvej en simpel health-check endpoint (`/api/health/upload`) der prøver at uploade en lille test-fil og returnerer status. Bug af denne type bør ikke kunne sidde tavs i ugevis.
