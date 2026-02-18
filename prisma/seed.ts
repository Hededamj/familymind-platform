import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // -- Check-in Options (4 defaults) --
  const checkInOptions = await Promise.all([
    prisma.checkInOption.create({ data: { label: 'Det gik godt', value: 'WORKED_WELL', emoji: '😊', position: 1, isActive: true } }),
    prisma.checkInOption.create({ data: { label: 'Blandet', value: 'MIXED', emoji: '😐', position: 2, isActive: true } }),
    prisma.checkInOption.create({ data: { label: 'Det var svært', value: 'HARD', emoji: '😓', position: 3, isActive: true } }),
    prisma.checkInOption.create({ data: { label: 'Sprang over', value: 'SKIPPED', emoji: '⏭️', position: 4, isActive: true } }),
  ])

  // -- Dashboard Messages (5 states) --
  await Promise.all([
    prisma.dashboardMessage.create({ data: { stateKey: 'new_user', heading: 'Velkommen til FamilyMind!', body: 'Vi har fundet nogle anbefalinger til dig baseret på din profil.', ctaLabel: 'Se anbefalinger', ctaUrl: '/browse' } }),
    prisma.dashboardMessage.create({ data: { stateKey: 'active_journey', heading: 'Fortsæt din rejse', body: 'Du er godt på vej. Fortsæt hvor du slap.', ctaLabel: 'Fortsæt', ctaUrl: '/dashboard' } }),
    prisma.dashboardMessage.create({ data: { stateKey: 'active_journey_plus_courses', heading: 'Din dag venter', body: 'Fortsæt din rejse og dine kurser nedenfor.', ctaLabel: 'Fortsæt', ctaUrl: '/dashboard' } }),
    prisma.dashboardMessage.create({ data: { stateKey: 'no_journey_has_courses', heading: 'Klar til en rejse?', body: 'Du følger kurser, men har du overvejet en struktureret rejse?', ctaLabel: 'Udforsk rejser', ctaUrl: '/browse' } }),
    prisma.dashboardMessage.create({ data: { stateKey: 'completed_journey', heading: 'Tillykke! 🎉', body: 'Du har gennemført din rejse. Klar til den næste?', ctaLabel: 'Find din næste rejse', ctaUrl: '/browse' } }),
  ])

  // -- Email Templates (all types) --
  const emailTemplates = await Promise.all([
    prisma.emailTemplate.create({ data: { templateKey: 'weekly_plan', subject: 'Din uge er klar, {{userName}}', bodyHtml: '<h1>Hej {{userName}}</h1><p>Din nye uge i {{journeyTitle}} er klar. Log ind og se hvad der venter dig.</p>', description: 'Sent weekly when a new journey week is ready' } }),
    prisma.emailTemplate.create({ data: { templateKey: 'midweek_nudge', subject: 'Husk din rejse, {{userName}}', bodyHtml: '<h1>Hej {{userName}}</h1><p>Du har ikke åbnet dit indhold endnu i denne uge. Tag et kig?</p>', description: 'Sent mid-week if user has not opened content' } }),
    prisma.emailTemplate.create({ data: { templateKey: 'reflection', subject: 'Tid til refleksion', bodyHtml: '<h1>Hej {{userName}}</h1><p>Du har set dit indhold — nu er det tid til at reflektere. Hvordan gik det?</p>', description: 'Sent if user consumed content but has not checked in' } }),
    prisma.emailTemplate.create({ data: { templateKey: 'monthly_progress', subject: 'Din månedlige fremgang', bodyHtml: '<h1>Hej {{userName}}</h1><p>Her er din fremgang denne måned i FamilyMind.</p>', description: 'Monthly progress summary' } }),
    prisma.emailTemplate.create({ data: { templateKey: 'reengagement_tier1', subject: 'Vi savner dig, {{userName}}', bodyHtml: '<h1>Hej {{userName}}</h1><p>Det er et stykke tid siden vi har set dig. Hvad med at tage et hurtigt kig?</p>', description: 'Re-engagement tier 1: gentle reminder' } }),
    prisma.emailTemplate.create({ data: { templateKey: 'reengagement_tier2', subject: 'Din rejse venter stadig', bodyHtml: '<h1>Hej {{userName}}</h1><p>Din rejse i {{journeyTitle}} venter stadig på dig. Hop ind igen?</p>', description: 'Re-engagement tier 2: journey reminder' } }),
    prisma.emailTemplate.create({ data: { templateKey: 'reengagement_tier3', subject: 'Nyt indhold du måske har misset', bodyHtml: '<h1>Hej {{userName}}</h1><p>Der er kommet nyt indhold siden sidst. Se hvad der er nyt.</p>', description: 'Re-engagement tier 3: new content highlight' } }),
    prisma.emailTemplate.create({ data: { templateKey: 'reengagement_tier4', subject: 'Vi holder din plads', bodyHtml: '<h1>Hej {{userName}}</h1><p>Dit abonnement er stadig aktivt. Vi holder din plads klar, når du er klar til at vende tilbage.</p>', description: 'Re-engagement tier 4: final gentle nudge' } }),
    prisma.emailTemplate.create({ data: { templateKey: 'community_reply', subject: '{{replierName}} svarede på dit indlæg', bodyHtml: '<h1>Hej {{userName}}</h1><p>{{replierName}} har svaret på dit indlæg:</p><blockquote>{{replySnippet}}</blockquote><p>Dit indlæg: "{{postSnippet}}"</p><p><a href="{{appUrl}}/dashboard">Se svaret</a></p>', description: 'Sent when someone replies to your discussion post' } }),
    prisma.emailTemplate.create({ data: { templateKey: 'community_digest', subject: 'Ugens nyt fra {{cohortName}}', bodyHtml: '<h1>Hej {{userName}}</h1><p>Her er hvad der er sket i din gruppe denne uge i {{journeyTitle}}:</p><ul><li>{{newPosts}} nye indlæg</li><li>{{newReplies}} svar</li><li>{{activeMembers}} aktive medlemmer</li></ul><p><a href="{{communityUrl}}">Gå til fællesskabet</a></p>', description: 'Weekly community activity digest' } }),
  ])

  // -- Notification Schedule --
  await Promise.all([
    prisma.notificationSchedule.create({ data: { notificationType: 'WEEKLY_PLAN', dayOfWeek: 1, timeOfDay: '08:00', isActive: true } }),
    prisma.notificationSchedule.create({ data: { notificationType: 'MIDWEEK_NUDGE', dayOfWeek: 3, timeOfDay: '18:00', isActive: true } }),
    prisma.notificationSchedule.create({ data: { notificationType: 'REFLECTION', dayOfWeek: 5, timeOfDay: '18:00', isActive: true } }),
    prisma.notificationSchedule.create({ data: { notificationType: 'MONTHLY_PROGRESS', dayOfWeek: 0, timeOfDay: '10:00', isActive: true } }),
  ])

  // -- Re-engagement Tiers --
  await Promise.all([
    prisma.reEngagementTier.create({ data: { tierNumber: 1, daysInactiveMin: 7, daysInactiveMax: 14, emailTemplateId: emailTemplates[4].id, isActive: true } }),
    prisma.reEngagementTier.create({ data: { tierNumber: 2, daysInactiveMin: 15, daysInactiveMax: 30, emailTemplateId: emailTemplates[5].id, isActive: true } }),
    prisma.reEngagementTier.create({ data: { tierNumber: 3, daysInactiveMin: 31, daysInactiveMax: 60, emailTemplateId: emailTemplates[6].id, isActive: true } }),
    prisma.reEngagementTier.create({ data: { tierNumber: 4, daysInactiveMin: 61, daysInactiveMax: 90, emailTemplateId: emailTemplates[7].id, isActive: true } }),
  ])

  // -- Milestone Definitions --
  await Promise.all([
    prisma.milestoneDefinition.create({ data: { name: 'Første dag gennemført', triggerType: 'DAYS_ACTIVE', triggerValue: 1, celebrationTitle: 'Godt begyndt!', celebrationMessage: 'Du har gennemført din første dag. Fantastisk start!', isActive: true } }),
    prisma.milestoneDefinition.create({ data: { name: 'Første uge aktiv', triggerType: 'DAYS_ACTIVE', triggerValue: 7, celebrationTitle: 'En hel uge!', celebrationMessage: 'Du har været aktiv i en hel uge. Stærkt arbejde!', isActive: true } }),
    prisma.milestoneDefinition.create({ data: { name: 'Fase gennemført', triggerType: 'PHASE_COMPLETE', triggerValue: 1, celebrationTitle: 'Fase klaret!', celebrationMessage: 'Du har gennemført en hel fase i din rejse. Imponerende!', isActive: true } }),
    prisma.milestoneDefinition.create({ data: { name: 'Rejse gennemført', triggerType: 'JOURNEY_COMPLETE', triggerValue: 1, celebrationTitle: 'Tillykke! 🎉', celebrationMessage: 'Du har gennemført hele din rejse. Du er fantastisk!', isActive: true } }),
    prisma.milestoneDefinition.create({ data: { name: '10 indhold gennemført', triggerType: 'CONTENT_COUNT', triggerValue: 10, celebrationTitle: 'Dedikeret lærende!', celebrationMessage: 'Du har gennemført 10 stykker indhold. Fortsæt det gode arbejde!', isActive: true } }),
  ])

  // -- Onboarding Questions --
  const q1 = await prisma.onboardingQuestion.create({
    data: { questionText: 'Hvad er dit barns alder?', questionType: 'SLIDER', position: 1, isActive: true, helperText: 'Vælg den alder der bedst matcher dit barn' }
  })
  const q2 = await prisma.onboardingQuestion.create({
    data: { questionText: 'Hvad er din største udfordring lige nu?', questionType: 'SINGLE_SELECT', position: 2, isActive: true, helperText: 'Vælg den der fylder mest' }
  })
  const q3 = await prisma.onboardingQuestion.create({
    data: { questionText: 'Hvilke emner interesserer dig?', questionType: 'MULTI_SELECT', position: 3, isActive: true, helperText: 'Vælg alle der er relevante' }
  })
  const q4 = await prisma.onboardingQuestion.create({
    data: { questionText: 'Hvornår har du mest tid til at lære?', questionType: 'SINGLE_SELECT', position: 4, isActive: true }
  })
  const q5 = await prisma.onboardingQuestion.create({
    data: { questionText: 'Hvad er dit mål med FamilyMind?', questionType: 'SINGLE_SELECT', position: 5, isActive: true }
  })

  // Create some tags first for mapping
  const tagSleep = await prisma.contentTag.create({ data: { name: 'Søvn', slug: 'sovn' } })
  const tagBoundaries = await prisma.contentTag.create({ data: { name: 'Grænser', slug: 'graenser' } })
  const tagEmotions = await prisma.contentTag.create({ data: { name: 'Følelser', slug: 'folelser' } })
  const tagCommunication = await prisma.contentTag.create({ data: { name: 'Kommunikation', slug: 'kommunikation' } })
  const tagSelfCare = await prisma.contentTag.create({ data: { name: 'Selvpleje', slug: 'selvpleje' } })

  // Q2 options (challenges, mapped to tags)
  await Promise.all([
    prisma.onboardingOption.create({ data: { questionId: q2.id, label: 'Søvn og sengetid', value: 'sleep', tagId: tagSleep.id, position: 1 } }),
    prisma.onboardingOption.create({ data: { questionId: q2.id, label: 'Grænser og konflikter', value: 'boundaries', tagId: tagBoundaries.id, position: 2 } }),
    prisma.onboardingOption.create({ data: { questionId: q2.id, label: 'Følelsesregulering', value: 'emotions', tagId: tagEmotions.id, position: 3 } }),
    prisma.onboardingOption.create({ data: { questionId: q2.id, label: 'Kommunikation', value: 'communication', tagId: tagCommunication.id, position: 4 } }),
  ])

  // Q3 options (interests)
  await Promise.all([
    prisma.onboardingOption.create({ data: { questionId: q3.id, label: 'Søvn', value: 'sleep', tagId: tagSleep.id, position: 1 } }),
    prisma.onboardingOption.create({ data: { questionId: q3.id, label: 'Grænser', value: 'boundaries', tagId: tagBoundaries.id, position: 2 } }),
    prisma.onboardingOption.create({ data: { questionId: q3.id, label: 'Følelser', value: 'emotions', tagId: tagEmotions.id, position: 3 } }),
    prisma.onboardingOption.create({ data: { questionId: q3.id, label: 'Kommunikation', value: 'communication', tagId: tagCommunication.id, position: 4 } }),
    prisma.onboardingOption.create({ data: { questionId: q3.id, label: 'Selvpleje som forælder', value: 'selfcare', tagId: tagSelfCare.id, position: 5 } }),
  ])

  // Q4 options (time preferences)
  await Promise.all([
    prisma.onboardingOption.create({ data: { questionId: q4.id, label: 'Om morgenen', value: 'morning', position: 1 } }),
    prisma.onboardingOption.create({ data: { questionId: q4.id, label: 'I frokostpausen', value: 'lunch', position: 2 } }),
    prisma.onboardingOption.create({ data: { questionId: q4.id, label: 'Om aftenen', value: 'evening', position: 3 } }),
    prisma.onboardingOption.create({ data: { questionId: q4.id, label: 'I weekenden', value: 'weekend', position: 4 } }),
  ])

  // Q5 options (goals)
  await Promise.all([
    prisma.onboardingOption.create({ data: { questionId: q5.id, label: 'Bedre dagligdag', value: 'daily_life', position: 1 } }),
    prisma.onboardingOption.create({ data: { questionId: q5.id, label: 'Forstå mit barn bedre', value: 'understand_child', position: 2 } }),
    prisma.onboardingOption.create({ data: { questionId: q5.id, label: 'Håndtere konflikter', value: 'handle_conflicts', position: 3 } }),
    prisma.onboardingOption.create({ data: { questionId: q5.id, label: 'Mere ro i familien', value: 'family_peace', position: 4 } }),
  ])

  // -- Site Settings --
  await Promise.all([
    prisma.siteSetting.create({ data: { key: 'subscription_price_dkk', value: '149', description: 'Monthly subscription price in DKK' } }),
    prisma.siteSetting.create({ data: { key: 'notification_max_per_week', value: '3', description: 'Maximum notifications per user per week' } }),
  ])

  // -- Test Journey --
  const journey = await prisma.journey.create({
    data: {
      title: 'Bedre søvnrutiner',
      description: 'En struktureret rejse mod bedre søvn for hele familien. Lær teknikker og opbyg gode vaner dag for dag.',
      slug: 'bedre-sovnrutiner',
      targetAgeMin: 6,   // 6 months
      targetAgeMax: 72,  // 6 years
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
  const day1 = await prisma.journeyDay.create({
    data: { phaseId: phase1.id, title: 'Forstå søvnbehov', position: 1 },
  })
  await prisma.journeyDayAction.create({
    data: { dayId: day1.id, actionText: 'Observer dit barns søvnsignaler i dag', reflectionPrompt: 'Hvilke signaler lagde du mærke til?' },
  })

  const day2 = await prisma.journeyDay.create({
    data: { phaseId: phase1.id, title: 'Aftenrutinen', position: 2 },
  })
  await prisma.journeyDayAction.create({
    data: { dayId: day2.id, actionText: 'Skriv jeres nuværende aftenrutine ned', reflectionPrompt: 'Hvad fungerer godt, og hvad kunne forbedres?' },
  })

  const day3 = await prisma.journeyDay.create({
    data: { phaseId: phase1.id, title: 'Søvnmiljøet', position: 3 },
  })
  await prisma.journeyDayAction.create({
    data: { dayId: day3.id, actionText: 'Gennemgå dit barns soveværelse — er det mørkt, stille og køligt?', reflectionPrompt: 'Hvad ændrede du ved søvnmiljøet?' },
  })

  // Phase 2 days
  const day4 = await prisma.journeyDay.create({
    data: { phaseId: phase2.id, title: 'Den nye rutine', position: 1 },
  })
  await prisma.journeyDayAction.create({
    data: { dayId: day4.id, actionText: 'Implementer den nye aftenrutine i aften', reflectionPrompt: 'Hvordan reagerede dit barn på den nye rutine?' },
  })

  const day5 = await prisma.journeyDay.create({
    data: { phaseId: phase2.id, title: 'Håndter modstand', position: 2 },
  })
  await prisma.journeyDayAction.create({
    data: { dayId: day5.id, actionText: 'Øv dig i rolig bekræftelse når dit barn protesterer', reflectionPrompt: 'Hvilken teknik virkede bedst?' },
  })

  const day6 = await prisma.journeyDay.create({
    data: { phaseId: phase2.id, title: 'Fasthold rutinen', position: 3 },
  })
  await prisma.journeyDayAction.create({
    data: { dayId: day6.id, actionText: 'Fortsæt rutinen og bemærk fremskridt', reflectionPrompt: 'Hvad har ændret sig siden dag 1?' },
  })

  // Add a recommendation rule for this journey
  await prisma.recommendationRule.create({
    data: {
      name: 'Søvnudfordringer → Søvnrejse',
      conditions: { tagId: tagSleep.id },
      targetType: 'JOURNEY',
      targetId: journey.id,
      priority: 10,
      isActive: true,
    },
  })

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
