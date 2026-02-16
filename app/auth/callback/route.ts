import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let redirectTo = searchParams.get('redirectTo') || '/dashboard'

  // Prevent open redirect
  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    redirectTo = '/dashboard'
  }

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${redirectTo}`)
}
