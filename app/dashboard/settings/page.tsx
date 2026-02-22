import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/services/entitlement.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, CreditCard } from 'lucide-react'
import { ManageSubscriptionButton } from './_components/manage-subscription-button'

export default async function SettingsPage() {
  const user = await requireAuth()
  const entitlements = await getUserEntitlements(user.id)

  const subscriptionEntitlement = entitlements.find(
    (e) => e.product.type === 'SUBSCRIPTION'
  )

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tilbage
        </Link>

        <h1 className="mb-1 font-serif text-3xl">Indstillinger</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Administrer din konto og dit abonnement
        </p>

        {/* Profile section */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <h2 className="font-serif text-lg">Profil</h2>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Navn
                  </p>
                  <p className="mt-0.5 font-medium">
                    {user.name || 'Ikke angivet'}
                  </p>
                </div>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    E-mail
                  </p>
                  <p className="mt-0.5 font-medium">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription section */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="size-4 text-muted-foreground" />
            <h2 className="font-serif text-lg">Abonnement</h2>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6">
            {subscriptionEntitlement ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="rounded-full bg-success/10 text-success hover:bg-success/10">
                    Aktivt
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {subscriptionEntitlement.product.title}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Dit abonnement giver fuld adgang til alt indhold og alle forløb.
                </p>
                <ManageSubscriptionButton />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Du har ikke et aktivt abonnement.
                </p>
                <p className="text-sm text-muted-foreground">
                  Med et abonnement får du adgang til alle forløb, kurser og fællesskabet.
                </p>
                <Button asChild className="rounded-xl">
                  <Link href="/subscribe">Se abonnement</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
