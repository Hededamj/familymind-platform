import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/services/user.service'
import { redirect } from 'next/navigation'

/**
 * Get current user from Supabase session, creating DB user if needed.
 * Returns null if not authenticated.
 *
 * Wrapped with React cache() so multiple calls within the same request
 * deduplicate to a single Supabase + DB lookup.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()

  if (!supabaseUser) return null

  const user = await getOrCreateUser({
    id: supabaseUser.id,
    email: supabaseUser.email!,
    user_metadata: supabaseUser.user_metadata,
  })

  return user
})

/**
 * Require authentication. Redirects to /login if not authenticated.
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Require admin role. Redirects to /dashboard if not admin.
 */
export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') redirect('/dashboard')
  return user
}

/**
 * Require moderator or admin role. Redirects to /dashboard if neither.
 */
export async function requireModeratorOrAdmin() {
  const user = await requireAuth()
  if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') redirect('/dashboard')
  return user
}
