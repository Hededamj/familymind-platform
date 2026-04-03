import { prisma } from '@/lib/prisma'
import { updateProfileSchema } from '@/lib/validators/user'
import type { z } from 'zod'

type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export async function getOrCreateUser(supabaseUser: {
  id: string
  email: string
  user_metadata?: { full_name?: string; name?: string }
}) {
  const existing = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  })

  if (existing) {
    // Tilknyt eksisterende brugere uden organisation til default org
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
