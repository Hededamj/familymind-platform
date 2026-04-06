import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateProfileSchema } from '@/lib/validators/user'
import type { z } from 'zod'

type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// WHITE-LABEL TODO: Fase 2 — når multi-tenant aktiveres (hostname-baseret),
// skal denne funktion modtage tenantId fra request context i stedet for at
// bruge findFirst. Se tenant.service.ts for resolver-logik.
// Ændring: getOrCreateUser(supabaseUser, tenantId) → organizationId: tenantId
export async function getOrCreateUser(supabaseUser: {
  id: string
  email: string
  user_metadata?: { full_name?: string; name?: string }
}) {
  const existing = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  })

  if (existing) {
    // Tilknyt eksisterende brugere uden organisation til default org (Fase 1: single-tenant)
    if (!existing.organizationId) {
      const defaultOrg = await prisma.organization.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      })
      if (defaultOrg) {
        return prisma.user.update({
          where: { id: existing.id },
          data: { organizationId: defaultOrg.id },
        })
      }
    }
    return existing
  }

  // Fase 1: single-tenant — tilknyt til ældste org. Fase 2: brug tenantId.
  const defaultOrg = await prisma.organization.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  return prisma.user.create({
    data: {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name:
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        null,
      organizationId: defaultOrg?.id ?? null,
    },
  })
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileInput
) {
  const validated = updateProfileSchema.parse(data)
  return prisma.user.update({ where: { id: userId }, data: validated })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

/**
 * Slet en brugers konto permanent (GDPR).
 *
 * 1. Annullér aktive Stripe-abonnementer
 * 2. Anonymisér community-indlæg og -svar (bevar tråde)
 * 3. Slet al personlig data i én transaktion
 * 4. Slet Supabase auth-bruger
 *
 * Kaster fejl hvis brugeren er ADMIN.
 */
export async function deleteUserAccount(userId: string) {
  // Hent bruger og verificér at det ikke er en admin
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Bruger ikke fundet')
  if (user.role === 'ADMIN') throw new Error('Admin-konti kan ikke slettes')

  // 1. Annullér aktive Stripe-abonnementer
  const activeEntitlements = await prisma.entitlement.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      stripeSubscriptionId: { not: null },
    },
  })

  const stripe = getStripe()
  for (const entitlement of activeEntitlements) {
    if (entitlement.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(entitlement.stripeSubscriptionId)
      } catch (err) {
        // Abonnement kan allerede være annulleret — ignorer
        console.warn(
          `Kunne ikke annullere Stripe-abonnement ${entitlement.stripeSubscriptionId}:`,
          err
        )
      }
    }
  }

  // 2. Slet al brugerdata i én transaktion
  // Bemærk: DiscussionPost/DiscussionReply har required authorId med onDelete: Cascade,
  // så community-indhold slettes automatisk med brugeren. Anonymisering ville kræve
  // skemaændring (nullable authorId) — dette er en acceptabel GDPR-sletning.
  await prisma.$transaction(async (tx) => {
    // Slet journey-relateret data
    await tx.userDayCheckIn.deleteMany({
      where: { userJourney: { userId } },
    })
    await tx.userJourney.deleteMany({ where: { userId } })

    // Slet indholdsdata
    await tx.userContentProgress.deleteMany({ where: { userId } })

    // Slet notifikationer
    await tx.notification.deleteMany({ where: { userId } })
    await tx.userNotificationLog.deleteMany({ where: { userId } })

    // Slet community-medlemskab og -data
    await tx.cohortMember.deleteMany({ where: { userId } })
    await tx.cohortBan.deleteMany({ where: { userId } })
    await tx.postReaction.deleteMany({ where: { userId } })
    await tx.contentReport.deleteMany({ where: { reporterId: userId } })

    // Slet profil og indstillinger
    await tx.userProfile.deleteMany({ where: { userId } })
    await tx.entitlement.deleteMany({ where: { userId } })
    await tx.cookieConsent.deleteMany({ where: { userId } })
    await tx.userTag.deleteMany({ where: { userId } })

    // Community-indlæg og -svar slettes via cascade fra User
    // Slet brugeren — cascade håndterer DiscussionPost, DiscussionReply
    await tx.user.delete({ where: { id: userId } })
  })

  // 4. Slet Supabase auth-bruger
  try {
    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) {
      console.error('Fejl ved sletning af Supabase auth-bruger:', error)
      // Data er allerede slettet fra DB — log fejl men kast ikke
    }
  } catch (err) {
    console.error('Kunne ikke oprette forbindelse til Supabase admin:', err)
  }
}
