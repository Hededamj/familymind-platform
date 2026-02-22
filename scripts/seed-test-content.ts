import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Tags (already seeded, fetch them)
  const tagSleep = await prisma.contentTag.findUnique({ where: { slug: 'sovn' } })
  const tagBoundaries = await prisma.contentTag.findUnique({ where: { slug: 'graenser' } })
  const tagEmotions = await prisma.contentTag.findUnique({ where: { slug: 'folelser' } })
  const tagCommunication = await prisma.contentTag.findUnique({ where: { slug: 'kommunikation' } })
  const tagSelfCare = await prisma.contentTag.findUnique({ where: { slug: 'selvpleje' } })

  // Helper to connect tag via junction table
  async function connectTag(contentUnitId: string, tagId: string | undefined) {
    if (!tagId) return
    const existing = await prisma.contentUnitTag.findFirst({ where: { contentUnitId, tagId } })
    if (!existing) {
      await prisma.contentUnitTag.create({ data: { contentUnitId, tagId } })
    }
  }

  // --- Standalone Content Units ---
  const content1 = await prisma.contentUnit.upsert({
    where: { slug: '5-tips-til-bedre-sengetid' },
    update: {},
    create: {
      title: '5 tips til en bedre sengetid',
      slug: '5-tips-til-bedre-sengetid',
      description: 'Konkrete og nemme tips til at gøre sengetiden til en rolig og tryg oplevelse for hele familien.',
      mediaType: 'TEXT',
      durationMinutes: 5,
      isFree: true,
      isStandalone: true,
      accessLevel: 'FREE',
      publishedAt: new Date(),
    },
  })
  await connectTag(content1.id, tagSleep?.id)

  const content2 = await prisma.contentUnit.upsert({
    where: { slug: 'naar-dit-barn-siger-nej' },
    update: {},
    create: {
      title: 'Når dit barn siger "nej" — hvad gør du?',
      slug: 'naar-dit-barn-siger-nej',
      description: 'Forstå hvorfor børn siger nej, og lær 3 strategier til at håndtere modstand uden konflikter.',
      mediaType: 'TEXT',
      durationMinutes: 4,
      isFree: true,
      isStandalone: true,
      accessLevel: 'FREE',
      publishedAt: new Date(),
    },
  })
  await connectTag(content2.id, tagBoundaries?.id)

  const content3 = await prisma.contentUnit.upsert({
    where: { slug: 'folelsesregulering-for-smaa-boern' },
    update: {},
    create: {
      title: 'Følelsesregulering for små børn',
      slug: 'folelsesregulering-for-smaa-boern',
      description: 'Hjælp dit barn med at forstå og håndtere store følelser med disse alderssvarende teknikker.',
      mediaType: 'TEXT',
      durationMinutes: 6,
      isFree: false,
      isStandalone: true,
      accessLevel: 'SUBSCRIPTION',
      publishedAt: new Date(),
    },
  })
  await connectTag(content3.id, tagEmotions?.id)

  const content4 = await prisma.contentUnit.upsert({
    where: { slug: 'kommunikation-der-virker' },
    update: {},
    create: {
      title: 'Kommunikation der virker med dit barn',
      slug: 'kommunikation-der-virker',
      description: 'Lær at kommunikere så dit barn lytter — og lytte så dit barn taler.',
      mediaType: 'TEXT',
      durationMinutes: 5,
      isFree: true,
      isStandalone: true,
      accessLevel: 'FREE',
      publishedAt: new Date(),
    },
  })
  await connectTag(content4.id, tagCommunication?.id)

  const content5 = await prisma.contentUnit.upsert({
    where: { slug: 'selvpleje-for-tratte-foraeldre' },
    update: {},
    create: {
      title: 'Selvpleje for trætte forældre',
      slug: 'selvpleje-for-tratte-foraeldre',
      description: 'Du kan ikke hælde fra en tom kande. Her er 5 realistiske måder at passe på dig selv.',
      mediaType: 'TEXT',
      durationMinutes: 4,
      isFree: true,
      isStandalone: true,
      accessLevel: 'FREE',
      publishedAt: new Date(),
    },
  })
  await connectTag(content5.id, tagSelfCare?.id)

  // --- Product: Course ---
  const course = await prisma.product.upsert({
    where: { slug: 'rolig-aften-kursus' },
    update: {},
    create: {
      title: 'Rolig Aften — komplet kursus',
      slug: 'rolig-aften-kursus',
      description: 'Et komplet kursus i 4 lektioner om at skabe en rolig og tryg aftenrutine.',
      type: 'COURSE',
      priceAmountCents: 14900,
      priceCurrency: 'DKK',
      isActive: true,
    },
  })

  // Course lesson content units
  const lessonData = [
    { slug: 'rolig-aften-lektion-1', title: 'Lektion 1: Forstå dit barns søvnbehov', desc: 'Lær om søvncyklusser og alderstilpassede sengetider.', mins: 8 },
    { slug: 'rolig-aften-lektion-2', title: 'Lektion 2: Design din aftenrutine', desc: 'Skab en aftenrutine der passer til jeres familie.', mins: 10 },
    { slug: 'rolig-aften-lektion-3', title: 'Lektion 3: Håndter modstand ved sengetid', desc: 'Strategier når barnet protesterer eller kommer ud af sengen.', mins: 8 },
    { slug: 'rolig-aften-lektion-4', title: 'Lektion 4: Fasthold rutinen', desc: 'Sådan holder I rutinen kørende — og hvad gør I når det går skævt.', mins: 7 },
  ]

  for (let i = 0; i < lessonData.length; i++) {
    const l = lessonData[i]
    const unit = await prisma.contentUnit.upsert({
      where: { slug: l.slug },
      update: {},
      create: {
        title: l.title,
        slug: l.slug,
        description: l.desc,
        mediaType: 'TEXT',
        durationMinutes: l.mins,
        isFree: false,
        accessLevel: 'PURCHASE',
        publishedAt: new Date(),
      },
    })
    await connectTag(unit.id, tagSleep?.id)

    const existing = await prisma.courseLesson.findFirst({
      where: { productId: course.id, contentUnitId: unit.id },
    })
    if (!existing) {
      await prisma.courseLesson.create({
        data: { productId: course.id, contentUnitId: unit.id, position: i + 1 },
      })
    }
  }

  console.log('Test content created:')
  console.log('  - 5 standalone artikler')
  console.log('  - 1 kursus med 4 lektioner: "Rolig Aften"')
  console.log('  - 1 forløb med 6 dage (fra seed)')
  console.log('')
  console.log('Gå til /browse for at se indhold')
  console.log('Gå til /admin/content for at administrere')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
