# CLAUDE.md

Context for AI coding agents (Claude Code, Copilot, etc.) working on this repo.

## What this is

FamilyMind 2.0 — white-label multi-product platform (courses, journeys, community, subscription). Single tenant in prod today; multi-tenant branding is scaffolded and actively in progress on `feature/tenant-abstraction`. Production domain: `familymind.nu` (we do **not** own `familymind.dk` — never hardcode it). `mettehummel.dk` is a separate website outside this repo — do not treat it as production for this platform.

## Stack

- Next.js 16 app router, React 19, TypeScript
- Prisma 6 + Postgres via Supabase (pooler for app, direct URL for migrations)
- Supabase Auth
- Stripe + Stripe Connect per organization
- Bunny.net Stream (video, TUS upload), Bunny.net Storage (images)
- Resend (email), Sentry (errors)
- Tailwind v4 + shadcn/ui (radix primitives), TipTap (rich text)
- Vitest (unit tests), ESLint 9 (flat config)

## Commands

```bash
npm run dev         # next dev
npm run build       # next build
npm run lint        # eslint
npx tsc --noEmit    # typecheck
npx vitest run      # unit tests
npx prisma migrate dev   # dev migration
npx prisma db seed       # seed (idempotent upserts)
```

CI (`.github/workflows/ci.yml`) runs typecheck + vitest + eslint on every PR to master — **all three blocking**. `next build` is not in CI; Vercel previews cover it.

## Code organization

- `app/` — routes (app router). `_components/` subfolders are colocated route components.
- `lib/services/` — business logic. **Routes should call services, not Prisma directly.** Services end in `.service.ts` and have colocated `__tests__/`.
- `lib/validators/` — Zod schemas. Validate at route boundaries.
- `lib/` root — shared utilities (`prisma.ts`, `auth.ts`, `stripe.ts`, `bunny.ts`, `resend.ts`, `tenant.ts`).
- `prisma/schema.prisma` — single source of truth for DB. `prisma/seed.ts` uses upserts (idempotent).
- `.planning/` — GSD methodology artifacts: `ROADMAP.md`, phase folders under `phases/NN-slug/` with `PLAN.md` / `RESEARCH.md` / `VERIFICATION.md`.

## Conventions that matter

- **Service layer**: put DB access and business rules in `lib/services/*.service.ts`. Route handlers should be thin.
- **Don't hardcode `familymind.dk`** — we don't own that domain. Production is `familymind.nu`; use `lib/app-url.ts` / tenant config.
- **Tenant awareness (WIP)**: `Organization` model exists with `colorPrimary`, `colorAccent`, `logo`, `brandName`. `getTenantConfig()` injects CSS vars in `app/layout.tsx`. Most service queries do **not yet filter by `organizationId`** — add scoping when touching product/journey/content/room queries. See `project_familymind_white_label.md` in memory for audit.
- **Danish timezone** for cron/scheduling logic (CET/CEST) — see `app/api/cron/engagement/route.ts`.
- **Stripe**: use Stripe Connect account per `Organization` (`stripeAccountId`). Webhook signature verified in `app/api/webhooks/stripe/route.ts`.
- **Zod at boundaries**, not deep in services.
- **Lint discipline**: no blanket `eslint-disable`. If a rule needs bypassing, bypass the line with a justified comment or refactor around it (see pattern notes below).

## React/effect patterns we use

- **Route-change cleanup** (close menu/dialog when pathname changes) — use "adjust state during render" (track prev pathname in a ref, setState when it differs). Avoid `useEffect([pathname]) → setOpen(false)`.
- **Dialog body init** — when a dialog needs fresh initial state on each open, split Dialog wrapper from its inner body and only render the inner when `open === true`. Avoids state-sync effects.
- **Icon lookups** inside render (e.g. `const Icon = getRoomIcon(...)`) trigger the `react-hooks/static-components` false-positive. Use `React.createElement(...)` instead of disabling the rule.

## Gotchas

- **Prisma P6001 on cold start**: "URL must start with prisma://" during Next 16 static generation on first hit to Supabase pooler. Clean `.next/` and retry. If persistent in CI, investigate Prisma driver adapter.
- **Two `.worktrees/` live**: `bunny-video-picker` and `media-library` — both active feature branches with checked-out worktrees. Don't delete.
- **Env split**: `DATABASE_URL` is the pooler URL (runtime); `DIRECT_URL` is direct (migrations).

## Working on it

- Branch from `master`. Feature branches: `feat/<slug>` or `feature/<slug>`.
- Commit style: conventional (`feat:`, `fix:`, `chore:`, `docs:`, `perf:`, `ci:`). Scope in parens when useful (`feat(media):`, `fix(lint):`).
- PRs merge to `master`. CI must be green.
- Don't skip hooks (`--no-verify`, `--no-gpg-sign`) without explicit reason.
