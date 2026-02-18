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
  if (existing) return existing

  return prisma.user.create({
    data: {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name:
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        null,
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
