import { createClient } from '@supabase/supabase-js'

/**
 * Supabase admin client med service_role key.
 * Bruges til admin-operationer som at slette auth-brugere (GDPR).
 * ALDRIG eksponeres til klienten.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY skal begge være sat.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
