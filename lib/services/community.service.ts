import { prisma } from '@/lib/prisma'
import { getSiteSetting } from './settings.service'
import type { Prisma } from '@prisma/client'

const DEFAULT_COHORT_MAX_MEMBERS = 25

// --- Cohort Assignment ---

/**
 * Find an open cohort with available space for the given journey,
 * or create a new one. Uses the SiteSetting 'default_cohort_max_members'
 * to determine max size (defaults to 25).
 */
export async function findOrCreateCohort(
  journeyId: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma

  const maxMembersSetting = await getSiteSetting('default_cohort_max_members')
  const maxMembers = maxMembersSetting
    ? parseInt(maxMembersSetting, 10)
    : DEFAULT_COHORT_MAX_MEMBERS

  // Find an open cohort with space
  const openCohort = await client.cohort.findFirst({
    where: {
      journeyId,
      isOpen: true,
    },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (openCohort && openCohort._count.members < openCohort.maxMembers) {
    return openCohort
  }

  // Close any full cohort that was returned
  if (openCohort && openCohort._count.members >= openCohort.maxMembers) {
    await client.cohort.update({
      where: { id: openCohort.id },
      data: { isOpen: false },
    })
  }

  // Create a new cohort
  const cohortCount = await client.cohort.count({ where: { journeyId } })
  const newCohort = await client.cohort.create({
    data: {
      journeyId,
      maxMembers,
      name: `Kohorte ${cohortCount + 1}`,
      isOpen: true,
    },
    include: {
      _count: { select: { members: true } },
    },
  })

  return newCohort
}

/**
 * Assign a user to a cohort for a journey. Uses $transaction to ensure
 * atomicity when not already inside one.
 */
export async function assignUserToCohort(
  userId: string,
  journeyId: string,
  tx?: Prisma.TransactionClient
) {
  async function doAssign(client: Prisma.TransactionClient) {
    // Check if user is already in a cohort for this journey
    const existing = await client.cohortMember.findFirst({
      where: {
        userId,
        cohort: { journeyId },
      },
    })
    if (existing) return existing

    const cohort = await findOrCreateCohort(journeyId, client)

    return client.cohortMember.create({
      data: {
        cohortId: cohort.id,
        userId,
      },
    })
  }

  if (tx) {
    return doAssign(tx)
  }

  return prisma.$transaction(async (txClient) => {
    return doAssign(txClient)
  })
}

/**
 * Get the user's cohort for a specific journey.
 */
export async function getUserCohort(userId: string, journeyId: string) {
  return prisma.cohortMember.findFirst({
    where: {
      userId,
      cohort: { journeyId },
    },
    include: {
      cohort: {
        include: {
          journey: { select: { id: true, title: true, slug: true } },
          _count: { select: { members: true } },
        },
      },
    },
  })
}

/**
 * Get all members of a cohort with user names.
 */
export async function getCohortMembers(cohortId: string) {
  return prisma.cohortMember.findMany({
    where: { cohortId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })
}

// --- Admin Functions ---

/**
 * List cohorts with member counts. Optionally filter by journeyId.
 */
export async function listCohorts(journeyId?: string) {
  return prisma.cohort.findMany({
    where: journeyId ? { journeyId } : undefined,
    include: {
      journey: { select: { id: true, title: true, slug: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Update a cohort's settings (admin).
 */
export async function updateCohort(
  id: string,
  data: { name?: string; maxMembers?: number; isOpen?: boolean }
) {
  return prisma.cohort.update({
    where: { id },
    data,
  })
}

/**
 * Get a single cohort by ID with members and journey info.
 */
export async function getCohortById(id: string) {
  return prisma.cohort.findUnique({
    where: { id },
    include: {
      journey: { select: { id: true, title: true, slug: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { members: true } },
    },
  })
}
