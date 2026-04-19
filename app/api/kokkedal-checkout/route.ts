import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

const PRICE_PUBLIC = 'price_1TNZ6YJVxLzS0GFc18xsZ1XN'
const PRICE_MEMBER = 'price_1TNZQfJVxLzS0GFcvfGB5yyg'
const FAMILYMIND_PRODUCT_ID = 'course_182187'

const SUCCESS_URL = 'https://mettehummel.dk/kokkedal/tak?session_id={CHECKOUT_SESSION_ID}'
const CANCEL_URL = 'https://mettehummel.dk/kokkedal'

const ALLOWED_ORIGINS = new Set([
  'https://mettehummel.dk',
  'https://www.mettehummel.dk',
  'http://localhost:8765',
])

type CheckoutBody = { type: 'public' | 'member'; email?: string }

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://mettehummel.dk'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

export async function POST(req: Request) {
  const headers = corsHeaders(req.headers.get('origin'))

  let body: CheckoutBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ugyldig forespørgsel' }, { status: 400, headers })
  }

  const stripe = getStripe()

  try {
    if (body.type === 'public') {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: PRICE_PUBLIC, quantity: 1 }],
        success_url: SUCCESS_URL,
        cancel_url: CANCEL_URL,
        locale: 'da',
        allow_promotion_codes: true,
      })
      return NextResponse.json({ url: session.url }, { headers })
    }

    if (body.type === 'member') {
      const email = (body.email || '').trim().toLowerCase()
      if (!email) {
        return NextResponse.json({ error: 'E-mail mangler' }, { status: 400, headers })
      }

      const customers = await stripe.customers.list({ email, limit: 10 })
      let isMember = false
      let matchedCustomerId: string | undefined

      for (const c of customers.data) {
        const subs = await stripe.subscriptions.list({ customer: c.id, status: 'all', limit: 20 })
        const hit = subs.data.some((s) =>
          ['active', 'trialing'].includes(s.status) &&
          s.items.data.some((i) => {
            const product = typeof i.price.product === 'string' ? i.price.product : i.price.product.id
            return product === FAMILYMIND_PRODUCT_ID
          })
        )
        if (hit) {
          isMember = true
          matchedCustomerId = c.id
          break
        }
      }

      if (!isMember) {
        return NextResponse.json({ error: 'not_member' }, { status: 200, headers })
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: PRICE_MEMBER, quantity: 1 }],
        customer: matchedCustomerId,
        success_url: SUCCESS_URL,
        cancel_url: CANCEL_URL,
        locale: 'da',
      })
      return NextResponse.json({ url: session.url }, { headers })
    }

    return NextResponse.json({ error: 'Ukendt type' }, { status: 400, headers })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ukendt fejl'
    return NextResponse.json({ error: message }, { status: 500, headers })
  }
}
