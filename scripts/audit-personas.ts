import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Organization ===')
  const orgs = await prisma.organization.findMany({
    select: { id: true, slug: true, brandName: true },
  })
  for (const o of orgs) console.log(`  ${o.slug}  "${o.brandName}"  id=${o.id}`)

  console.log('\n=== Journey (incl. phases/days) ===')
  const journeys = await prisma.journey.findMany({
    include: {
      phases: {
        orderBy: { position: 'asc' },
        include: { days: { orderBy: { position: 'asc' }, select: { position: true, title: true } } },
      },
    },
  })
  for (const j of journeys) {
    console.log(`  journey: ${j.slug}  "${j.title}"`)
    for (const ph of j.phases) {
      console.log(`    phase ${ph.position}: "${ph.title}"`)
      for (const d of ph.days) console.log(`      day ${d.position}: "${d.title ?? '(no title)'}"`)
    }
  }

  console.log('\n=== Content tags ===')
  const tags = await prisma.contentTag.findMany({ orderBy: { name: 'asc' }, select: { name: true, slug: true } })
  for (const t of tags) console.log(`  ${t.slug.padEnd(32)} "${t.name}"`)

  console.log('\n=== Community rooms ===')
  const rooms = await prisma.communityRoom.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { tags: { include: { tag: { select: { slug: true, name: true } } } } },
  })
  for (const r of rooms) {
    const tagList = r.tags.map((rt) => rt.tag.slug).join(', ') || '(no tags)'
    console.log(`  ${r.isArchived ? 'ARCH' : 'on  '}  ${r.slug.padEnd(28)} "${r.name}"  tags: ${tagList}`)
  }

  console.log('\n=== Onboarding questions (with options) ===')
  const questions = await prisma.onboardingQuestion.findMany({
    orderBy: { position: 'asc' },
    include: {
      options: { orderBy: { position: 'asc' }, include: { tag: { select: { slug: true } } } },
    },
  })
  for (const q of questions) {
    console.log(`  #${q.position} [${q.questionType}] ${q.isActive ? 'on' : 'OFF'}: "${q.questionText}"`)
    if (q.helperText) console.log(`    helper: ${q.helperText}`)
    for (const o of q.options) {
      const tagSlug = o.tag?.slug ? `  -> tag: ${o.tag.slug}` : ''
      console.log(`    • "${o.label}" (value=${o.value})${tagSlug}`)
    }
  }

  console.log('\n=== Recommendation rules ===')
  const rules = await prisma.recommendationRule.findMany({ orderBy: { priority: 'desc' } })
  for (const r of rules) {
    console.log(`  ${r.isActive ? 'on' : 'OFF'}  "${r.name}"`)
    console.log(`    conditions: ${JSON.stringify(r.conditions)}`)
    console.log(`    target:     ${r.targetType} ${r.targetId}  (priority ${r.priority})`)
  }

  console.log('\n=== Dashboard messages ===')
  const msgs = await prisma.dashboardMessage.findMany({ orderBy: { stateKey: 'asc' } })
  for (const m of msgs) {
    console.log(`  ${m.stateKey.padEnd(28)} "${m.heading}"`)
    console.log(`    body: ${m.body.slice(0, 120)}${m.body.length > 120 ? '…' : ''}`)
    if (m.ctaLabel) console.log(`    cta:  "${m.ctaLabel}" -> ${m.ctaUrl ?? '(no url)'}`)
  }

  console.log('\n=== Milestone definitions ===')
  const milestones = await prisma.milestoneDefinition.findMany({ orderBy: { name: 'asc' } })
  for (const m of milestones) {
    console.log(`  ${m.isActive ? 'on' : 'OFF'}  "${m.name}"  [${m.triggerType} >= ${m.triggerValue}]`)
    console.log(`    celebrate: "${m.celebrationTitle}"`)
    console.log(`    message:   ${m.celebrationMessage.slice(0, 100)}${m.celebrationMessage.length > 100 ? '…' : ''}`)
  }

  console.log('\n=== Email templates ===')
  const emails = await prisma.emailTemplate.findMany({ orderBy: { templateKey: 'asc' } })
  for (const e of emails) {
    console.log(`  ${e.isActive ? 'on' : 'OFF'}  ${e.templateKey.padEnd(32)} subject="${e.subject}"`)
    if (e.description) console.log(`    ${e.description}`)
  }

  console.log('\n=== Site settings ===')
  const settings = await prisma.siteSetting.findMany({ orderBy: { key: 'asc' } })
  for (const s of settings) {
    console.log(`  ${s.key.padEnd(32)} ${s.value.slice(0, 80)}${s.value.length > 80 ? '…' : ''}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
