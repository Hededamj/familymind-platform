'use server'

import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  getUnreadNotificationCount,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/services/engagement.service'

export async function getNotificationsAction(limit = 20) {
  const user = await requireAuth()
  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(user.id, limit),
    getUnreadNotificationCount(user.id),
  ])
  return { notifications, unreadCount }
}

export async function getUnreadCountAction() {
  const user = await requireAuth()
  return getUnreadNotificationCount(user.id)
}

export async function markAsReadAction(notificationId: string) {
  const user = await requireAuth()

  // Direct indexed lookup — O(1) and works regardless of notification count
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId: user.id },
  })
  if (!notification) {
    throw new Error('Ikke autoriseret')
  }

  await markNotificationAsRead(notificationId)
  revalidatePath('/dashboard')
}

export async function markAllAsReadAction() {
  const user = await requireAuth()
  await markAllNotificationsAsRead(user.id)
  revalidatePath('/dashboard')
}
