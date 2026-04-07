# Requirements: FamilyMind Kursus-visning Redesign

**Defined:** 2026-04-06
**Core Value:** Visuelt engagerende kursusvisning der holder brugerne på platformen

## v1.2 Requirements

### Lektionskort

- [x] **CARD-01**: Lektionskort viser video-thumbnail fra Bunny CDN eller fallback-billede
- [x] **CARD-02**: Lektionskort viser titel, type-badge (VIDEO/TEXT/PDF/AUDIO) og varighed
- [x] **CARD-03**: Lektionskort har bookmark/gem-ikon der toggles on/off

### Kapitel-layout

- [ ] **CHAP-01**: Hvert kapitel vises som en sektion med overskrift og horisontal scroll af lektionskort
- [ ] **CHAP-02**: Horisontal scroll har usynlig scrollbar og smooth scroll-behavior
- [ ] **CHAP-03**: Lektioner uden modul grupperes under "Øvrige lektioner"

### Kursus-oversigt

- [x] **COURSE-01**: Kursus-siden viser progress-bar med procent completion
- [x] **COURSE-02**: Kursus-header viser antal kapitler og total estimeret varighed
- [x] **COURSE-03**: Kursus-header viser cover-billede hvis tilgængeligt

### Filter & Bookmark

- [ ] **FILTER-01**: Content-type filter tabs (Alle, Video, Artikler) filtrerer lektioner
- [x] **SAVE-01**: Brugeren kan gemme/bookmark lektioner og se dem under "Gemt" i profilen

## v2 Requirements

### Avanceret Kursus-UX

- **ADV-01**: Video preview on hover/long-press
- **ADV-02**: Offline download af lektioner
- **ADV-03**: Autoplay næste lektion

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video player redesign | Eksisterende HLS player virker, separat projekt |
| Kursus-oprettelse redesign | Admin-side, lav prioritet |
| Ratings/anmeldelser | For tidligt, for få brugere |
| Social sharing af lektioner | Ikke relevant endnu |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CARD-01 | Phase 8 | Complete |
| CARD-02 | Phase 8 | Complete |
| CARD-03 | Phase 8 | Complete |
| CHAP-01 | Phase 8 | Pending |
| CHAP-02 | Phase 8 | Pending |
| CHAP-03 | Phase 8 | Pending |
| COURSE-01 | Phase 7 | Complete |
| COURSE-02 | Phase 7 | Complete |
| COURSE-03 | Phase 9 | Complete |
| FILTER-01 | Phase 9 | Pending |
| SAVE-01 | Phase 7 | Complete |

**Coverage:**
- v1.2 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after roadmap creation (v1.2)*
