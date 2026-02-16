import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/services/entitlement.service'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ManageSubscriptionButton } from './_components/manage-subscription-button'

export default async function SettingsPage() {
  const user = await requireAuth()
  const entitlements = await getUserEntitlements(user.id)

  const subscriptionEntitlement = entitlements.find(
    (e) => e.product.type === 'SUBSCRIPTION'
  )

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Tilbage til dashboard
        </Link>

        <h1 className="mb-8 text-3xl font-bold tracking-tight">
          Indstillinger
        </h1>

        {/* User info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Dine kontooplysninger</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Navn</p>
              <p className="font-medium">{user.name || 'Ikke angivet'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Abonnement</CardTitle>
            <CardDescription>
              Status p&aring; dit FamilyMind-abonnement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionEntitlement ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="default">Aktivt</Badge>
                  <span className="text-sm text-muted-foreground">
                    {subscriptionEntitlement.product.title}
                  </span>
                </div>
                <ManageSubscriptionButton />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Du har ikke et aktivt abonnement.
                </p>
                <Button asChild>
                  <Link href="/subscribe">Se abonnement</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
