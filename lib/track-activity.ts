import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * Updates lastActiveAt for the current user.
 * Fire-and-forget — errors are silently caught to avoid disrupting page loads.
 * Throttled: only updates if last update was >5 minutes ago.
 */
export async function trackActivity() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { lastActiveAt: true },
    })

    // Throttle: skip if updated within 5 minutes
    if (dbUser?.lastActiveAt) {
      const diff = Date.now() - dbUser.lastActiveAt.getTime()
      if (diff < 5 * 60 * 1000) return
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })
  } catch {
    // Silent catch — tracking should never break user experience
  }
}
