---
sketch: 001
name: calm-dashboard
question: "How do we honour 'ro og overblik' when the dashboard is the customer's entrance to the universe?"
winner: null
tags: [dashboard, layout, brand-coherence]
---

# Sketch 001: Calm dashboard

## Design Question

The current dashboard stacks 9 sections vertically — daily check-in, weekly focus, completed-journey banner, admin messages, courses, recommendations, community pills, etc. The brand promise is **"ro og overblik"** (calm and overview), but the UI delivers visual density. How do we restructure so the page itself embodies the brand the moment a customer logs in?

## How to View

```
open .planning/sketches/001-calm-dashboard/index.html
```

Tab D (Nuværende) shows the current 9-section stack as a reference.

## Variants

- **A · Single-focus** — Greeting → one big "Dagens fokus" card with progress dots → three quiet status pills (Forløb / Rejse / Fællesskab). Everything else lives one click away. Most opinionated.
- **B · Hero + bibliotek** — Greeting → Dagens fokus card → quiet "Mine forløb" + "Fællesskab" sections below. Compromise: keeps a sense of library on the page but stripped down to two card grids instead of nine sections.
- **C · Minimal** — Just greeting + one beautiful focus card on a sand gradient + a single ghost-link to "Mit univers". Most radical. Almost meditation-app feeling.
- **D · Nuværende (reference)** — current 9-section stack as labelled boxes for comparison.

## What to Look For

- **First impression** — which one feels calm before you read any text?
- **Where does your eye go?** — A and C have one obvious target; B has a primary + secondary rhythm; D scatters attention.
- **Returning user** — imagine logging in for the 50th time. Does it still feel right?
- **Empty state** — if you had no journey, no courses, no community activity, would the layout still work? (A and C degrade gracefully; B may feel empty.)
- **Discovery** — how does a user find their courses if they don't appear here? Sidebar in A; visible in B; "Mit univers"-link in C.

## Trade-offs

| | A · Single-focus | B · Hero + bibliotek | C · Minimal |
|---|---|---|---|
| Calm | High | Medium | Highest |
| Overview | Pills give it | Library section gives it | Hidden behind link |
| Engagement loop | Strong (focus card) | Strong | Strongest |
| Discovery | Sidebar-dependent | Built in | Sidebar-dependent |
| New user (no state) | Empty pills look odd | Empty grid looks odd | Adapts naturally |
