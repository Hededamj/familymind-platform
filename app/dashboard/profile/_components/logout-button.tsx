'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-3 hover:bg-[var(--color-sand)] transition-colors"
    >
      <LogOut className="size-5 text-muted-foreground" />
      <span className="text-foreground">Log ud</span>
    </button>
  )
}
