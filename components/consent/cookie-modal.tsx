'use client'

import { useState } from 'react'
import { useConsent } from './consent-provider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

type ConsentState = {
  necessary: boolean
  statistics: boolean
  marketing: boolean
}

export function CookieModal() {
  const { consent, openSettings, setOpenSettings, updateConsent } = useConsent()

  return (
    <Dialog open={openSettings} onOpenChange={setOpenSettings}>
      <DialogContent className="sm:max-w-md">
        {/* Inner mounts fresh each open — captures current consent as initial local state */}
        {openSettings && (
          <CookieModalBody
            consent={consent}
            updateConsent={updateConsent}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CookieModalBody({
  consent,
  updateConsent,
}: {
  consent: ConsentState | null
  updateConsent: (c: { statistics: boolean; marketing: boolean }) => void
}) {
  const [statistics, setStatistics] = useState(consent?.statistics ?? false)
  const [marketing, setMarketing] = useState(consent?.marketing ?? false)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cookieindstillinger</DialogTitle>
        <DialogDescription>
          Vælg hvilke cookies du vil tillade. Du kan altid ændre dine valg senere.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Nødvendige */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label className="text-sm font-medium">Nødvendige</Label>
            <p className="text-xs text-muted-foreground">
              Session, login og fejlovervågning. Kan ikke deaktiveres.
            </p>
          </div>
          <Switch checked disabled />
        </div>

        {/* Statistik */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="statistics" className="text-sm font-medium">Statistik</Label>
            <p className="text-xs text-muted-foreground">
              Google Analytics — hjælper os med at forstå hvordan siden bruges.
            </p>
          </div>
          <Switch
            id="statistics"
            checked={statistics}
            onCheckedChange={setStatistics}
          />
        </div>

        {/* Marketing */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="marketing" className="text-sm font-medium">Marketing</Label>
            <p className="text-xs text-muted-foreground">
              Meta pixel — bruges til at vise relevante annoncer på Facebook og Instagram.
            </p>
          </div>
          <Switch
            id="marketing"
            checked={marketing}
            onCheckedChange={setMarketing}
          />
        </div>
      </div>

      <DialogFooter className="flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          onClick={() => updateConsent({ statistics, marketing })}
        >
          Gem valg
        </Button>
        <Button
          onClick={() => updateConsent({ statistics: true, marketing: true })}
        >
          Acceptér alle
        </Button>
      </DialogFooter>
    </>
  )
}
