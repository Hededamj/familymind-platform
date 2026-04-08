# Phase 08: Lektionskort + Kapitel-layout — Validation Architecture

**Extracted from:** 08-RESEARCH.md (Validation Architecture section)

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts (root) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

## Phase Requirements — Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CARD-01 | Thumbnail renders or fallback div shown | manual-only | Visual browser check | n/a |
| CARD-02 | Title, badge, duration visible on card | manual-only | Visual browser check | n/a |
| CARD-03 | Bookmark icon toggles saved/unsaved state | manual-only | Visual tap test on device | n/a |
| CHAP-01 | Chapter sections render with correct module title | manual-only | Visual browser check | n/a |
| CHAP-02 | Horizontal scroll with no visible scrollbar | manual-only | Visual browser/device check | n/a |
| CHAP-03 | Unassigned lessons appear under "Øvrige lektioner" | manual-only | Visual browser check | n/a |

All Phase 8 requirements are **visual rendering requirements** (component shape, CSS scroll behavior, thumbnail display). They are not unit-testable in a Node.js vitest environment (no DOM renderer configured). Verification is by visual inspection in the browser and on a mobile device.

## Verification Strategy

All requirements are verified via `checkpoint:human-verify` (Plan 08-02, Task 3). The checkpoint includes:
- Browser visual check for CARD-01, CARD-02, CHAP-01
- Interactive tap test for CARD-03 (bookmark toggle)
- Scroll behavior test for CHAP-02
- Conditional section rendering test for CHAP-03
- Mobile viewport (375px) test for touch targets and scroll

## Sampling Rate

- **Per task commit:** Visual check in browser dev tools + mobile emulator
- **Per wave merge:** Physical device test (iOS Safari + Android Chrome)
- **Phase gate:** All 6 requirements visually confirmed before `/gsd:verify-work`

## Wave 0 Gaps

None — no test files needed. All requirements verified visually. Vitest infrastructure exists but is not applicable to CSS/rendering requirements.
