import { prisma } from '@/lib/prisma'
import { INACTIVE_THRESHOLD_MS } from '@/lib/compute-user-status'

type Period = '7d' | '30d' | '90d' | '12m'

function periodToDate(period: Period): Date {
  const now = new Date()
  switch (period) {
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '12m': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  }
}

function previousPeriodDate(period: Period): { from: Date; to: Date } {
  const now = new Date()
  const currentFrom = periodToDate(period)
  const durationMs = now.getTime() - currentFrom.getTime()
  return {
    from: new Date(currentFrom.getTime() - durationMs),
    to: currentFrom,
  }
}

const ACTIVE_THRESHOLD_MS = INACTIVE_THRESHOLD_MS

// ─── Overview ────────────────────────────────────────

export async function getOverviewStats(orgId: string, period: Period) {
  const since = periodToDate(period)
  const prev = previousPeriodDate(period)
  const now = new Date()
  const activeThreshold = new Date(now.getTime() - ACTIVE_THRESHOLD_MS)

  const orgFilter = { organizationId: orgId }

  // Active members (lastActiveAt within 14 days)
  const [activeNow, activePrev] = await Promise.all([
    prisma.user.count({ where: { ...orgFilter, lastActiveAt: { gte: activeThreshold } } }),
    prisma.user.count({ where: { ...orgFilter, lastActiveAt: { gte: new Date(prev.to.getTime() - ACTIVE_THRESHOLD_MS), lt: prev.to } } }),
  ])

  // Churn: cancelled entitlements in period (by cancelledAt, not createdAt)
  const [churnedNow, churnedPrev, activeEntitlements, prevActiveEntitlements] = await Promise.all([
    prisma.entitlement.count({ where: { user: orgFilter, status: 'CANCELLED', cancelledAt: { gte: since } } }),
    prisma.entitlement.count({ where: { user: orgFilter, status: 'CANCELLED', cancelledAt: { gte: prev.from, lt: prev.to } } }),
    prisma.entitlement.count({ where: { user: orgFilter, status: 'ACTIVE' } }),
    // Forrige periodes aktive ≈ nuværende aktive + opsagte i denne periode
    prisma.entitlement.count({ where: { user: orgFilter, OR: [{ status: 'ACTIVE' }, { status: 'CANCELLED', cancelledAt: { gte: since } }] } }),
  ])
  const churnRate = activeEntitlements + churnedNow > 0
    ? Math.round((churnedNow / (activeEntitlements + churnedNow)) * 100)
    : 0
  const prevChurnRate = prevActiveEntitlements > 0
    ? Math.round((churnedPrev / prevActiveEntitlements) * 100)
    : 0

  // MRR
  const subscriptionEntitlements = await prisma.entitlement.findMany({
    where: { user: orgFilter, status: 'ACTIVE', stripeSubscriptionId: { not: null } },
  })
  const mrr = subscriptionEntitlements.reduce((sum, e) => sum + (e.paidAmountCents ?? 0), 0)

  // Onboarding rate
  const [newSignups, onboarded] = await Promise.all([
    prisma.user.count({ where: { ...orgFilter, createdAt: { gte: since } } }),
    prisma.user.count({ where: { ...orgFilter, createdAt: { gte: since }, onboardingCompleted: true } }),
  ])
  const onboardingRate = newSignups > 0 ? Math.round((onboarded / newSignups) * 100) : 0

  // Funnel
  const totalSignups = newSignups
  const totalOnboarded = onboarded
  const withPurchase = await prisma.user.count({
    where: {
      ...orgFilter,
      createdAt: { gte: since },
      entitlements: { some: {} },
    },
  })
  const activeAfterPurchase = await prisma.user.count({
    where: {
      ...orgFilter,
      createdAt: { gte: since },
      entitlements: { some: {} },
      lastActiveAt: { gte: activeThreshold },
    },
  })
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const retained30d = await prisma.user.count({
    where: {
      ...orgFilter,
      createdAt: { gte: since, lt: thirtyDaysAgo },
      entitlements: { some: {} },
      lastActiveAt: { gte: activeThreshold },
    },
  })
  const eligibleFor30d = await prisma.user.count({
    where: {
      ...orgFilter,
      createdAt: { gte: since, lt: thirtyDaysAgo },
      entitlements: { some: {} },
    },
  })

  return {
    activeMembers: { current: activeNow, previous: activePrev },
    churnRate: { current: churnRate, previous: prevChurnRate },
    mrr: { current: mrr },
    onboardingRate: { current: onboardingRate, newSignups },
    funnel: {
      signup: totalSignups,
      onboarded: totalOnboarded,
      purchased: withPurchase,
      active: activeAfterPurchase,
      retained30d,
      eligibleFor30d,
    },
  }
}

// ─── Health ──────────────────────────────────────────

export async function getHealthStats(orgId: string, period: Period) {
  const since = periodToDate(period)
  const now = new Date()
  const activeThreshold = new Date(now.getTime() - ACTIVE_THRESHOLD_MS)
  const orgFilter = { organizationId: orgId }

  // Status distribution
  const users = await prisma.user.findMany({
    where: orgFilter,
    select: {
      lastActiveAt: true,
      entitlements: { where: { status: 'ACTIVE' }, select: { status: true, expiresAt: true } },
      _count: { select: { entitlements: true } },
    },
  })

  const distribution = { trial: 0, active: 0, inactive: 0, churned: 0 }
  for (const u of users) {
    const hasActive = u.entitlements.some(e =>
      e.status === 'ACTIVE' && (!e.expiresAt || e.expiresAt > now)
    )
    if (!hasActive) {
      distribution[u._count.entitlements > 0 ? 'churned' : 'trial']++
    } else {
      const lastActive = u.lastActiveAt ? new Date(u.lastActiveAt as unknown as string) : null
      distribution[lastActive && lastActive >= activeThreshold ? 'active' : 'inactive']++
    }
  }

  // Churn trend: per week/month (by cancelledAt)
  const cancelledEntitlements = await prisma.entitlement.findMany({
    where: { user: orgFilter, status: 'CANCELLED', cancelledAt: { gte: since } },
    select: { cancelledAt: true },
  })

  const churnByWeek = new Map<string, number>()
  for (const e of cancelledEntitlements) {
    const d = new Date(e.cancelledAt!)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    churnByWeek.set(key, (churnByWeek.get(key) ?? 0) + 1)
  }
  const churnTrend = Array.from(churnByWeek.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week))

  // Retention cohorts (by signup month)
  const cohortUsers = await prisma.user.findMany({
    where: { ...orgFilter, createdAt: { gte: since } },
    select: { createdAt: true, lastActiveAt: true },
  })

  const cohorts = new Map<string, { total: number; eligible: Record<string, number>; retainedAt: Record<string, number> }>()
  for (const u of cohortUsers) {
    const monthKey = u.createdAt.toISOString().slice(0, 7)
    if (!cohorts.has(monthKey)) {
      cohorts.set(monthKey, { total: 0, eligible: { '7': 0, '14': 0, '30': 0, '60': 0, '90': 0 }, retainedAt: { '7': 0, '14': 0, '30': 0, '60': 0, '90': 0 } })
    }
    const cohort = cohorts.get(monthKey)!
    cohort.total++

    const signupTime = u.createdAt.getTime()
    const daysSinceSignup = Math.floor((now.getTime() - signupTime) / (24 * 60 * 60 * 1000))

    for (const day of [7, 14, 30, 60, 90]) {
      if (daysSinceSignup < day) continue
      cohort.eligible[String(day)]++
      if (u.lastActiveAt) {
        const lastActiveTime = new Date(u.lastActiveAt).getTime()
        const checkpointTime = signupTime + day * 24 * 60 * 60 * 1000
        if (lastActiveTime >= checkpointTime) cohort.retainedAt[String(day)]++
      }
    }
  }
  const retentionCohorts = Array.from(cohorts.entries()).map(([month, data]) => ({
    month,
    total: data.total,
    ...Object.fromEntries(
      Object.entries(data.retainedAt).map(([day, count]) => {
        const eligible = data.eligible[day] ?? 0
        return [`day${day}`, eligible > 0 ? Math.round((count / eligible) * 100) : 0]
      })
    ),
  }))

  // Leakage report
  const neverOnboarded = await prisma.user.count({
    where: { ...orgFilter, onboardingCompleted: false, createdAt: { gte: since } },
  })
  const onboardedNoPurchase = await prisma.user.count({
    where: {
      ...orgFilter,
      onboardingCompleted: true,
      createdAt: { gte: since },
      entitlements: { none: {} },
    },
  })
  const purchasedNoEngagement = await prisma.user.count({
    where: {
      ...orgFilter,
      entitlements: { some: { status: 'ACTIVE' } },
      contentProgress: { none: {} },
    },
  })
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
  const decliningEngagement = await prisma.user.count({
    where: {
      ...orgFilter,
      entitlements: { some: { status: 'ACTIVE' } },
      contentProgress: { some: {} },
      lastActiveAt: { lt: tenDaysAgo },
    },
  })

  return {
    distribution,
    churnTrend,
    retentionCohorts,
    leakage: {
      neverOnboarded,
      onboardedNoPurchase,
      purchasedNoEngagement,
      decliningEngagement,
    },
  }
}

// ─── Conversion ──────��───────────────────────────────

export async function getConversionStats(orgId: string, period: Period) {
  const since = periodToDate(period)
  const now = new Date()
  const activeThreshold = new Date(now.getTime() - ACTIVE_THRESHOLD_MS)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const orgFilter = { organizationId: orgId }

  // Funnel counts
  const signup = await prisma.user.count({ where: { ...orgFilter, createdAt: { gte: since } } })
  const onboarded = await prisma.user.count({ where: { ...orgFilter, createdAt: { gte: since }, onboardingCompleted: true } })
  const purchased = await prisma.user.count({
    where: { ...orgFilter, createdAt: { gte: since }, entitlements: { some: {} } },
  })
  const activeAfterPurchase = await prisma.user.count({
    where: { ...orgFilter, createdAt: { gte: since }, entitlements: { some: {} }, lastActiveAt: { gte: activeThreshold } },
  })
  const eligibleFor30d = await prisma.user.count({
    where: { ...orgFilter, createdAt: { gte: since, lt: thirtyDaysAgo }, entitlements: { some: {} } },
  })
  const retained30d = await prisma.user.count({
    where: { ...orgFilter, createdAt: { gte: since, lt: thirtyDaysAgo }, entitlements: { some: {} }, lastActiveAt: { gte: activeThreshold } },
  })

  // Conversion rate over time (signup → purchase by week)
  const weeklyUsers = await prisma.user.findMany({
    where: { ...orgFilter, createdAt: { gte: since } },
    select: { createdAt: true, entitlements: { select: { id: true }, take: 1 } },
  })
  const rateByWeek = new Map<string, { signups: number; purchased: number }>()
  for (const u of weeklyUsers) {
    const d = new Date(u.createdAt)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    if (!rateByWeek.has(key)) rateByWeek.set(key, { signups: 0, purchased: 0 })
    const w = rateByWeek.get(key)!
    w.signups++
    if (u.entitlements.length > 0) w.purchased++
  }
  const conversionOverTime = Array.from(rateByWeek.entries())
    .map(([week, data]) => ({
      week,
      rate: data.signups > 0 ? Math.round((data.purchased / data.signups) * 100) : 0,
    }))
    .sort((a, b) => a.week.localeCompare(b.week))

  // Time to conversion (median days)
  const usersWithOnboarding = await prisma.user.findMany({
    where: { ...orgFilter, createdAt: { gte: since }, onboardingCompleted: true },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  // For profiles with completedAt
  const profiles = await prisma.userProfile.findMany({
    where: { user: orgFilter, completedAt: { not: null } },
    select: { completedAt: true, user: { select: { createdAt: true } } },
  })
  const onboardingDays = profiles
    .filter(p => p.completedAt)
    .map(p => Math.floor((p.completedAt!.getTime() - p.user.createdAt.getTime()) / (24 * 60 * 60 * 1000)))
    .sort((a, b) => a - b)
  const medianOnboardingDays = onboardingDays.length > 0
    ? onboardingDays[Math.floor(onboardingDays.length / 2)]
    : null

  const usersWithPurchase = await prisma.user.findMany({
    where: { ...orgFilter, createdAt: { gte: since }, entitlements: { some: {} } },
    select: { createdAt: true, entitlements: { select: { createdAt: true }, orderBy: { createdAt: 'asc' }, take: 1 } },
  })
  const purchaseDays = usersWithPurchase
    .filter(u => u.entitlements.length > 0)
    .map(u => Math.floor((u.entitlements[0].createdAt.getTime() - u.createdAt.getTime()) / (24 * 60 * 60 * 1000)))
    .sort((a, b) => a - b)
  const medianPurchaseDays = purchaseDays.length > 0
    ? purchaseDays[Math.floor(purchaseDays.length / 2)]
    : null

  return {
    funnel: { signup, onboarded, purchased, active: activeAfterPurchase, retained30d, eligibleFor30d },
    conversionOverTime,
    timeToConversion: {
      onboardingDays: medianOnboardingDays,
      purchaseDays: medianPurchaseDays,
    },
  }
}

// ─── Economy ─────────────────────────────────────────

export async function getEconomyStats(orgId: string, period: Period) {
  const since = periodToDate(period)
  const orgFilter = orgId ? { user: { organizationId: orgId } } : {}

  // Active subscription entitlements (recurring) — current MRR
  const activeSubscriptions = await prisma.entitlement.findMany({
    where: {
      ...orgFilter,
      status: 'ACTIVE',
      source: 'SUBSCRIPTION',
      stripeSubscriptionId: { not: null },
    },
    select: { paidAmountCents: true },
  })
  const currentMrr = activeSubscriptions.reduce((sum, e) => sum + (e.paidAmountCents ?? 0), 0)

  // New subscriptions in period
  const newSubscriptions = await prisma.entitlement.findMany({
    where: {
      ...orgFilter,
      source: 'SUBSCRIPTION',
      createdAt: { gte: since },
    },
    select: { paidAmountCents: true },
  })
  const newMrr = newSubscriptions.reduce((sum, e) => sum + (e.paidAmountCents ?? 0), 0)

  // Cancelled in period
  const cancelledSubscriptions = await prisma.entitlement.findMany({
    where: {
      ...orgFilter,
      source: 'SUBSCRIPTION',
      status: 'CANCELLED',
      cancelledAt: { gte: since },
    },
    select: { paidAmountCents: true },
  })
  const lostMrr = cancelledSubscriptions.reduce((sum, e) => sum + (e.paidAmountCents ?? 0), 0)

  // Revenue per course
  const courseRevenue = await prisma.entitlement.groupBy({
    by: ['courseId'],
    where: { ...orgFilter, courseId: { not: null }, paidAmountCents: { not: null } },
    _sum: { paidAmountCents: true },
  })
  const courseIds = courseRevenue.map((r) => r.courseId).filter((id): id is string => id !== null)
  const courses = courseIds.length > 0
    ? await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, title: true },
      })
    : []
  const courseTitleById = new Map(courses.map((c) => [c.id, c.title]))

  // Revenue per bundle
  const bundleRevenue = await prisma.entitlement.groupBy({
    by: ['bundleId'],
    where: { ...orgFilter, bundleId: { not: null }, paidAmountCents: { not: null } },
    _sum: { paidAmountCents: true },
  })
  const bundleIds = bundleRevenue.map((r) => r.bundleId).filter((id): id is string => id !== null)
  const bundles = bundleIds.length > 0
    ? await prisma.bundle.findMany({
        where: { id: { in: bundleIds } },
        select: { id: true, title: true },
      })
    : []
  const bundleTitleById = new Map(bundles.map((b) => [b.id, b.title]))

  const revenuePerProduct = [
    ...courseRevenue.map((r) => ({
      title: `Kursus: ${courseTitleById.get(r.courseId!) ?? 'Ukendt'}`,
      revenue: r._sum.paidAmountCents ?? 0,
    })),
    ...bundleRevenue.map((r) => ({
      title: `Bundel: ${bundleTitleById.get(r.bundleId!) ?? 'Ukendt'}`,
      revenue: r._sum.paidAmountCents ?? 0,
    })),
  ].sort((a, b) => b.revenue - a.revenue)

  return {
    mrr: { current: currentMrr, new: newMrr, lost: lostMrr, net: newMrr - lostMrr },
    mrrTrend: [] as Array<{ week: string; total: number }>,
    revenuePerProduct,
    keyMetrics: { avgLtv: 0, medianLifetimeDays: null as number | null, revenuePerUser: 0 },
  }
}

/* LEGACY DISABLED — PR 2/3 will reimplement
async function _disabledLegacy() {
  const since = new Date()
  const now = new Date()
  const orgFilter = {}

  // New MRR (new subscriptions in period)
  const newSubscriptions = await prisma.entitlement.findMany({
    where: { user: orgFilter, status: 'ACTIVE', stripeSubscriptionId: { not: null }, createdAt: { gte: since } },
    include: { product: { select: { priceAmountCents: true } } },
  })
  const newMrr = newSubscriptions.reduce((sum, e) => sum + (e.paidAmountCents ?? e.product.priceAmountCents), 0)

  // Lost MRR (cancelled in period, by cancelledAt)
  const cancelledSubscriptions = await prisma.entitlement.findMany({
    where: { user: orgFilter, status: 'CANCELLED', stripeSubscriptionId: { not: null }, cancelledAt: { gte: since } },
    include: { product: { select: { priceAmountCents: true } } },
  })
  const lostMrr = cancelledSubscriptions.reduce((sum, e) => sum + (e.paidAmountCents ?? e.product.priceAmountCents), 0)

  // Revenue by product
  const allEntitlements = await prisma.entitlement.findMany({
    where: { user: orgFilter, createdAt: { gte: since } },
    include: { product: { select: { id: true, title: true, priceAmountCents: true } } },
  })
  const revenueByProduct = new Map<string, { title: string; revenue: number }>()
  for (const e of allEntitlements) {
    const existing = revenueByProduct.get(e.product.id) ?? { title: e.product.title, revenue: 0 }
    existing.revenue += e.paidAmountCents ?? e.product.priceAmountCents
    revenueByProduct.set(e.product.id, existing)
  }
  const revenuePerProduct = Array.from(revenueByProduct.values())
    .sort((a, b) => b.revenue - a.revenue)

  // MRR trend — løbende total per uge
  // Hent alle subscriptions (inkl. før perioden for baseline)
  const allSubs = await prisma.entitlement.findMany({
    where: { user: orgFilter, stripeSubscriptionId: { not: null } },
    select: { createdAt: true, cancelledAt: true, status: true, paidAmountCents: true, product: { select: { priceAmountCents: true } } },
  })

  // Byg events: +MRR ved oprettelse, -MRR ved opsigelse
  const events: Array<{ date: Date; amount: number }> = []
  for (const e of allSubs) {
    const paid = e.paidAmountCents ?? e.product.priceAmountCents
    events.push({ date: e.createdAt, amount: paid })
    if (e.cancelledAt) {
      events.push({ date: e.cancelledAt, amount: -paid })
    }
  }
  events.sort((a, b) => a.date.getTime() - b.date.getTime())

  // Beregn kumulativ MRR per uge inden for perioden
  const weeklyMrr = new Map<string, number>()
  let runningMrr = 0
  let eventIdx = 0

  // Generer uger i perioden
  const periodStart = since.getTime()
  const periodEnd = now.getTime()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  for (let t = periodStart; t <= periodEnd; t += weekMs) {
    const weekDate = new Date(t)
    // Anvend alle events op til denne uge
    while (eventIdx < events.length && events[eventIdx].date.getTime() <= t) {
      runningMrr += events[eventIdx].amount
      eventIdx++
    }
    const key = weekDate.toISOString().slice(0, 10)
    weeklyMrr.set(key, runningMrr)
  }
  const mrrTrend = Array.from(weeklyMrr.entries())
    .map(([week, total]) => ({ week, total }))
    .sort((a, b) => a.week.localeCompare(b.week))

  // Key metrics
  const totalPayingUsers = await prisma.user.count({
    where: { ...orgFilter, entitlements: { some: {} } },
  })
  const totalRevenue = await prisma.entitlement.findMany({
    where: { user: orgFilter },
    include: { product: { select: { priceAmountCents: true } } },
  })
  const totalRevenueAmount = totalRevenue.reduce((sum, e) => sum + (e.paidAmountCents ?? e.product.priceAmountCents), 0)
  const avgLtv = totalPayingUsers > 0 ? Math.round(totalRevenueAmount / totalPayingUsers) : 0

  const activeUsers = await prisma.user.count({
    where: { ...orgFilter, lastActiveAt: { gte: new Date(Date.now() - ACTIVE_THRESHOLD_MS) } },
  })
  const revenuePerUser = activeUsers > 0 ? Math.round(mrr / activeUsers) : 0

  // Average lifetime (median days from entitlement creation to cancellation)
  const churnedEntitlements = await prisma.entitlement.findMany({
    where: { user: orgFilter, status: 'CANCELLED', cancelledAt: { not: null } },
    select: { createdAt: true, cancelledAt: true },
  })
  const lifetimeDays = churnedEntitlements
    .map(e => Math.floor((e.cancelledAt!.getTime() - e.createdAt.getTime()) / (24 * 60 * 60 * 1000)))
    .sort((a, b) => a - b)
  const medianLifetime = lifetimeDays.length > 0
    ? lifetimeDays[Math.floor(lifetimeDays.length / 2)]
    : null

  return {
    mrr: { current: mrr, new: newMrr, lost: lostMrr, net: newMrr - lostMrr },
    mrrTrend,
    revenuePerProduct,
    keyMetrics: {
      avgLtv,
      medianLifetimeDays: medianLifetime,
      revenuePerUser,
    },
  }
}
*/

// ─── Behavior ────────────────────────────────────────

export async function getBehaviorStats(orgId: string, period: Period) {
  const since = periodToDate(period)
  const orgFilter = { organizationId: orgId }

  // Top content
  const topContent = await prisma.userContentProgress.groupBy({
    by: ['contentUnitId'],
    where: { user: orgFilter, completedAt: { not: null, gte: since } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  })
  const contentIds = topContent.map(c => c.contentUnitId)
  const contentUnits = contentIds.length > 0
    ? await prisma.contentUnit.findMany({
        where: { id: { in: contentIds } },
        select: { id: true, title: true, mediaType: true },
      })
    : []
  const contentMap = new Map(contentUnits.map(c => [c.id, c]))

  // Total starts per content for completion rate
  const totalStarts = contentIds.length > 0
    ? await prisma.userContentProgress.groupBy({
        by: ['contentUnitId'],
        where: { user: orgFilter, contentUnitId: { in: contentIds } },
        _count: { id: true },
      })
    : []
  const startsMap = new Map(totalStarts.map(s => [s.contentUnitId, s._count.id]))

  const popularContent = topContent.map(c => {
    const unit = contentMap.get(c.contentUnitId)
    const starts = startsMap.get(c.contentUnitId) ?? 0
    return {
      title: unit?.title ?? 'Ukendt',
      type: unit?.mediaType ?? 'VIDEO',
      completed: c._count.id,
      completionRate: starts > 0 ? Math.round((c._count.id / starts) * 100) : 0,
    }
  })

  // Single query for activity, tags, and engagement (avoid 3 separate unbounded queries)
  const allProgress = await prisma.userContentProgress.findMany({
    where: { user: orgFilter, createdAt: { gte: since } },
    select: {
      userId: true,
      createdAt: true,
      contentUnit: { select: { tags: { select: { tag: { select: { id: true, name: true } } } } } },
    },
    take: 10000, // Safety limit
  })

  // Activity by hour (dansk tid — Europe/Copenhagen)
  const hourCounts = new Array(24).fill(0)
  for (const p of allProgress) {
    const dkHour = parseInt(p.createdAt.toLocaleString('da-DK', { timeZone: 'Europe/Copenhagen', hour: '2-digit', hour12: false }), 10)
    hourCounts[dkHour]++
  }
  const activityByHour = hourCounts.map((count, hour) => ({ hour, count }))

  // Popular tags
  const tagCounts = new Map<string, { name: string; count: number }>()
  for (const p of allProgress) {
    for (const t of p.contentUnit.tags) {
      const existing = tagCounts.get(t.tag.id) ?? { name: t.tag.name, count: 0 }
      existing.count++
      tagCounts.set(t.tag.id, existing)
    }
  }
  const popularTags = Array.from(tagCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Engagement trend (avg interactions per user per week)
  const weeklyInteractions = new Map<string, Set<string>>()
  const weeklyTotals = new Map<string, number>()
  for (const p of allProgress) {
    const d = new Date(p.createdAt)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    if (!weeklyInteractions.has(key)) weeklyInteractions.set(key, new Set())
    weeklyInteractions.get(key)!.add(p.userId)
    weeklyTotals.set(key, (weeklyTotals.get(key) ?? 0) + 1)
  }
  const engagementTrend = Array.from(weeklyInteractions.entries())
    .map(([week, users]) => ({
      week,
      avgPerUser: users.size > 0 ? Math.round((weeklyTotals.get(week)! / users.size) * 10) / 10 : 0,
    }))
    .sort((a, b) => a.week.localeCompare(b.week))

  // Community activity
  const [newPosts, newReplies] = await Promise.all([
    prisma.discussionPost.count({ where: { organizationId: orgId, createdAt: { gte: since } } }),
    prisma.discussionReply.count({ where: { post: { organizationId: orgId }, createdAt: { gte: since } } }),
  ])
  const topRooms = await prisma.discussionPost.groupBy({
    by: ['roomId'],
    where: { organizationId: orgId, roomId: { not: null }, createdAt: { gte: since } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 3,
  })
  const roomIds = topRooms.map(r => r.roomId).filter((id): id is string => id !== null)
  const rooms = roomIds.length > 0
    ? await prisma.communityRoom.findMany({ where: { id: { in: roomIds } }, select: { id: true, name: true } })
    : []
  const roomMap = new Map(rooms.map(r => [r.id, r.name]))

  return {
    popularContent,
    activityByHour,
    popularTags,
    engagementTrend,
    community: {
      newPosts,
      newReplies,
      topRooms: topRooms.map(r => ({
        name: roomMap.get(r.roomId!) ?? 'Ukendt',
        count: r._count.id,
      })),
    },
  }
}
