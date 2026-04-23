/**
 * Seed persona-specific dashboard messages.
 *
 * Creates variants of the 'new_user' welcome for each of the three
 * persona tags. The dashboard service prefers a matching persona
 * variant over the generic fallback (tagId=null) when the user's
 * primaryChallengeTagId matches.
 *
 * Copy is drawn from the target audience profiles in docs/personas/ —
 * each message speaks to the specific pain/hope pattern from that
 * profile, so the welcome feels recognisable rather than generic.
 *
 * Idempotent: findFirst by (stateKey, tagId) → update or create.
 *
 * Usage: npx tsx scripts/seed-persona-dashboard-messages.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Variant = {
  stateKey: string
  tagSlug: string
  heading: string
  body: string
  ctaLabel: string
  ctaUrl: string
}

const VARIANTS: Variant[] = [
  {
    stateKey: 'new_user',
    tagSlug: 'sammenbragt-familie',
    heading: 'Velkommen. Lad os bygge et "vi" der kan holde.',
    body: 'Du har valgt sammenbragt familie. Vi har samlet værktøjer til loyalitet, grænser og tilhørsforhold — så familien kan falde på plads i et tempo børnene kan være i.',
    ctaLabel: 'Find dit første indhold',
    ctaUrl: '/browse',
  },
  {
    stateKey: 'new_user',
    tagSlug: 'nedsmeltninger',
    heading: 'Velkommen. Du kan holde rammen — også når det stormer.',
    body: 'Du har valgt nedsmeltninger og store følelser. Vi har samlet konkrete greb til før, under og efter — praktiske værktøjer, ikke kun gode intentioner.',
    ctaLabel: 'Find dit første indhold',
    ctaUrl: '/browse',
  },
  {
    stateKey: 'new_user',
    tagSlug: 'neurodivergens',
    heading: 'Velkommen. Dit barn er ikke forkert — har brug for andre rammer.',
    body: 'Du har valgt neurodivergens. Vi har samlet nervesystem-venlige strategier til hverdagen, skole-hjem-forskellen, og hvordan du også passer på dig selv.',
    ctaLabel: 'Find dit første indhold',
    ctaUrl: '/browse',
  },
]

async function main() {
  const slugs = [...new Set(VARIANTS.map((v) => v.tagSlug))]
  const tags = await prisma.contentTag.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  })
  const tagBySlug = new Map(tags.map((t) => [t.slug, t.id]))

  const missing = slugs.filter((s) => !tagBySlug.has(s))
  if (missing.length > 0) {
    throw new Error(`Missing ContentTag slugs: ${missing.join(', ')}`)
  }

  for (const v of VARIANTS) {
    const tagId = tagBySlug.get(v.tagSlug)!
    const existing = await prisma.dashboardMessage.findFirst({
      where: { stateKey: v.stateKey, tagId },
    })
    const data = {
      stateKey: v.stateKey,
      tagId,
      heading: v.heading,
      body: v.body,
      ctaLabel: v.ctaLabel,
      ctaUrl: v.ctaUrl,
    }
    if (existing) {
      await prisma.dashboardMessage.update({
        where: { id: existing.id },
        data,
      })
      console.log(`  updated ${v.stateKey} / ${v.tagSlug}`)
    } else {
      await prisma.dashboardMessage.create({ data })
      console.log(`  created ${v.stateKey} / ${v.tagSlug}`)
    }
  }

  console.log('\nDone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
