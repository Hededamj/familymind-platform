import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let redirectTo = searchParams.get('redirectTo') || ''

  // Prevent open redirect
  if (redirectTo && (!redirectTo.startsWith('/') || redirectTo.startsWith('//'))) {
    redirectTo = ''
  }

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // If no explicit redirect, check if user is admin
  if (!redirectTo) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      })
      redirectTo = dbUser?.role === 'ADMIN' ? '/admin' : '/dashboard'
    } else {
      redirectTo = '/dashboard'
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`)
}
