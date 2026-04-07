'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, X, Star } from 'lucide-react'
import {
  createPriceVariantAction,
  updatePriceVariantAction,
  deletePriceVariantAction,
} from '../actions'

export type PriceVariant = {
  id: string
  productId: string
  label: string
  description: string | null
  amountCents: number
  currency: string
  billingType: 'one_time' | 'recurring'
  interval: 'month' | 'year' | null
  intervalCount: number
  trialDays: number | null
  stripePriceId: string | null
  position: number
  isActive: boolean
  isHighlighted: boolean
}

type IntervalChoice = 'one_time' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly'

type FormState = {
  label: string
  description: string
  priceDKK: string
  intervalChoice: IntervalChoice
  trialDays: string
  position: string
  isHighlighted: boolean
  isActive: boolean
}

const emptyForm: FormState = {
  label: '',
  description: '',
  priceDKK: '',
  intervalChoice: 'monthly',
  trialDays: '',
  position: '0',
  isHighlighted: false,
  isActive: true,
}

function intervalChoiceToBilling(choice: IntervalChoice): {
  billingType: 'one_time' | 'recurring'
  interval: 'month' | 'year' | null
  intervalCount: number
} {
  switch (choice) {
    case 'one_time':
      return { billingType: 'one_time', interval: null, intervalCount: 1 }
    case 'monthly':
      return { billingType: 'recurring', interval: 'month', intervalCount: 1 }
    case 'quarterly':
      return { billingType: 'recurring', interval: 'month', intervalCount: 3 }
    case 'half_yearly':
      return { billingType: 'recurring', interval: 'month', intervalCount: 6 }
    case 'yearly':
      return { billingType: 'recurring', interval: 'year', intervalCount: 1 }
  }
}

function billingToIntervalChoice(v: PriceVariant): IntervalChoice {
  if (v.billingType === 'one_time') return 'one_time'
  if (v.interval === 'year') return 'yearly'
  if (v.interval === 'month') {
    if (v.intervalCount === 6) return 'half_yearly'
    if (v.intervalCount === 3) return 'quarterly'
    return 'monthly'
  }
  return 'monthly'
}

function formatVariantPrice(v: PriceVariant): string {
  const amount = (v.amountCents / 100).toLocaleString('da-DK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${amount} ${v.currency}`
}

function billingDescription(v: PriceVariant): string {
  if (v.billingType === 'one_time') return 'Engangsbetaling'
  if (v.interval === 'year') return 'Pr. år'
  if (v.interval === 'month') {
    if (v.intervalCount === 1) return 'Pr. måned'
    if (v.intervalCount === 3) return 'Pr. 3. måned'
    if (v.intervalCount === 6) return 'Pr. 6. måned'
    return `Hver ${v.intervalCount}. måned`
  }
  return ''
}

export function PriceVariantsSection({
  productId,
  initialVariants,
}: {
  productId: string
  initialVariants: PriceVariant[]
}) {
  const [variants, setVariants] = useState<PriceVariant[]>(initialVariants)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm, position: String(variants.length) })
    setShowDialog(true)
  }

  function openEdit(v: PriceVariant) {
    setEditingId(v.id)
    setForm({
      label: v.label,
      description: v.description ?? '',
      priceDKK: (v.amountCents / 100).toString(),
      intervalChoice: billingToIntervalChoice(v),
      trialDays: v.trialDays?.toString() ?? '',
      position: v.position.toString(),
      isHighlighted: v.isHighlighted,
      isActive: v.isActive,
    })
    setShowDialog(true)
  }

  function buildPayload() {
    const billing = intervalChoiceToBilling(form.intervalChoice)
    return {
      label: form.label.trim(),
      description: form.description.trim() || undefined,
      amountCents: Math.round(parseFloat(form.priceDKK || '0') * 100),
      currency: 'DKK',
      ...billing,
      trialDays:
        billing.billingType === 'recurring' && form.trialDays
          ? parseInt(form.trialDays, 10)
          : null,
      position: parseInt(form.position || '0', 10),
      isHighlighted: form.isHighlighted,
      isActive: form.isActive,
    }
  }

  function handleSave() {
    if (!form.label.trim() || !form.priceDKK) {
      toast.error('Label og pris er påkrævet')
      return
    }
    const payload = buildPayload()
    startTransition(async () => {
      try {
        if (editingId) {
          const updated = await updatePriceVariantAction(editingId, payload)
          setVariants((prev) =>
            prev
              .map((v) =>
                v.id === editingId
                  ? {
                      ...v,
                      ...updated,
                      description: updated.description ?? null,
                      interval: updated.interval ?? null,
                      trialDays: updated.trialDays ?? null,
                    }
                  : v
              )
              .sort((a, b) => a.position - b.position)
          )
          toast.success('Variant opdateret')
        } else {
          const created = await createPriceVariantAction(productId, payload)
          setVariants((prev) =>
            [...prev, {
              ...created,
              description: created.description ?? null,
              interval: created.interval ?? null,
              trialDays: created.trialDays ?? null,
            }].sort((a, b) => a.position - b.position)
          )
          toast.success('Variant oprettet')
        }
        setShowDialog(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Kunne ikke gemme variant')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Slet denne prisvariant?')) return
    startTransition(async () => {
      const result = await deletePriceVariantAction(id)
      if (result.success) {
        setVariants((prev) => prev.filter((v) => v.id !== id))
        toast.success('Variant slettet')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Prisvarianter</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Tilføj variant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ingen prisvarianter endnu. Tilføj én eller flere prismodeller for dette produkt.
          </p>
        ) : (
          <div className="space-y-2">
            {variants.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-md border p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{v.label}</span>
                    {v.isHighlighted && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="size-3" /> Mest populær
                      </Badge>
                    )}
                    {!v.isActive && <Badge variant="outline">Inaktiv</Badge>}
                    {!v.stripePriceId && <Badge variant="outline">Ikke i Stripe</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatVariantPrice(v)} · {billingDescription(v)}
                    {v.trialDays ? ` · ${v.trialDays} dages prøve` : ''}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(v)}>
                  Rediger
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0 text-destructive"
                  onClick={() => handleDelete(v.id)}
                  disabled={isPending}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Rediger prisvariant' : 'Ny prisvariant'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label *</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="F.eks. Månedligt"
              />
            </div>
            <div className="space-y-2">
              <Label>Beskrivelse</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                placeholder="Kort beskrivelse til checkout-siden"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pris (DKK) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.priceDKK}
                  onChange={(e) => setForm((p) => ({ ...p, priceDKK: e.target.value }))}
                  placeholder="149"
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.position}
                  onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Faktureringstype</Label>
              <Select
                value={form.intervalChoice}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, intervalChoice: v as IntervalChoice }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">Engangsbetaling</SelectItem>
                  <SelectItem value="monthly">Hver måned</SelectItem>
                  <SelectItem value="quarterly">Hver 3. måned</SelectItem>
                  <SelectItem value="half_yearly">Hver 6. måned</SelectItem>
                  <SelectItem value="yearly">Hver år</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.intervalChoice !== 'one_time' && (
              <div className="space-y-2">
                <Label>Prøveperiode (dage)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.trialDays}
                  onChange={(e) => setForm((p) => ({ ...p, trialDays: e.target.value }))}
                  placeholder="7"
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isHighlighted}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isHighlighted: e.target.checked }))
                  }
                />
                Mest populær
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isActive: e.target.checked }))
                  }
                />
                Aktiv
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuller
              </Button>
              <Button type="button" onClick={handleSave} disabled={isPending}>
                {isPending ? 'Gemmer...' : 'Gem'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
