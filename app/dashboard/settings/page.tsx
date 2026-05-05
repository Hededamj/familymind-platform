import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/services/entitlement.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, CreditCard, LogOut } from 'lucide-react'
import { ManageSubscriptionButton } from './_components/manage-subscription-button'
import { LogoutButton } from './_components/logout-button'
import { DeleteAccountSection } from './_components/delete-account-section'
import { AvatarUploader } from './_components/avatar-uploader'

function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default async function SettingsPage() {
  const user = await requireAuth()
  const entitlements = await getUserEntitlements(user.id)

  // PR1 stub: viser bare antal aktive entitlements
  const activeCount = entitlements.length

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

        <h1 className="mb-1 font-serif text-3xl">Min konto</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Din profil og dit abonnement
        </p>

        {/* Profile section */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <h2 className="font-serif text-lg">Om dig</h2>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="space-y-5">
              <AvatarUploader
                initialUrl={user.avatarUrl}
                initials={getInitials(user.name || user.email.split('@')[0])}
              />
              <div className="border-t border-border" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Navn
                </p>
                <p className="mt-0.5 font-medium">
                  {user.name || 'Ikke angivet'}
                </p>
              </div>
              <div className="border-t border-border" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  E-mail
                </p>
                <p className="mt-0.5 font-medium">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription section */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="size-4 text-muted-foreground" />
            <h2 className="font-serif text-lg">Dit abonnement</h2>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6">
            {activeCount > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="rounded-full bg-success/10 text-success hover:bg-success/10">
                    Aktivt
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Aktive abonnementer: {activeCount}
                  </span>
                </div>
                <ManageSubscriptionButton />
                <Link
                  href="/dashboard/subscription/cancel"
                  className="inline-block text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Opsig abonnement
                </Link>
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

        {/* Logout section */}
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <LogOut className="size-4 text-muted-foreground" />
            <h2 className="font-serif text-lg">Konto</h2>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Vil du skifte bruger eller logge ud?
              </p>
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Delete account section — only for non-admin users */}
        {user.role !== 'ADMIN' && (
          <>
            <div className="my-8 border-t border-border" />
            <DeleteAccountSection />
          </>
        )}
      </div>
    </div>
  )
}
