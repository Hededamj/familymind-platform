# Requirements: FamilyMind Personlig Dashboard

**Defined:** 2026-04-05
**Core Value:** Forældre skal have en smooth, native-lignende mobiloplevelse der føles personlig

## v1.1 Requirements

### Personlig Check-in

- [x] **CHECKIN-01**: Dashboard viser dynamisk check-in prompt baseret på brugerens aktive journey eller primære udfordring
- [ ] **CHECKIN-02**: Brugeren kan skrive en fri-tekst refleksion direkte fra dashboardet
- [x] **CHECKIN-03**: Check-in prompten skifter afhængigt af dashboard-state (ny bruger, aktiv journey, ingen journey, completed journey)

### Din Gode Uge

- [x] **WEEK-01**: Dashboard viser "Din gode uge" sektion med de næste dage fra aktiv journey
- [ ] **WEEK-02**: Dagens fokus vises som et stort visuelt indholdskort med titel og beskrivelse
- [x] **WEEK-03**: Ugeoversigten viser progress (X af Y dage denne uge)

### Dashboard Kontekst

- [x] **CONTEXT-01**: Velkomst-besked tilpasses baseret på brugerens onboarding-data og journey-status
- [x] **CONTEXT-02**: Dashboard-beskeder er admin-konfigurerbare pr. state (via eksisterende DashboardMessage model)

### Visuelt Redesign

- [ ] **VISUAL-01**: Dashboard bruger store indholdskort med afrundede hjørner og illustration/billede
- [ ] **VISUAL-02**: Check-in sektion har visuelt fremhævet container (inspireret af konkurrents gule boks)
- [ ] **VISUAL-03**: Sektioner har tydelige overskrifter og sekundær tekst (f.eks. "Nyt hver mandag")

## v2 Requirements

### Avanceret Personalisering

- **PERS-01**: AI-genererede check-in prompts baseret på brugerens historik
- **PERS-02**: Mikrofon-input til voice-refleksion
- **PERS-03**: Mood tracking over tid med visualisering

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI chat-assistent | For kompleks til denne milestone |
| Push notifications | Separat projekt |
| Børns navne/profiler | Privacyhensyn, forældre vil måske ikke dele det |
| Gamification (streaks) | Modstrid med brandets varme, støttende tilgang |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CHECKIN-01 | Phase 5 | Complete |
| CHECKIN-02 | Phase 6 | Pending |
| CHECKIN-03 | Phase 5 | Complete |
| WEEK-01 | Phase 5 | Complete |
| WEEK-02 | Phase 6 | Pending |
| WEEK-03 | Phase 5 | Complete |
| CONTEXT-01 | Phase 5 | Complete |
| CONTEXT-02 | Phase 5 | Complete |
| VISUAL-01 | Phase 6 | Pending |
| VISUAL-02 | Phase 6 | Pending |
| VISUAL-03 | Phase 6 | Pending |

**Coverage:**
- v1.1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after roadmap creation*
