/**
 * Seed persona-specific onboarding options and community rooms.
 *
 * Idempotent: safe to re-run. Upserts by slug / unique key. Existing rows
 * are left untouched except for description/sortOrder updates on rooms.
 *
 * Prerequisite: the persona tags (sammenbragt-familie, neurodivergens,
 * nedsmeltninger) must exist in ContentTag. They do, after the tag-
 * unification in PR #12.
 *
 * Usage: npx tsx scripts/seed-personas.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Adds these as SINGLE_SELECT options under onboarding question #2
// ("Hvad er din største udfordring lige nu?").
const QUESTION_2_OPTIONS = [
  {
    value: 'blended_family',
    label: 'Sammenbragt familie',
    tagSlug: 'sammenbragt-familie',
  },
  {
    value: 'meltdowns',
    label: 'Nedsmeltninger og store følelser',
    tagSlug: 'nedsmeltninger',
  },
  {
    value: 'neurodivergence',
    label: 'Neurodivergens',
    tagSlug: 'neurodivergens',
  },
]

// Creates these public community rooms, each tagged with the matching
// persona tag so onboarding-quiz → room routing can work.
const PERSONA_ROOMS = [
  {
    slug: 'sammenbragt-familie',
    name: 'Sammenbragte familier',
    description:
      'Deleordninger, bonusforældre, loyalitet og et fælles hjem — del det der fylder og find andre familier der står samme sted.',
    tagSlug: 'sammenbragt-familie',
    sortOrder: 20,
  },
  {
    slug: 'nedsmeltninger',
    name: 'Når følelser bliver store',
    description:
      'Nedsmeltninger, affekt og regulering — et sted at dele hvordan vi møder de store følelser uden at miste os selv.',
    tagSlug: 'nedsmeltninger',
    sortOrder: 21,
  },
  {
    slug: 'neurodivergens',
    name: 'Børn med neurodivergens',
    description:
      'Hverdag med ADHD, autistiske træk eller sensorisk belastning — rum til at tale om det der kræver andre rammer.',
    tagSlug: 'neurodivergens',
    sortOrder: 22,
  },
]

async function main() {
  const requiredSlugs = [
    ...new Set([
      ...QUESTION_2_OPTIONS.map((o) => o.tagSlug),
      ...PERSONA_ROOMS.map((r) => r.tagSlug),
    ]),
  ]
  const tags = await prisma.contentTag.findMany({
    where: { slug: { in: requiredSlugs } },
    select: { id: true, slug: true },
  })
  const tagBySlug = new Map(tags.map((t) => [t.slug, t.id]))

  const missingTags = requiredSlugs.filter((s) => !tagBySlug.has(s))
  if (missingTags.length > 0) {
    throw new Error(`Missing ContentTag slugs: ${missingTags.join(', ')}`)
  }

  // Onboarding question #2
  const q2 = await prisma.onboardingQuestion.findFirst({
    where: { position: 2 },
    include: { options: { orderBy: { position: 'asc' } } },
  })
  if (!q2) throw new Error('Onboarding question at position 2 not found')

  console.log(`Seeding onboarding options on "${q2.questionText}"`)
  let nextPos =
    q2.options.reduce((max, o) => Math.max(max, o.position), 0) + 1

  for (const opt of QUESTION_2_OPTIONS) {
    const existing = q2.options.find((o) => o.value === opt.value)
    const tagId = tagBySlug.get(opt.tagSlug)!
    if (existing) {
      const needsUpdate =
        existing.label !== opt.label || existing.tagId !== tagId
      if (needsUpdate) {
        await prisma.onboardingOption.update({
          where: { id: existing.id },
          data: { label: opt.label, tagId },
        })
        console.log(`  updated option "${opt.label}"`)
      } else {
        console.log(`  option "${opt.label}" already up to date`)
      }
    } else {
      await prisma.onboardingOption.create({
        data: {
          questionId: q2.id,
          label: opt.label,
          value: opt.value,
          tagId,
          position: nextPos++,
        },
      })
      console.log(`  created option "${opt.label}"`)
    }
  }

  console.log('\nSeeding community rooms')
  const roomIdBySlug = new Map<string, string>()
  for (const r of PERSONA_ROOMS) {
    const tagId = tagBySlug.get(r.tagSlug)!
    const room = await prisma.communityRoom.upsert({
      where: { slug: r.slug },
      update: {
        name: r.name,
        description: r.description,
        sortOrder: r.sortOrder,
        isPublic: true,
        isArchived: false,
      },
      create: {
        slug: r.slug,
        name: r.name,
        description: r.description,
        sortOrder: r.sortOrder,
        isPublic: true,
      },
    })
    roomIdBySlug.set(r.slug, room.id)
    await prisma.communityRoomTag.upsert({
      where: { roomId_tagId: { roomId: room.id, tagId } },
      update: {},
      create: { roomId: room.id, tagId },
    })
    console.log(`  ensured "${r.name}" (tag: ${r.tagSlug})`)
  }

  // Connect the onboarding answer → room by adding a recommendation rule
  // per persona. Engine checks rule.conditions.tagId against user's
  // primaryChallengeTagId (set from quiz #2 answer).
  console.log('\nSeeding recommendation rules')
  for (const r of PERSONA_ROOMS) {
    const tagId = tagBySlug.get(r.tagSlug)!
    const roomId = roomIdBySlug.get(r.slug)!
    const name = `${r.name} (via onboarding)`
    const existing = await prisma.recommendationRule.findFirst({
      where: {
        targetType: 'ROOM',
        targetId: roomId,
      },
    })
    const data = {
      name,
      conditions: { tagId },
      targetType: 'ROOM',
      targetId: roomId,
      priority: 10,
      isActive: true,
    }
    if (existing) {
      await prisma.recommendationRule.update({
        where: { id: existing.id },
        data,
      })
      console.log(`  updated rule for "${r.name}"`)
    } else {
      await prisma.recommendationRule.create({ data })
      console.log(`  created rule for "${r.name}"`)
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
