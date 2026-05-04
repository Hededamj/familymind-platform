import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Helper: create a record only if no match exists (for models without a natural unique).
 */
async function createIfNotExists<T>(
  findFn: () => Promise<T | null>,
  createFn: () => Promise<T>
): Promise<T> {
  const existing = await findFn()
  if (existing) return existing
  return createFn()
}

async function main() {
  // -- Default Organization: FamilyMind --
  await prisma.organization.upsert({
    where: { slug: 'familymind' },
    update: {},
    create: {
      name: 'FamilyMind',
      slug: 'familymind',
      brandName: 'FamilyMind',
      tagline: 'Din strukturerede forældreguide',
      description: 'Evidensbaseret viden og praktiske værktøjer til hele familien.',
      websiteUrl: 'https://familymind.nu',
      colorPrimary: '#86A0A6',
      colorPrimaryForeground: '#1A1A1A',
      colorAccent: '#E8715A',
      colorSuccess: '#2A6B5A',
      colorBackground: '#FAFAF8',
      colorSand: '#F5F0EB',
      colorForeground: '#1A1A1A',
      colorBorder: '#E8E4DF',
      contactUrl: 'https://familymind.nu',
      emailFromName: 'FamilyMind',
      emailFromEmail: process.env.SEED_EMAIL_FROM_EMAIL || null,
      heroHeading: 'Giv dit barn den bedste start',
      heroSubheading: 'Din strukturerede vej til et trygt og kærligt forældreskab — med viden der virker og værktøjer du kan bruge i dag.',
      heroCtaText: 'Prøv gratis',
      heroCtaUrl: '/signup',
      aboutHeading: 'Bag FamilyMind',
      aboutName: 'Mette Hummel',
      aboutBio: 'Mette er familieterapeut med mange års erfaring i at hjælpe forældre. FamilyMind er bygget på hendes evidensbaserede metoder og den nyeste forskning i børnepsykologi.',
      aboutUrl: 'https://familymind.nu',
      subscriptionPriceDisplay: '149 kr',
      subscriptionPeriodDisplay: '/måned',
      footerCopyright: 'FamilyMind. Alle rettigheder forbeholdes.',
      landingBenefits: [
        'Alle strukturerede forløb',
        'Videokurser og artikler',
        'Daglige øvelser og refleksion',
        'Check-ins og fremgangssporing',
        'Personlige anbefalinger',
        'Adgang til fællesskabet',
      ],
      landingSteps: [
        {
          title: 'Opret din profil',
          description: 'Fortæl os lidt om din familie, så vi kan tilpasse indholdet til jeres behov.',
          icon: 'UserPlus',
        },
        {
          title: 'Vælg dit forløb',
          description: 'Få en personlig anbefaling baseret på din situation, eller udforsk alle forløb.',
          icon: 'Compass',
        },
        {
          title: 'Voks dag for dag',
          description: 'Følg dit forløb med video, øvelser og daglige refleksioner i dit eget tempo.',
          icon: 'TrendingUp',
        },
      ],
      landingFeatures: [
        {
          title: 'Strukturerede forløb',
          description: 'Dag-for-dag programmer udviklet af fagfolk. Hver dag har video, øvelse og refleksion.',
          icon: 'BookOpen',
        },
        {
          title: 'Videokurser',
          description: 'Korte, praktiske videoer du kan se når det passer dig. Nye kurser tilføjes løbende.',
          icon: 'Video',
        },
        {
          title: 'Fællesskab',
          description: 'Del erfaringer med andre forældre på samme forløb. Moderet af fagfolk.',
          icon: 'Users',
        },
      ],
      landingTestimonials: [
        {
          name: 'Anna M.',
          quote: 'FamilyMind har givet os en helt ny måde at håndtere konflikter på. Vores aftener er blevet meget roligere.',
          stars: 5,
        },
        {
          name: 'Lars P.',
          quote: 'Endelig en forældreguide der ikke dømmer. Det føles som at have en terapeut i lommen.',
          stars: 5,
        },
        {
          name: 'Sofie K.',
          quote: 'Forløbene er geniale. Små bidder hver dag — det er overkommeligt selv når hverdagen er kaotisk.',
          stars: 5,
        },
      ],
      landingFaq: [
        {
          question: 'Hvem er platformen for?',
          answer: 'Platformen er for alle forældre der ønsker at styrke relationen til deres børn — uanset om du har specifikke udfordringer eller bare vil blive bedre.',
        },
        {
          question: 'Hvad koster det?',
          answer: 'Abonnementet koster 149 kr/md og giver adgang til alt indhold. Ingen binding — afmeld når som helst.',
        },
        {
          question: 'Er indholdet evidensbaseret?',
          answer: 'Ja, alt indhold er udviklet af autoriserede terapeuter og bygger på den nyeste forskning i børnepsykologi og familieterapi.',
        },
        {
          question: 'Kan jeg prøve gratis?',
          answer: 'Ja, du kan oprette en profil og se udvalgt gratis indhold. Du betaler først når du er klar.',
        },
        {
          question: 'Hvad er et forløb?',
          answer: 'Et forløb er et struktureret program med daglige trin — video, øvelse og refleksion. Typisk 14-30 dage.',
        },
      ],
    },
  })

  // -- Check-in Options (4 defaults) --
  const checkInOptions = await Promise.all([
    createIfNotExists(
      () => prisma.checkInOption.findFirst({ where: { value: 'WORKED_WELL' } }),
      () => prisma.checkInOption.create({ data: { label: 'Det gik godt', value: 'WORKED_WELL', emoji: '😊', position: 1, isActive: true } })
    ),
    createIfNotExists(
      () => prisma.checkInOption.findFirst({ where: { value: 'MIXED' } }),
      () => prisma.checkInOption.create({ data: { label: 'Blandet', value: 'MIXED', emoji: '😐', position: 2, isActive: true } })
    ),
    createIfNotExists(
      () => prisma.checkInOption.findFirst({ where: { value: 'HARD' } }),
      () => prisma.checkInOption.create({ data: { label: 'Det var svært', value: 'HARD', emoji: '😓', position: 3, isActive: true } })
    ),
    createIfNotExists(
      () => prisma.checkInOption.findFirst({ where: { value: 'SKIPPED' } }),
      () => prisma.checkInOption.create({ data: { label: 'Sprang over', value: 'SKIPPED', emoji: '⏭️', position: 4, isActive: true } })
    ),
  ])

  // -- Dashboard Messages (5 generic states; persona-specific variants
  // are seeded separately via scripts/seed-persona-dashboard-messages.ts) --
  const genericMessages = [
    { stateKey: 'new_user', heading: 'Velkommen til FamilyMind!', body: 'Vi har fundet nogle anbefalinger til dig baseret på din profil.', ctaLabel: 'Se anbefalinger', ctaUrl: '/browse' },
    { stateKey: 'active_journey', heading: 'Fortsæt dit forløb', body: 'Du er godt på vej. Fortsæt hvor du slap.', ctaLabel: 'Fortsæt', ctaUrl: '/dashboard' },
    { stateKey: 'active_journey_plus_courses', heading: 'Din dag venter', body: 'Fortsæt dit forløb og dine kurser nedenfor.', ctaLabel: 'Fortsæt', ctaUrl: '/dashboard' },
    { stateKey: 'no_journey_has_courses', heading: 'Klar til et forløb?', body: 'Du følger kurser, men har du overvejet et struktureret forløb?', ctaLabel: 'Udforsk forløb', ctaUrl: '/browse' },
    { stateKey: 'completed_journey', heading: 'Tillykke! 🎉', body: 'Du har gennemført dit forløb. Klar til det næste?', ctaLabel: 'Find dit næste forløb', ctaUrl: '/browse' },
  ]
  for (const m of genericMessages) {
    const existing = await prisma.dashboardMessage.findFirst({
      where: { stateKey: m.stateKey, tagId: null },
    })
    if (!existing) {
      await prisma.dashboardMessage.create({ data: m })
    }
  }

  // -- Email Templates (all types) --
  const emailTemplates = await Promise.all([
    prisma.emailTemplate.upsert({ where: { templateKey: 'weekly_plan' }, update: {}, create: { templateKey: 'weekly_plan', subject: 'Din uge er klar, {{userName}}', bodyHtml: '<h1>Hej {{userName}}</h1><p>Din nye uge i {{journeyTitle}} er klar. Log ind og se hvad der venter dig.</p>', description: 'Sent weekly when a new journey week is ready' } }),
    prisma.emailTemplate.upsert({ where: { templateKey: 'midweek_nudge' }, update: {}, create: { templateKey: 'midweek_nudge', subject: 'Husk dit forløb, {{userName}}', bodyHtml: '<h1>Hej {{userName}}</h1><p>Du har ikke åbnet dit indhold endnu i denne uge. Tag et kig?</p>', description: 'Sent mid-week if user has not opened content' } }),
    prisma.emailTemplate.upsert({ where: { templateKey: 'reflection' }, update: {}, create: { templateKey: 'reflection', subject: 'Tid til refleksion', bodyHtml: '<h1>Hej {{userName}}</h1><p>Du har set dit indhold — nu er det tid til at reflektere. Hvordan gik det?</p>', description: 'Sent if user consumed content but has not checked in' } }),
    prisma.emailTemplate.upsert({ where: { templateKey: 'monthly_progress' }, update: {}, create: { templateKey: 'monthly_progress', subject: 'Din månedlige fremgang', bodyHtml: '<h1>Hej {{userName}}</h1><p>Her er din fremgang denne måned hos {{brandName}}.</p>', description: 'Monthly progress summary' } }),
    prisma.emailTemplate.upsert({ where: { templateKey: 'reengagement_tier1' }, update: {}, create: { templateKey: 'reengagement_tier1', subject: 'Vi savner dig, {{userName}}', bodyHtml: '<h1>Hej {{userName}}</h1><p>Det er et stykke tid siden vi har set dig. Hvad med at tage et hurtigt kig?</p>', description: 'Re-engagement tier 1: gentle reminder' } }),
    prisma.emailTemplate.upsert({ where: { templateKey: 'reengagement_tier2' }, update: {}, create: { templateKey: 'reengagement_tier2', subject: 'Dit forløb venter stadig', bodyHtml: '<h1>Hej {{userName}}</h1><p>Dit forløb {{journeyTitle}} venter stadig på dig. Hop ind igen?</p>', description: 'Re-engagement tier 2: journey reminder' } }),
    prisma.emailTemplate.upsert({ where: { templateKey: 'reengagement_tier3' }, update: {}, create: { templateKey: 'reengagement_tier3', subject: 'Nyt indhold du måske har misset', bodyHtml: '<h1>Hej {{userName}}</h1><p>Der er kommet nyt indhold siden sidst. Se hvad der er nyt.</p>', description: 'Re-engagement tier 3: new content highlight' } }),
    prisma.emailTemplate.upsert({ where: { templateKey: 'reengagement_tier4' }, update: {}, create: { templateKey: 'reengagement_tier4', subject: 'Vi holder din plads', bodyHtml: '<h1>Hej {{userName}}</h1><p>Dit abonnement er stadig aktivt. Vi holder din plads klar, når du er klar til at vende tilbage.</p>', description: 'Re-engagement tier 4: final gentle nudge' } }),
    prisma.emailTemplate.upsert({ where: { templateKey: 'community_reply' }, update: {}, create: { templateKey: 'community_reply', subject: '{{replierName}} svarede på dit indlæg', bodyHtml: '<h1>Hej {{userName}}</h1><p>{{replierName}} har svaret på dit indlæg:</p><blockquote>{{replySnippet}}</blockquote><p>Dit indlæg: "{{postSnippet}}"</p><p><a href="{{appUrl}}/dashboard">Se svaret</a></p>', description: 'Sent when someone replies to your discussion post' } }),
    prisma.emailTemplate.upsert({ where: { templateKey: 'community_digest' }, update: {}, create: { templateKey: 'community_digest', subject: 'Ugens nyt fra {{cohortName}}', bodyHtml: '<h1>Hej {{userName}}</h1><p>Her er hvad der er sket i din gruppe denne uge i {{journeyTitle}}:</p><ul><li>{{newPosts}} nye indlæg</li><li>{{newReplies}} svar</li><li>{{activeMembers}} aktive medlemmer</li></ul><p><a href="{{communityUrl}}">Gå til fællesskabet</a></p>', description: 'Weekly community activity digest' } }),
  ])

  // -- Notification Schedule --
  await Promise.all([
    createIfNotExists(
      () => prisma.notificationSchedule.findFirst({ where: { notificationType: 'WEEKLY_PLAN', dayOfWeek: 1 } }),
      () => prisma.notificationSchedule.create({ data: { notificationType: 'WEEKLY_PLAN', dayOfWeek: 1, timeOfDay: '08:00', isActive: true } })
    ),
    createIfNotExists(
      () => prisma.notificationSchedule.findFirst({ where: { notificationType: 'MIDWEEK_NUDGE', dayOfWeek: 3 } }),
      () => prisma.notificationSchedule.create({ data: { notificationType: 'MIDWEEK_NUDGE', dayOfWeek: 3, timeOfDay: '18:00', isActive: true } })
    ),
    createIfNotExists(
      () => prisma.notificationSchedule.findFirst({ where: { notificationType: 'REFLECTION', dayOfWeek: 5 } }),
      () => prisma.notificationSchedule.create({ data: { notificationType: 'REFLECTION', dayOfWeek: 5, timeOfDay: '18:00', isActive: true } })
    ),
    createIfNotExists(
      () => prisma.notificationSchedule.findFirst({ where: { notificationType: 'MONTHLY_PROGRESS', dayOfWeek: 0 } }),
      () => prisma.notificationSchedule.create({ data: { notificationType: 'MONTHLY_PROGRESS', dayOfWeek: 0, timeOfDay: '10:00', isActive: true } })
    ),
  ])

  // -- Re-engagement Tiers --
  await Promise.all([
    prisma.reEngagementTier.upsert({ where: { tierNumber: 1 }, update: {}, create: { tierNumber: 1, daysInactiveMin: 7, daysInactiveMax: 14, emailTemplateId: emailTemplates[4].id, isActive: true } }),
    prisma.reEngagementTier.upsert({ where: { tierNumber: 2 }, update: {}, create: { tierNumber: 2, daysInactiveMin: 15, daysInactiveMax: 30, emailTemplateId: emailTemplates[5].id, isActive: true } }),
    prisma.reEngagementTier.upsert({ where: { tierNumber: 3 }, update: {}, create: { tierNumber: 3, daysInactiveMin: 31, daysInactiveMax: 60, emailTemplateId: emailTemplates[6].id, isActive: true } }),
    prisma.reEngagementTier.upsert({ where: { tierNumber: 4 }, update: {}, create: { tierNumber: 4, daysInactiveMin: 61, daysInactiveMax: 90, emailTemplateId: emailTemplates[7].id, isActive: true } }),
  ])

  // -- Milestone Definitions --
  await Promise.all([
    createIfNotExists(
      () => prisma.milestoneDefinition.findFirst({ where: { name: 'Første dag gennemført' } }),
      () => prisma.milestoneDefinition.create({ data: { name: 'Første dag gennemført', triggerType: 'DAYS_ACTIVE', triggerValue: 1, celebrationTitle: 'Godt begyndt!', celebrationMessage: 'Du har gennemført din første dag. Fantastisk start!', isActive: true } })
    ),
    createIfNotExists(
      () => prisma.milestoneDefinition.findFirst({ where: { name: 'Første uge aktiv' } }),
      () => prisma.milestoneDefinition.create({ data: { name: 'Første uge aktiv', triggerType: 'DAYS_ACTIVE', triggerValue: 7, celebrationTitle: 'En hel uge!', celebrationMessage: 'Du har været aktiv i en hel uge. Stærkt arbejde!', isActive: true } })
    ),
    createIfNotExists(
      () => prisma.milestoneDefinition.findFirst({ where: { name: 'Fase gennemført' } }),
      () => prisma.milestoneDefinition.create({ data: { name: 'Fase gennemført', triggerType: 'PHASE_COMPLETE', triggerValue: 1, celebrationTitle: 'Fase klaret!', celebrationMessage: 'Du har gennemført en hel fase i dit forløb. Imponerende!', isActive: true } })
    ),
    createIfNotExists(
      () => prisma.milestoneDefinition.findFirst({ where: { name: 'Forløb gennemført' } }),
      () => prisma.milestoneDefinition.create({ data: { name: 'Forløb gennemført', triggerType: 'JOURNEY_COMPLETE', triggerValue: 1, celebrationTitle: 'Tillykke! 🎉', celebrationMessage: 'Du har gennemført hele dit forløb. Du er fantastisk!', isActive: true } })
    ),
    createIfNotExists(
      () => prisma.milestoneDefinition.findFirst({ where: { name: '10 indhold gennemført' } }),
      () => prisma.milestoneDefinition.create({ data: { name: '10 indhold gennemført', triggerType: 'CONTENT_COUNT', triggerValue: 10, celebrationTitle: 'Dedikeret lærende!', celebrationMessage: 'Du har gennemført 10 stykker indhold. Fortsæt det gode arbejde!', isActive: true } })
    ),
  ])

  // -- Onboarding Questions --

  // Migrate Q1 from SLIDER to MULTI_SELECT if it already exists
  const existingQ1 = await prisma.onboardingQuestion.findFirst({ where: { questionText: 'Hvad er dit barns alder?' } })
  if (existingQ1) {
    await prisma.onboardingQuestion.update({
      where: { id: existingQ1.id },
      data: { questionText: 'Hvilke aldersgrupper passer til dine børn?', questionType: 'MULTI_SELECT', helperText: 'Vælg alle der passer — du kan have flere børn' },
    })
  }

  const q1 = await createIfNotExists(
    () => prisma.onboardingQuestion.findFirst({ where: { questionText: 'Hvilke aldersgrupper passer til dine børn?' } }),
    () => prisma.onboardingQuestion.create({ data: { questionText: 'Hvilke aldersgrupper passer til dine børn?', questionType: 'MULTI_SELECT', position: 1, isActive: true, helperText: 'Vælg alle der passer — du kan have flere børn' } })
  )
  const q2 = await createIfNotExists(
    () => prisma.onboardingQuestion.findFirst({ where: { questionText: 'Hvad er din største udfordring lige nu?' } }),
    () => prisma.onboardingQuestion.create({ data: { questionText: 'Hvad er din største udfordring lige nu?', questionType: 'SINGLE_SELECT', position: 2, isActive: true, helperText: 'Vælg den der fylder mest' } })
  )
  const q3 = await createIfNotExists(
    () => prisma.onboardingQuestion.findFirst({ where: { questionText: 'Hvilke emner interesserer dig?' } }),
    () => prisma.onboardingQuestion.create({ data: { questionText: 'Hvilke emner interesserer dig?', questionType: 'MULTI_SELECT', position: 3, isActive: true, helperText: 'Vælg alle der er relevante' } })
  )
  const q4 = await createIfNotExists(
    () => prisma.onboardingQuestion.findFirst({ where: { questionText: 'Hvornår har du mest tid til at lære?' } }),
    () => prisma.onboardingQuestion.create({ data: { questionText: 'Hvornår har du mest tid til at lære?', questionType: 'SINGLE_SELECT', position: 4, isActive: true } })
  )
  const q5 = await createIfNotExists(
    () => prisma.onboardingQuestion.findFirst({ where: { questionText: 'Hvad er dit mål med FamilyMind?' } }),
    () => prisma.onboardingQuestion.create({ data: { questionText: 'Hvad er dit mål med FamilyMind?', questionType: 'SINGLE_SELECT', position: 5, isActive: true } })
  )

  // Create tags (idempotent via slug)
  const tagSleep = await prisma.contentTag.upsert({ where: { slug: 'sovn' }, update: {}, create: { name: 'Søvn', slug: 'sovn' } })
  const tagBoundaries = await prisma.contentTag.upsert({ where: { slug: 'graenser' }, update: {}, create: { name: 'Grænser', slug: 'graenser' } })
  const tagEmotions = await prisma.contentTag.upsert({ where: { slug: 'folelser' }, update: {}, create: { name: 'Følelser', slug: 'folelser' } })
  const tagCommunication = await prisma.contentTag.upsert({ where: { slug: 'kommunikation' }, update: {}, create: { name: 'Kommunikation', slug: 'kommunikation' } })
  const tagSelfCare = await prisma.contentTag.upsert({ where: { slug: 'selvpleje' }, update: {}, create: { name: 'Selvpleje', slug: 'selvpleje' } })

  // Age group tags
  const tagBaby = await prisma.contentTag.upsert({ where: { slug: 'baby' }, update: {}, create: { name: 'Baby (0-1 år)', slug: 'baby' } })
  const tagToddler = await prisma.contentTag.upsert({ where: { slug: 'smaborn' }, update: {}, create: { name: 'Småbørn (1-3 år)', slug: 'smaborn' } })
  const tagPreschool = await prisma.contentTag.upsert({ where: { slug: 'bornehave' }, update: {}, create: { name: 'Børnehave (3-6 år)', slug: 'bornehave' } })
  const tagSchool = await prisma.contentTag.upsert({ where: { slug: 'skolebarn' }, update: {}, create: { name: 'Skolebørn (6-10 år)', slug: 'skolebarn' } })
  const tagTween = await prisma.contentTag.upsert({ where: { slug: 'tweens' }, update: {}, create: { name: 'Tweens (10-13 år)', slug: 'tweens' } })
  const tagTeen = await prisma.contentTag.upsert({ where: { slug: 'teenager' }, update: {}, create: { name: 'Teenagere (13-18 år)', slug: 'teenager' } })

  // Q1 options (age groups)
  const q1OptionCount = await prisma.onboardingOption.count({ where: { questionId: q1.id } })
  if (q1OptionCount === 0) {
    await Promise.all([
      prisma.onboardingOption.create({ data: { questionId: q1.id, label: 'Baby (0-1 år)', value: 'baby', tagId: tagBaby.id, position: 1 } }),
      prisma.onboardingOption.create({ data: { questionId: q1.id, label: 'Småbørn (1-3 år)', value: 'toddler', tagId: tagToddler.id, position: 2 } }),
      prisma.onboardingOption.create({ data: { questionId: q1.id, label: 'Børnehave (3-6 år)', value: 'preschool', tagId: tagPreschool.id, position: 3 } }),
      prisma.onboardingOption.create({ data: { questionId: q1.id, label: 'Skolebørn (6-10 år)', value: 'school', tagId: tagSchool.id, position: 4 } }),
      prisma.onboardingOption.create({ data: { questionId: q1.id, label: 'Tweens (10-13 år)', value: 'tween', tagId: tagTween.id, position: 5 } }),
      prisma.onboardingOption.create({ data: { questionId: q1.id, label: 'Teenagere (13-18 år)', value: 'teen', tagId: tagTeen.id, position: 6 } }),
    ])
  }

  // Q2 options (only create if question has no options yet)
  const q2OptionCount = await prisma.onboardingOption.count({ where: { questionId: q2.id } })
  if (q2OptionCount === 0) {
    await Promise.all([
      prisma.onboardingOption.create({ data: { questionId: q2.id, label: 'Søvn og sengetid', value: 'sleep', tagId: tagSleep.id, position: 1 } }),
      prisma.onboardingOption.create({ data: { questionId: q2.id, label: 'Grænser og konflikter', value: 'boundaries', tagId: tagBoundaries.id, position: 2 } }),
      prisma.onboardingOption.create({ data: { questionId: q2.id, label: 'Følelsesregulering', value: 'emotions', tagId: tagEmotions.id, position: 3 } }),
      prisma.onboardingOption.create({ data: { questionId: q2.id, label: 'Kommunikation', value: 'communication', tagId: tagCommunication.id, position: 4 } }),
    ])
  }

  // Q3 options
  const q3OptionCount = await prisma.onboardingOption.count({ where: { questionId: q3.id } })
  if (q3OptionCount === 0) {
    await Promise.all([
      prisma.onboardingOption.create({ data: { questionId: q3.id, label: 'Søvn', value: 'sleep', tagId: tagSleep.id, position: 1 } }),
      prisma.onboardingOption.create({ data: { questionId: q3.id, label: 'Grænser', value: 'boundaries', tagId: tagBoundaries.id, position: 2 } }),
      prisma.onboardingOption.create({ data: { questionId: q3.id, label: 'Følelser', value: 'emotions', tagId: tagEmotions.id, position: 3 } }),
      prisma.onboardingOption.create({ data: { questionId: q3.id, label: 'Kommunikation', value: 'communication', tagId: tagCommunication.id, position: 4 } }),
      prisma.onboardingOption.create({ data: { questionId: q3.id, label: 'Selvpleje som forælder', value: 'selfcare', tagId: tagSelfCare.id, position: 5 } }),
    ])
  }

  // Q4 options
  const q4OptionCount = await prisma.onboardingOption.count({ where: { questionId: q4.id } })
  if (q4OptionCount === 0) {
    await Promise.all([
      prisma.onboardingOption.create({ data: { questionId: q4.id, label: 'Om morgenen', value: 'morning', position: 1 } }),
      prisma.onboardingOption.create({ data: { questionId: q4.id, label: 'I frokostpausen', value: 'lunch', position: 2 } }),
      prisma.onboardingOption.create({ data: { questionId: q4.id, label: 'Om aftenen', value: 'evening', position: 3 } }),
      prisma.onboardingOption.create({ data: { questionId: q4.id, label: 'I weekenden', value: 'weekend', position: 4 } }),
    ])
  }

  // Q5 options
  const q5OptionCount = await prisma.onboardingOption.count({ where: { questionId: q5.id } })
  if (q5OptionCount === 0) {
    await Promise.all([
      prisma.onboardingOption.create({ data: { questionId: q5.id, label: 'Bedre dagligdag', value: 'daily_life', position: 1 } }),
      prisma.onboardingOption.create({ data: { questionId: q5.id, label: 'Forstå mit barn bedre', value: 'understand_child', position: 2 } }),
      prisma.onboardingOption.create({ data: { questionId: q5.id, label: 'Håndtere konflikter', value: 'handle_conflicts', position: 3 } }),
      prisma.onboardingOption.create({ data: { questionId: q5.id, label: 'Mere ro i familien', value: 'family_peace', position: 4 } }),
    ])
  }

  // -- Site Settings --
  await Promise.all([
    prisma.siteSetting.upsert({ where: { key: 'subscription_price_dkk' }, update: {}, create: { key: 'subscription_price_dkk', value: '149', description: 'Monthly subscription price in DKK' } }),
    prisma.siteSetting.upsert({ where: { key: 'notification_max_per_week' }, update: {}, create: { key: 'notification_max_per_week', value: '3', description: 'Maximum notifications per user per week' } }),
  ])

  // -- Community Site Settings --
  const communitySettings = [
    { key: 'community_index_min_chars', value: '50', description: 'Minimum tegn i opslag før Google-indeksering' },
    { key: 'community_index_min_replies', value: '1', description: 'Minimum antal svar før Google-indeksering' },
    { key: 'community_digest_includes_rooms', value: 'true', description: 'Inkludér åbne rum i community-digest' },
    { key: 'community_digest_frequency', value: 'weekly', description: 'Community-digest frekvens (daily/weekly/monthly/off)' },
    { key: 'community_notify_reply_inapp', value: 'true', description: 'In-app notifikation ved svar på opslag' },
    { key: 'community_notify_reply_email', value: 'false', description: 'Email-notifikation ved svar (bruger opt-in)' },
    { key: 'community_prompt_time', value: '08:00', description: 'Tidspunkt for auto-posting af prompts (HH:MM)' },
    { key: 'community_prompt_author_id', value: '', description: 'Bruger-ID for prompt-forfatter (tom = første admin)' },
  ]

  for (const setting of communitySettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  // -- Default Community Rooms --
  const defaultRooms = [
    { name: 'Hverdagen som forælder', slug: 'hverdagen', description: 'Del hverdagens op- og nedture', icon: 'Heart', sortOrder: 0 },
    { name: 'Spørgsmål & svar', slug: 'spoergsmaal', description: 'Stil spørgsmål til andre forældre', icon: 'HelpCircle', sortOrder: 1 },
    { name: 'Wins & fremskridt', slug: 'wins', description: 'Del dine sejre, store som små', icon: 'Trophy', sortOrder: 2 },
    { name: 'Tips & ressourcer', slug: 'tips', description: 'Del artikler, bøger, værktøjer', icon: 'Lightbulb', sortOrder: 3 },
  ]

  for (const room of defaultRooms) {
    await prisma.communityRoom.upsert({
      where: { slug: room.slug },
      update: {},
      create: room,
    })
  }

  // -- Test Journey (idempotent via slug) --
  const existingJourney = await prisma.journey.findUnique({ where: { slug: 'bedre-sovnrutiner' } })

  if (!existingJourney) {
    const journey = await prisma.journey.create({
      data: {
        title: 'Bedre søvnrutiner',
        description: 'Et struktureret forløb mod bedre søvn for hele familien. Lær teknikker og opbyg gode vaner dag for dag.',
        slug: 'bedre-sovnrutiner',
        targetAgeMin: 0.5,
        targetAgeMax: 6,
        estimatedDays: 6,
        isActive: true,
      },
    })

    const phase1 = await prisma.journeyPhase.create({
      data: { journeyId: journey.id, title: 'Grundlaget', position: 1 },
    })
    const phase2 = await prisma.journeyPhase.create({
      data: { journeyId: journey.id, title: 'Nye vaner', position: 2 },
    })

    // Phase 1 days
    const day1 = await prisma.journeyDay.create({ data: { phaseId: phase1.id, title: 'Forstå søvnbehov', position: 1 } })
    await prisma.journeyDayAction.create({ data: { dayId: day1.id, actionText: 'Observer dit barns søvnsignaler i dag', reflectionPrompt: 'Hvilke signaler lagde du mærke til?' } })

    const day2 = await prisma.journeyDay.create({ data: { phaseId: phase1.id, title: 'Aftenrutinen', position: 2 } })
    await prisma.journeyDayAction.create({ data: { dayId: day2.id, actionText: 'Skriv jeres nuværende aftenrutine ned', reflectionPrompt: 'Hvad fungerer godt, og hvad kunne forbedres?' } })

    const day3 = await prisma.journeyDay.create({ data: { phaseId: phase1.id, title: 'Søvnmiljøet', position: 3 } })
    await prisma.journeyDayAction.create({ data: { dayId: day3.id, actionText: 'Gennemgå dit barns soveværelse — er det mørkt, stille og køligt?', reflectionPrompt: 'Hvad ændrede du ved søvnmiljøet?' } })

    // Phase 2 days
    const day4 = await prisma.journeyDay.create({ data: { phaseId: phase2.id, title: 'Den nye rutine', position: 1 } })
    await prisma.journeyDayAction.create({ data: { dayId: day4.id, actionText: 'Implementer den nye aftenrutine i aften', reflectionPrompt: 'Hvordan reagerede dit barn på den nye rutine?' } })

    const day5 = await prisma.journeyDay.create({ data: { phaseId: phase2.id, title: 'Håndter modstand', position: 2 } })
    await prisma.journeyDayAction.create({ data: { dayId: day5.id, actionText: 'Øv dig i rolig bekræftelse når dit barn protesterer', reflectionPrompt: 'Hvilken teknik virkede bedst?' } })

    const day6 = await prisma.journeyDay.create({ data: { phaseId: phase2.id, title: 'Fasthold rutinen', position: 3 } })
    await prisma.journeyDayAction.create({ data: { dayId: day6.id, actionText: 'Fortsæt rutinen og bemærk fremskridt', reflectionPrompt: 'Hvad har ændret sig siden dag 1?' } })

    // Recommendation rule for this journey
    await prisma.recommendationRule.create({
      data: {
        name: 'Søvnudfordringer → Søvnforløb',
        conditions: { tagId: tagSleep.id },
        targetType: 'JOURNEY',
        targetId: journey.id,
        priority: 10,
        isActive: true,
      },
    })
  }

  // -- PR1 STUB: course/module seeding skal re-implementeres i PR 2 --

  // -- Journey email templates --
  await prisma.emailTemplate.upsert({
    where: { templateKey: 'journey_welcome' },
    update: {},
    create: {
      templateKey: 'journey_welcome',
      subject: 'Dit forløb starter i morgen, {{userName}}',
      bodyHtml: '<h1>Hej {{userName}}</h1><p>Du har startet forløbet "{{journeyTitle}}". Din første dag er klar i morgen.</p><p>Forløbet tager ca. {{estimatedDays}} dage. Du kan gå i dit eget tempo.</p><p><a href="{{appUrl}}/dashboard">Gå til din side</a></p>',
      description: 'Sent when a user starts a guided journey',
      isActive: true,
    },
  })

  await prisma.emailTemplate.upsert({
    where: { templateKey: 'journey_day_complete' },
    update: {},
    create: {
      templateKey: 'journey_day_complete',
      subject: 'Godt klaret, {{userName}}!',
      bodyHtml: '<h1>Godt klaret, {{userName}}!</h1><p>Du har gennemført {{dayTitle}} i "{{journeyTitle}}".</p><p>{{nextDayTeaser}}</p><p><a href="{{appUrl}}/dashboard">Fortsæt i morgen</a></p>',
      description: 'Sent after completing a journey day',
      isActive: true,
    },
  })

  await prisma.emailTemplate.upsert({
    where: { templateKey: 'journey_nudge' },
    update: {},
    create: {
      templateKey: 'journey_nudge',
      subject: '{{nextDayTitle}} venter på dig',
      bodyHtml: '<h1>Hej {{userName}}</h1><p>Din næste dag i "{{journeyTitle}}" handler om {{nextDayTitle}}.</p><p>Det tager kun {{estimatedMinutes}} minutter.</p><p><a href="{{appUrl}}/dashboard">Fortsæt dit forløb</a></p>',
      description: 'Gentle nudge when user has not progressed in 1-2 days',
      isActive: true,
    },
  })

  await prisma.emailTemplate.upsert({
    where: { templateKey: 'journey_complete' },
    update: {},
    create: {
      templateKey: 'journey_complete',
      subject: 'Tillykke med dit gennemførte forløb, {{userName}}!',
      bodyHtml: '<h1>Tillykke, {{userName}}!</h1><p>Du har gennemført "{{journeyTitle}}".</p><p>Du kan altid gå tilbage og se indholdet igen.</p><p>{{recommendationText}}</p><p><a href="{{appUrl}}/dashboard">Tilbage til din side</a></p>',
      description: 'Sent when a user completes a journey',
      isActive: true,
    },
  })

  // -- Cancellation Reasons (7 lookup rows) --
  const CANCELLATION_REASONS = [
    { slug: 'pris',                 label: 'For dyrt' },
    { slug: 'tid',                  label: 'Mangler tid' },
    { slug: 'fandt-alternativ',     label: 'Fandt et alternativ' },
    { slug: 'indhold-matcher-ikke', label: 'Indholdet passer ikke til mig' },
    { slug: 'personlig-situation',  label: 'Personlig situation' },
    { slug: 'forbedret',            label: 'Tingene er gået bedre' },
    { slug: 'teknisk',              label: 'Tekniske problemer' },
  ] as const

  for (const reason of CANCELLATION_REASONS) {
    await prisma.cancellationReason.upsert({
      where: { slug: reason.slug },
      update: { label: reason.label },
      create: reason,
    })
  }
  console.log(`Seeded ${CANCELLATION_REASONS.length} cancellation reasons`)

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
