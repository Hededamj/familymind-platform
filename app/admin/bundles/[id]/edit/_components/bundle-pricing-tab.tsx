'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Star, Trash2, RefreshCw } from 'lucide-react'
import {
  createPriceVariantAction,
  deletePriceVariantAction,
  syncVariantToStripeAction,
} from '../../../actions'
import type { BillingType, BillingInterval } from '@prisma/client'

type Variant = {
  id: string
  label: string
  description: string | null
  amountCents: number
  currency: string
  billingType: BillingType
  interval: BillingInterval | null
  intervalCount: number
  trialDays: number | null
  isHighlighted: boolean
  stripePriceId: string | null
}

type IntervalOption = 'month-1' | 'month-3' | 'month-6' | 'year-1'

function formatPrice(v: Variant): string {
  const amount = (v.amountCents / 100).toLocaleString('da-DK')
  if (v.billingType === 'one_time') return `${amount} kr engangskøb`
  if (v.interval === 'month' && v.intervalCount === 1) return `${amount} kr/md`
  if (v.interval === 'month') return `${amount} kr / ${v.intervalCount} mdr`
  if (v.interval === 'year') return `${amount} kr/år`
  return `${amount} kr`
}

export function BundlePricingTab({
  bundleId,
  variants,
}: {
  bundleId: string
  variants: Variant[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [deletingVariant, setDeletingVariant] = useState<Variant | null>(null)

  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [priceDkk, setPriceDkk] = useState('')
  const [billingType, setBillingType] = useState<BillingType>('recurring')
  const [intervalChoice, setIntervalChoice] = useState<IntervalOption>('month-1')
  const [trialDays, setTrialDays] = useState('')
  const [isHighlighted, setIsHighlighted] = useState(false)

  function reset() {
    setLabel('')
    setDescription('')
    setPriceDkk('')
    setBillingType('recurring')
    setIntervalChoice('month-1')
    setTrialDays('')
    setIsHighlighted(false)
  }

  function parseInterval(choice: IntervalOption): {
    interval: BillingInterval
    intervalCount: number
  } {
    switch (choice) {
      case 'month-1':
        return { interval: 'month', intervalCount: 1 }
      case 'month-3':
        return { interval: 'month', intervalCount: 3 }
      case 'month-6':
        return { interval: 'month', intervalCount: 6 }
      case 'year-1':
        return { interval: 'year', intervalCount: 1 }
    }
  }

  function handleCreate() {
    const dkk = parseFloat(priceDkk)
    if (!label.trim() || isNaN(dkk) || dkk < 0) {
      toast.error('Udfyld label og pris')
      return
    }
    const amountCents = Math.round(dkk * 100)
    const intervalData =
      billingType === 'recurring' ? parseInterval(intervalChoice) : { interval: null, intervalCount: 1 }

    startTransition(async () => {
      try {
        await createPriceVariantAction(bundleId, {
          label,
          description: description || undefined,
          amountCents,
          billingType,
          interval: intervalData.interval,
          intervalCount: intervalData.intervalCount,
          trialDays: billingType === 'recurring' && trialDays ? parseInt(trialDays, 10) : null,
          isHighlighted,
        })
        toast.success('Prisvariant oprettet')
        setShowAdd(false)
        reset()
        router.refresh()
      } catch {
        toast.error('Kunne ikke oprette prisvariant')
      }
    })
  }

  function handleDelete() {
    if (!deletingVariant) return
    startTransition(async () => {
      try {
        await deletePriceVariantAction(deletingVariant.id)
        toast.success('Prisvariant slettet')
        setDeletingVariant(null)
        router.refresh()
      } catch {
        toast.error('Kunne ikke slette prisvariant')
      }
    })
  }

  function handleSync(variantId: string) {
    startTransition(async () => {
      try {
        await syncVariantToStripeAction(variantId)
        toast.success('Synkroniseret til Stripe')
        router.refresh()
      } catch {
        toast.error('Kunne ikke synkronisere til Stripe')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 size-4" />
          Tilføj prisvariant
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Ingen prisvarianter endnu.
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  {v.isHighlighted && (
                    <Star className="size-5 fill-yellow-400 text-yellow-400" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{v.label}</span>
                      {v.description && (
                        <span className="text-sm text-muted-foreground">— {v.description}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(v)}
                      {v.trialDays ? ` • ${v.trialDays} dages prøveperiode` : ''}
                      {v.stripePriceId ? ' • Synkroniseret til Stripe' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(v.id)}
                    disabled={isPending}
                  >
                    <RefreshCw className="mr-2 size-4" />
                    Sync til Stripe
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-destructive"
                    onClick={() => setDeletingVariant(v)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) reset() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilføj prisvariant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vlabel">Label *</Label>
              <Input
                id="vlabel"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="F.eks. Månedligt"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vdesc">Beskrivelse</Label>
              <Input
                id="vdesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="F.eks. Mest populær eller Spar 17%"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vprice">Pris (DKK) *</Label>
              <Input
                id="vprice"
                type="number"
                min="0"
                step="0.01"
                value={priceDkk}
                onChange={(e) => setPriceDkk(e.target.value)}
                placeholder="149"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={billingType === 'one_time'}
                    onChange={() => setBillingType('one_time')}
                  />
                  Engangsbetaling
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={billingType === 'recurring'}
                    onChange={() => setBillingType('recurring')}
                  />
                  Abonnement
                </label>
              </div>
            </div>

            {billingType === 'recurring' && (
              <>
                <div className="space-y-2">
                  <Label>Interval</Label>
                  <Select
                    value={intervalChoice}
                    onValueChange={(v) => setIntervalChoice(v as IntervalOption)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month-1">Hver måned</SelectItem>
                      <SelectItem value="month-3">Hver 3. måned</SelectItem>
                      <SelectItem value="month-6">Hver 6. måned</SelectItem>
                      <SelectItem value="year-1">Hver år</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vtrial">Prøveperiode (dage)</Label>
                  <Input
                    id="vtrial"
                    type="number"
                    min="0"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="highlighted"
                checked={isHighlighted}
                onCheckedChange={setIsHighlighted}
              />
              <Label htmlFor="highlighted">Mest populær</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} disabled={isPending}>
              Annuller
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? 'Opretter...' : 'Opret'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingVariant} onOpenChange={(o) => !o && setDeletingVariant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet prisvariant</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette &quot;{deletingVariant?.label}&quot;? Denne handling kan
              ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Sletter...' : 'Slet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
