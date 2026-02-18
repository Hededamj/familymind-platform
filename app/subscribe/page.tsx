import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/services/entitlement.service'
import { prisma } from '@/lib/prisma'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SubscribeCTA } from './_components/subscribe-cta'

const benefits = [
  'Adgang til alle rejser og struktureret indhold',
  'Nye kurser og videoer l\u00f8bende',
  'Ugentlige planer og p\u00e5mindelser',
  'Check-ins og refleksion',
  'Personlige anbefalinger',
]

export default async function SubscribePage() {
  const user = await getCurrentUser()

  // Check if user already has an active subscription
  let hasSubscription = false
  if (user) {
    const entitlements = await getUserEntitlements(user.id)
    hasSubscription = entitlements.some(
      (e) => e.product.type === 'SUBSCRIPTION'
    )
  }

  // Find the subscription product
  const subscriptionProduct = await prisma.product.findFirst({
    where: { type: 'SUBSCRIPTION', isActive: true },
  })

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Tilbage
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            FamilyMind Abonnement
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Alt du har brug for som forælder — samlet ét sted.
          </p>
        </div>

        {/* Price */}
        <div className="mb-8 text-center">
          <p className="text-4xl font-bold">
            149 kr
            <span className="text-lg font-normal text-muted-foreground">
              /måned
            </span>
          </p>
        </div>

        <Separator className="mb-8" />

        {/* Benefits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Det får du med abonnementet</CardTitle>
            <CardDescription>
              Fuld adgang til alt indhold og værktøjer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    &#10003;
                  </span>
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-6">
          {hasSubscription ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center font-medium text-green-600">
                  Du er allerede abonnent
                </p>
                <div className="mt-4 flex justify-center">
                  <Button asChild>
                    <Link href="/dashboard/settings">
                      Administrer abonnement
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : user && subscriptionProduct ? (
            <SubscribeCTA productId={subscriptionProduct.id} />
          ) : !user ? (
            <Button asChild className="w-full" size="lg">
              <Link href="/login?redirect=/subscribe">
                Log ind for at starte abonnement
              </Link>
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Abonnement er ikke tilgængeligt lige nu.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
