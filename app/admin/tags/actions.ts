'use server'

import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createTagAction(data: { name: string; slug: string }) {
  await requireAdmin()
  const tag = await prisma.contentTag.create({ data })
  revalidatePath('/admin/tags')
  return tag
}

export async function deleteTagAction(id: string) {
  await requireAdmin()
  await prisma.contentTag.delete({ where: { id } })
  revalidatePath('/admin/tags')
}
