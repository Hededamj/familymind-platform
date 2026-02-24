# Admin Menu Redesign — Design Document

**Dato:** 2026-02-24
**Status:** Godkendt

## Problem

Den nuværende admin-sidebar har 9 flade menupunkter uden gruppering:

```
Brugere, Indhold, Tags, Produkter, Rabatkoder, Forløb, Kohorter, Moderering, Branding, Indstillinger
```

Brugerne er ikke IT-specialister og har brug for en intuitiv navigation der guider dem. Menuen mangler også plads til kommende funktioner (Community).

## Løsning

Gruppér menupunkter i 3 logiske sektioner med overskrifter:

```
INDHOLD
  📦 Produkter           ← det vi sælger (øverst)
  📝 Lektioner           ← indholdsenheder (tidl. "Indhold")
  🗺️ Forløb              ← forløbsbygger
  🎟️ Rabatkoder          ← kampagner og rabatter

MEDLEMMER
  👥 Brugere             ← brugerstyring
  💬 Community           ← samler kohorter + moderering
  🏷️ Segmentering        ← bruger-tags til markedsføring

SYSTEM
  ⚙️ Indstillinger       ← branding, tags, site settings
```

## Ændringer

| Nuværende          | Ny                  | Grund                                      |
|--------------------|---------------------|---------------------------------------------|
| Indhold            | Lektioner           | Klarere — "indhold" er for generisk         |
| Tags               | Segmentering        | Tydeliggør formålet (markedsføring)         |
| Kohorter           | Community           | Samler kohorter + moderering                |
| Moderering         | (fjernet)           | Indgår i Community                          |
| Branding           | (fjernet)           | Indgår i Indstillinger (allerede link)      |
| —                  | Sektionsoverskrifter| Grupperer relaterede funktioner              |

## Teknisk implementation

- Kun ændring i `app/admin/layout.tsx`
- navItems array erstattes af en grupperet struktur med sektioner
- Sektionsoverskrifter: små, uppercase, dæmpet farve (white/30)
- Aktiv-markering: highlight aktuelle menupunkt baseret på pathname
- Community-link peger til `/admin/cohorts` (eksisterende) — kan udvides senere
- Segmentering-link peger til `/admin/settings/tags` (eksisterende)

## URL-mapping

| Menupunkt     | URL                        |
|---------------|----------------------------|
| Produkter     | /admin/products            |
| Lektioner     | /admin/content             |
| Forløb        | /admin/journeys            |
| Rabatkoder    | /admin/discounts           |
| Brugere       | /admin/users               |
| Community     | /admin/cohorts             |
| Segmentering  | /admin/settings/tags       |
| Indstillinger | /admin/settings            |
