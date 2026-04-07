import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/services/entitlement.service'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft, Mail } from 'lucide-react'
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
  const [user, tenant] = await Promise.all([
    getCurrentUser(),
    getTenantConfig(),
  ])

  let hasSubscription = false
  let currentVariantLabel: string | null = null
  if (user) {
    const entitlements = await getUserEntitlements(user.id)
    const subEnt = entitlements.find((e) => e.product.type === 'SUBSCRIPTION')
    hasSubscription = !!subEnt
    currentVariantLabel = subEnt?.priceVariant?.label ?? null
  }

  const subscriptionProduct = await prisma.product.findFirst({
    where: { type: 'SUBSCRIPTION', isActive: true },
    include: {
      priceVariants: {
        where: { isActive: true },
        orderBy: { position: 'asc' },
      },
    },
  })

  // Use default benefits if tenant has none or too few
  const benefits =
    tenant.landingBenefits && tenant.landingBenefits.length >= 3
      ? tenant.landingBenefits
      : defaultBenefits

  return (
    <div className="bg-sand px-4 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        {/* Back link */}
        {user && (
          <Link
            href="/dashboard/settings"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Tilbage til indstillinger
          </Link>
        )}

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
            <span className="font-serif text-5xl">{tenant.subscriptionPriceDisplay || '149 kr'}</span>
            <span className="text-muted-foreground"> {tenant.subscriptionPeriodDisplay || '/måned'}</span>
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
              {currentVariantLabel && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Du har: {currentVariantLabel}
                </p>
              )}
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/dashboard/settings">
                  Mit abonnement
                </Link>
              </Button>
            </div>
          ) : user && subscriptionProduct ? (
            <SubscribeCTA
              productId={subscriptionProduct.id}
              variants={subscriptionProduct.priceVariants.map((v) => ({
                id: v.id,
                label: v.label,
                description: v.description,
                amountCents: v.amountCents,
                currency: v.currency,
                billingType: v.billingType,
                interval: v.interval,
                intervalCount: v.intervalCount,
                trialDays: v.trialDays,
                isHighlighted: v.isHighlighted,
              }))}
            />
          ) : !user ? (
            <Button asChild className="w-full rounded-xl" size="lg">
              <Link href="/login?redirect=/subscribe">
                Log ind for at starte abonnement
              </Link>
            </Button>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Abonnement er ikke tilgængeligt lige nu.
              </p>
              {tenant.contactEmail && (
                <Button asChild variant="outline" className="rounded-xl">
                  <a href={`mailto:${tenant.contactEmail}`}>
                    <Mail className="size-4" />
                    Kontakt os
                  </a>
                </Button>
              )}
              <div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/browse">Udforsk gratis indhold</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {subscriptionProduct && !hasSubscription && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Prøv gratis — betal først når du er klar
          </p>
        )}
      </div>
    </div>
  )
}
