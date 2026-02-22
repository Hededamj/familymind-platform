import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/services/entitlement.service'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { SubscribeCTA } from './_components/subscribe-cta'

const defaultBenefits = [
  'Alle strukturerede forløb',
  'Videokurser og artikler',
  'Daglige øvelser og refleksion',
  'Check-ins og fremgangssporing',
  'Personlige anbefalinger',
  'Adgang til fællesskabet',
]

export default async function SubscribePage() {
  const tenant = await getTenantConfig()
  const user = await getCurrentUser()

  let hasSubscription = false
  if (user) {
    const entitlements = await getUserEntitlements(user.id)
    hasSubscription = entitlements.some(
      (e) => e.product.type === 'SUBSCRIPTION'
    )
  }

  const subscriptionProduct = await prisma.product.findFirst({
    where: { type: 'SUBSCRIPTION', isActive: true },
  })

  const benefits = tenant.landingBenefits ?? defaultBenefits
  const price = tenant.subscriptionPriceDisplay || '149 kr'
  const period = tenant.subscriptionPeriodDisplay || '/måned'

  return (
    <div className="bg-sand px-4 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            {tenant.brandName} Abonnement
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Alt du har brug for — samlet ét sted
          </h1>
          <p className="mt-3 text-muted-foreground">
            Ingen bindingsperiode. Afmeld når som helst.
          </p>
        </div>

        {/* Price card */}
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <span className="font-serif text-5xl">{price}</span>
            <span className="text-muted-foreground"> {period}</span>
          </div>

          <ul className="mb-8 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          {hasSubscription ? (
            <div className="text-center">
              <p className="mb-4 text-sm font-medium text-success">
                Du er allerede abonnent
              </p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/dashboard/settings">
                  Administrer abonnement
                </Link>
              </Button>
            </div>
          ) : user && subscriptionProduct ? (
            <SubscribeCTA productId={subscriptionProduct.id} />
          ) : !user ? (
            <Button asChild className="w-full rounded-xl" size="lg">
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

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Prøv gratis — betal først når du er klar
        </p>
      </div>
    </div>
  )
}
