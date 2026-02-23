'use client'

import { useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  initiateStripeConnectAction,
  disconnectStripeAction,
} from '../actions'
import { CheckCircle2, AlertCircle, Clock, XCircle, ExternalLink } from 'lucide-react'

type Props = {
  status: string
  accountId: string | null
}

function StripeConnectCardInner({ status, accountId }: Props) {
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()

  const connectError = searchParams.get('connect_error')
  const connectSuccess = searchParams.get('connect_success')

  useEffect(() => {
    if (connectError) toast.error(connectError)
    if (connectSuccess) toast.success('Stripe-konto forbundet!')
  }, [connectError, connectSuccess])

  function handleConnect() {
    startTransition(async () => {
      await initiateStripeConnectAction()
    })
  }

  function handleDisconnect() {
    if (!confirm('Er du sikker på du vil frakoble Stripe? Checkout vil blive deaktiveret.')) {
      return
    }
    startTransition(async () => {
      try {
        await disconnectStripeAction()
        toast.success('Stripe-konto frakoblet')
      } catch {
        toast.error('Kunne ikke frakoble Stripe')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Stripe
          <StatusBadge status={status} />
        </CardTitle>
        <CardDescription>
          <StatusDescription status={status} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'not_connected' && (
          <Button onClick={handleConnect} disabled={isPending}>
            {isPending ? 'Omdirigerer...' : 'Forbind Stripe'}
          </Button>
        )}

        {status === 'pending' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Din Stripe-konto afventer verificering hos Stripe. Udfyld venligst alle påkrævede oplysninger.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Åbn Stripe Dashboard <ExternalLink className="ml-1 size-4" />
                </a>
              </Button>
              <Button variant="destructive" onClick={handleDisconnect} disabled={isPending}>
                Frakobl
              </Button>
            </div>
          </div>
        )}

        {status === 'active' && (
          <div className="space-y-3">
            {accountId && (
              <p className="text-sm font-mono text-muted-foreground">
                Konto: {accountId}
              </p>
            )}
            <Button variant="destructive" onClick={handleDisconnect} disabled={isPending}>
              {isPending ? 'Frakobler...' : 'Frakobl Stripe'}
            </Button>
          </div>
        )}

        {status === 'restricted' && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              Stripe har begrænset din konto. Tjek dit Stripe Dashboard for detaljer.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Åbn Stripe Dashboard <ExternalLink className="ml-1 size-4" />
                </a>
              </Button>
              <Button variant="destructive" onClick={handleDisconnect} disabled={isPending}>
                Frakobl
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="mr-1 size-3" /> Aktiv
        </Badge>
      )
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="mr-1 size-3" /> Afventer
        </Badge>
      )
    case 'restricted':
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 size-3" /> Begrænset
        </Badge>
      )
    default:
      return (
        <Badge variant="outline">
          <XCircle className="mr-1 size-3" /> Ikke forbundet
        </Badge>
      )
  }
}

function StatusDescription({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return 'Stripe er forbundet og klar til at modtage betalinger.'
    case 'pending':
      return 'Stripe-konto er oprettet, men mangler verificering.'
    case 'restricted':
      return 'Stripe-kontoen er begrænset — betalinger kan være påvirket.'
    default:
      return 'Forbind din Stripe-konto for at modtage betalinger fra kunder.'
  }
}

export function StripeConnectCard(props: Props) {
  return (
    <Suspense fallback={
      <Card>
        <CardHeader>
          <CardTitle>Stripe</CardTitle>
          <CardDescription>Indlæser...</CardDescription>
        </CardHeader>
      </Card>
    }>
      <StripeConnectCardInner {...props} />
    </Suspense>
  )
}
