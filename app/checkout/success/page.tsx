import Link from 'next/link'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type SearchParams = Promise<{ session_id?: string }>

const sessionIdSchema = z.string().regex(/^cs_(test|live)_[a-zA-Z0-9]+$/)

async function resolvePurchase(
  sessionId: string,
  userId: string
): Promise<{ kind: 'course' | 'bundle'; slug: string; title: string } | null> {
  // Webhook writes the entitlement keyed by checkout session id, so we look up
  // there rather than calling Stripe again. If the webhook hasn't landed yet,
  // we just fall through to the generic dashboard CTA.
  const ent = await prisma.entitlement.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: {
      course: { select: { slug: true, title: true } },
      bundle: { select: { slug: true, title: true } },
    },
  })

  // Defense in depth: never leak another user's purchase via session_id guess.
  if (!ent || ent.userId !== userId) return null

  if (ent.course) {
    return { kind: 'course', slug: ent.course.slug, title: ent.course.title }
  }
  if (ent.bundle) {
    return { kind: 'bundle', slug: ent.bundle.slug, title: ent.bundle.title }
  }
  return null
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { session_id } = await searchParams
  const user = await getCurrentUser()

  const parsed = session_id ? sessionIdSchema.safeParse(session_id) : null
  const purchase =
    parsed?.success && user
      ? await resolvePurchase(parsed.data, user.id)
      : null

  const ctaHref = purchase
    ? purchase.kind === 'course'
      ? `/courses/${purchase.slug}`
      : `/bundles/${purchase.slug}`
    : '/dashboard/courses'

  const ctaLabel = purchase
    ? purchase.kind === 'course'
      ? 'Gå til kurset'
      : 'Gå til bundlen'
    : 'Gå til mine forløb'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Tak for dit køb!</CardTitle>
          <CardDescription className="text-base">
            {purchase
              ? `Du har nu adgang til ${purchase.title}.`
              : 'Du har nu adgang til dit indhold.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/dashboard">Til dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
