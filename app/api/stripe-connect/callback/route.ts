import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth'
import { handleConnectCallback } from '@/lib/services/stripe-connect.service'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const redirectUrl = new URL('/admin/settings/integrations', appUrl)

  // Stripe sendte en fejl (bruger afviste eller teknisk fejl)
  if (error) {
    redirectUrl.searchParams.set('connect_error', errorDescription || error)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code || !state) {
    redirectUrl.searchParams.set('connect_error', 'Manglende parametre fra Stripe')
    return NextResponse.redirect(redirectUrl)
  }

  // CSRF-validering: sammenlign state med cookie
  const cookieStore = await cookies()
  const storedState = cookieStore.get('stripe_connect_state')?.value

  if (!storedState || storedState !== state) {
    redirectUrl.searchParams.set('connect_error', 'Ugyldig state — prøv igen')
    return NextResponse.redirect(redirectUrl)
  }

  // Ryd state-cookie
  cookieStore.delete('stripe_connect_state')

  // Verificér bruger er admin
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN' || !user.organizationId) {
    redirectUrl.searchParams.set('connect_error', 'Ikke autoriseret')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    await handleConnectCallback(user.organizationId, code)
    redirectUrl.searchParams.set('connect_success', '1')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ukendt fejl'
    console.error('Stripe Connect callback fejl:', message)
    redirectUrl.searchParams.set('connect_error', 'Kunne ikke forbinde Stripe-konto')
  }

  return NextResponse.redirect(redirectUrl)
}
