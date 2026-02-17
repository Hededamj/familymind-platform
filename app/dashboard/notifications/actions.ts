'use server'

import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
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

  // Verify the notification belongs to this user by fetching it
  const notifications = await getUserNotifications(user.id, 100)
  const owns = notifications.some((n) => n.id === notificationId)
  if (!owns) {
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
