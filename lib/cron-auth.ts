import { NextRequest } from 'next/server'

/**
 * Verify that a cron request carries a valid CRON_SECRET.
 * Fails closed in production — returns false when CRON_SECRET is not set.
 * Only allows bypass in development (NODE_ENV !== 'production').
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('authorization')
  if (!process.env.CRON_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[cron] CRON_SECRET not configured in production — blocking request')
      return false
    }
    console.warn('[cron] CRON_SECRET not configured, allowing in development')
    return true
  }
  return secret === `Bearer ${process.env.CRON_SECRET}`
}
