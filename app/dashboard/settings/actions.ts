'use server'

import { requireAuth } from '@/lib/auth'
import { deleteUserAccount } from '@/lib/services/user.service'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteAccountAction() {
  const user = await requireAuth()

  if (user.role === 'ADMIN') {
    throw new Error('Admin-konti kan ikke slettes via denne funktion.')
  }

  await deleteUserAccount(user.id)

  // Log brugeren ud ved at slette Supabase-session
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect('/login')
}
