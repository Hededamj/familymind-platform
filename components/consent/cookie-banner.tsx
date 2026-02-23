'use client'

import Link from 'next/link'
import { useConsent } from './consent-provider'
import { Button } from '@/components/ui/button'

export function CookieBanner() {
  const { hasResponded, updateConsent, setOpenSettings } = useConsent()

  if (hasResponded) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white p-4 shadow-lg sm:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-sm text-foreground">
            Vi bruger cookies til statistik og markedsføring.{' '}
            <Link
              href="/cookiepolitik"
              className="underline underline-offset-2 hover:text-primary"
            >
              Læs vores cookiepolitik
            </Link>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenSettings(true)}
            className="order-3 sm:order-1"
          >
            Tilpas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConsent({ statistics: false, marketing: false })}
            className="order-2"
          >
            Kun nødvendige
          </Button>
          <Button
            size="sm"
            onClick={() => updateConsent({ statistics: true, marketing: true })}
            className="order-1 sm:order-3"
          >
            Acceptér alle
          </Button>
        </div>
      </div>
    </div>
  )
}
