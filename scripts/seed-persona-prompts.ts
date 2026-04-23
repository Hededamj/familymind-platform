/**
 * Seed discussion prompts into the three persona community rooms.
 *
 * Prompts are drawn directly from the persona profiles in
 * docs/personas/ — using Mette's own language where possible (pain
 * points, fears, "what they've tried"). Each prompt is framed as an
 * open question that invites honest sharing rather than Q&A.
 *
 * The RoomPromptQueue cron (/api/cron/room-prompts) posts one prompt
 * per room per cycle, ordered by priority desc then createdAt asc.
 *
 * Idempotent: findFirst by (roomId, promptText) to avoid duplicates.
 *
 * Usage: npx tsx scripts/seed-persona-prompts.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type PromptSet = { roomSlug: string; prompts: string[] }

const PROMPTS: PromptSet[] = [
  {
    roomSlug: 'sammenbragt-familie',
    prompts: [
      'Hvornår mærker du først at stemningen er ved at tippe hjemme? Hvad gør du — eller hvad ville du ønske du kunne gøre?',
      'Har du haft dage hvor du følte dig som "den onde"? Hvad trigger den følelse — og hvordan kommer du ud af den igen?',
      'Hvordan taler I om regler når der er forskellige kulturer hjemme? Hvad virker — og hvad har I prøvet der ikke gjorde?',
      'Hvordan ved du om dit barn "tester" dig, eller om det faktisk har brug for noget? Deler du gerne noget du har lært.',
      'Hvornår er I som voksne et team — og hvornår står I pludselig i "to lejre"? Hvad tipper det den ene eller anden vej?',
      'Hvad ville du ønske nogen havde sagt til dig lige da I flyttede sammen?',
    ],
  },
  {
    roomSlug: 'nedsmeltninger',
    prompts: [
      'Hvad er det første tegn på at en nedsmeltning er på vej hos dit barn? Og hos dig selv?',
      'Der findes en masse gode råd der virker "før" — men hvad gør du midt i stormen, når barnet er helt væk i følelser?',
      'Har du oplevet den der "hvorfor reagerer jeg sådan"-skam efter en nedsmeltning? Hvordan tager du dig selv op igen?',
      'Hvilket klassisk råd virkede IKKE for jer — selvom alle anbefalede det? Fx "ignorer", "konsekvens", "bliv nu bare rolig"...',
      'Hvad har jeres efter-en-nedsmeltning-rutine brug for at indeholde, for at familien kan komme videre?',
      'Hvornår har du senest gjort det "rigtige" midt i en situation? Hvad var det — og hvad hjalp dig med at gøre det?',
    ],
  },
  {
    roomSlug: 'neurodivergens',
    prompts: [
      'Hvad betyder "konstant beredskab" i jeres hverdag? Hvornår kan du slippe det?',
      'Hvordan håndterer I forskellen mellem barnet i institutionen/skolen og barnet hjemme? Hvad har virket?',
      'Hvilket råd fra omverdenen er mest trættende at høre? Hvordan svarer du — eller svarer du overhovedet?',
      'Hvad ved du om dit barns nervesystem i dag, som du ikke vidste for et år siden?',
      'Hvornår passer du på dig selv i alt det her? Eller gør du?',
      'Hvad har du sluppet forventningen om, fordi det bare ikke passer til jeres liv? Og hvad holder du fast i?',
    ],
  },
]

async function main() {
  const slugs = PROMPTS.map((p) => p.roomSlug)
  const rooms = await prisma.communityRoom.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, name: true },
  })
  const roomBySlug = new Map(rooms.map((r) => [r.slug, r]))

  const missing = slugs.filter((s) => !roomBySlug.has(s))
  if (missing.length > 0) {
    throw new Error(`Missing community rooms: ${missing.join(', ')}`)
  }

  for (const set of PROMPTS) {
    const room = roomBySlug.get(set.roomSlug)!
    console.log(`\nRoom: ${room.name} (${room.slug})`)

    // Higher priority for prompts earlier in the list — they feel more
    // welcoming/invitational. Cron picks highest priority first.
    let priority = set.prompts.length
    for (const text of set.prompts) {
      const existing = await prisma.roomPromptQueue.findFirst({
        where: { roomId: room.id, promptText: text },
      })
      if (existing) {
        console.log(`  exists: "${text.slice(0, 70)}${text.length > 70 ? '…' : ''}"`)
      } else {
        await prisma.roomPromptQueue.create({
          data: {
            roomId: room.id,
            promptText: text,
            priority,
          },
        })
        console.log(`  created: "${text.slice(0, 70)}${text.length > 70 ? '…' : ''}"`)
      }
      priority--
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
