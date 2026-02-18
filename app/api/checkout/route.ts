import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/services/checkout.service'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  const body = await req.json()

  try {
    const result = await createCheckoutSession(user.id, body)
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Der opstod en fejl'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
