import { prisma } from '@/lib/prisma'
import { getResend } from '@/lib/resend'
import type { InAppNotificationType } from '@prisma/client'

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

/**
 * Load an EmailTemplate from the DB by key, interpolate `{{variable}}`
 * placeholders, and send via Resend.
 *
 * Falls back to console logging when RESEND_API_KEY is not configured
 * (e.g. in local development).
 */
export async function sendTemplatedEmail(
  userId: string,
  templateKey: string,
  variables?: Record<string, string>
) {
  // Look up user for email address
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    console.error(`[engagement] sendTemplatedEmail: user ${userId} not found`)
    return null
  }

  // Look up template
  const template = await prisma.emailTemplate.findUnique({
    where: { templateKey },
  })
  if (!template || !template.isActive) {
    console.warn(
      `[engagement] sendTemplatedEmail: template "${templateKey}" not found or inactive`
    )
    return null
  }

  // Interpolate variables into subject and body
  const vars: Record<string, string> = {
    userName: user.name || user.email.split('@')[0],
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings`,
    ...variables,
  }

  const subject = interpolate(template.subject, vars)
  const bodyHtml = interpolate(template.bodyHtml, vars)

  // Dev fallback: log instead of sending when no API key
  if (!process.env.RESEND_API_KEY) {
    console.log('[engagement] Email (dev mode - no RESEND_API_KEY):')
    console.log(`  To: ${user.email}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Body: ${bodyHtml.substring(0, 200)}...`)
    return { id: 'dev-mode', to: user.email, subject }
  }

  const resend = getResend()
  const fromAddress =
    process.env.RESEND_FROM_EMAIL || 'FamilyMind <noreply@familymind.dk>'

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: user.email,
    subject,
    html: bodyHtml,
  })

  if (error) {
    console.error('[engagement] Resend error:', error)
    return null
  }

  return data
}

// ---------------------------------------------------------------------------
// In-App Notifications
// ---------------------------------------------------------------------------

/**
 * Create a new in-app notification for a user.
 */
export async function createInAppNotification(
  userId: string,
  type: InAppNotificationType,
  title: string,
  body: string,
  actionUrl?: string
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      actionUrl,
    },
  })
}

/**
 * Count unread notifications for a user.
 */
export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  })
}

/**
 * Get the latest notifications for a user, ordered by most recent first.
 */
export async function getUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  })
}

/**
 * Mark all unread notifications for a user as read.
 */
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Replace `{{key}}` patterns in a string with corresponding values.
 */
function interpolate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return variables[key] ?? match
  })
}
