'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { createDiscountAction, updateDiscountAction } from '../actions'

type Product = {
  id: string
  title: string
}

type DiscountData = {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  maxUses: number | null
  currentUses: number
  validFrom: Date
  validUntil: Date | null
  applicableProductId: string | null
  isActive: boolean
  duration?: string
  durationInMonths?: number | null
}

type DiscountFormProps = {
  mode: 'create' | 'edit'
  initialData?: DiscountData
  products: Product[]
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

const NO_PRODUCT = '__none__'

export function DiscountForm({ mode, initialData, products }: DiscountFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [code, setCode] = useState(initialData?.code ?? '')
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>(
    initialData?.type ?? 'PERCENTAGE'
  )
  const [value, setValue] = useState(
    initialData
      ? initialData.type === 'FIXED_AMOUNT'
        ? (initialData.value / 100).toString()
        : initialData.value.toString()
      : ''
  )
  const [maxUses, setMaxUses] = useState(
    initialData?.maxUses?.toString() ?? ''
  )
  const [validFrom, setValidFrom] = useState(
    initialData ? formatDateForInput(initialData.validFrom) : formatDateForInput(new Date())
  )
  const [validUntil, setValidUntil] = useState(
    initialData?.validUntil ? formatDateForInput(initialData.validUntil) : ''
  )
  const [applicableProductId, setApplicableProductId] = useState(
    initialData?.applicableProductId ?? NO_PRODUCT
  )
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)
  const [duration, setDuration] = useState(initialData?.duration ?? 'once')
  const [durationInMonths, setDurationInMonths] = useState(
    initialData?.durationInMonths?.toString() ?? ''
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const numericValue =
      type === 'FIXED_AMOUNT'
        ? Math.round(parseFloat(value || '0') * 100)
        : parseInt(value || '0', 10)

    if (type === 'PERCENTAGE' && (numericValue < 0 || numericValue > 100)) {
      toast.error('Procentværdi skal være mellem 0 og 100')
      return
    }

    if (type === 'FIXED_AMOUNT' && numericValue < 0) {
      toast.error('Beløb skal være positivt')
      return
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createDiscountAction({
            code,
            type,
            value: numericValue,
            maxUses: maxUses ? parseInt(maxUses, 10) : null,
            validFrom,
            validUntil: validUntil || null,
            applicableProductId:
              applicableProductId === NO_PRODUCT ? null : applicableProductId,
            isActive,
            duration,
            durationInMonths: durationInMonths ? parseInt(durationInMonths, 10) : null,
          })
          toast.success('Rabatkode oprettet')
        } else {
          await updateDiscountAction(initialData!.id, {
            code,
            maxUses: maxUses ? parseInt(maxUses, 10) : null,
            validUntil: validUntil || null,
            applicableProductId:
              applicableProductId === NO_PRODUCT ? null : applicableProductId,
            isActive,
          })
          toast.success('Rabatkode opdateret')
        }
        router.push('/admin/discounts')
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : (mode === 'create'
              ? 'Kunne ikke oprette rabatkode'
              : 'Kunne ikke opdatere rabatkode')
        toast.error(message)
        console.error(error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Rabatkodeoplysninger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="F.eks. SOMMER2026"
                required
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Konverteres automatisk til store bogstaver
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={type}
                onValueChange={(v) =>
                  setType(v as 'PERCENTAGE' | 'FIXED_AMOUNT')
                }
                disabled={mode === 'edit'}
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Procent</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Fast beløb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">
                {type === 'PERCENTAGE' ? 'Procent (%) *' : 'Beløb (DKK) *'}
              </Label>
              <div className="relative">
                <Input
                  id="value"
                  type="number"
                  min="0"
                  max={type === 'PERCENTAGE' ? '100' : undefined}
                  step={type === 'FIXED_AMOUNT' ? '0.01' : '1'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === 'PERCENTAGE' ? 'F.eks. 20' : 'F.eks. 50'}
                  required
                  disabled={mode === 'edit'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {type === 'PERCENTAGE' ? '%' : 'DKK'}
                </span>
              </div>
              {type === 'PERCENTAGE' && (
                <p className="text-xs text-muted-foreground">
                  Angiv en værdi mellem 0 og 100
                </p>
              )}
              {type === 'FIXED_AMOUNT' && (
                <p className="text-xs text-muted-foreground">
                  Angiv beløb i DKK (gemmes i øre)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses">Maks antal brug</Label>
              <Input
                id="maxUses"
                type="number"
                min="0"
                step="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Ubegrænset"
              />
              <p className="text-xs text-muted-foreground">
                Lad feltet være tomt for ubegrænset brug
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gyldighed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Gyldig fra *</Label>
              <Input
                id="validFrom"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Gyldig til</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lad feltet være tomt for ingen udløbsdato
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Varighed for abonnementer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Rabatvarighed</Label>
            <Select
              value={duration}
              onValueChange={setDuration}
              disabled={mode === 'edit'}
            >
              <SelectTrigger id="duration" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Kun første betaling</SelectItem>
                <SelectItem value="repeating">Antal måneder</SelectItem>
                <SelectItem value="forever">For evigt</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              For engangskøb gælder rabatten altid hele beløbet uanset denne indstilling
            </p>
          </div>
          {duration === 'repeating' && (
            <div className="space-y-2">
              <Label htmlFor="durationInMonths">Antal måneder</Label>
              <Input
                id="durationInMonths"
                type="number"
                min="1"
                max="36"
                step="1"
                value={durationInMonths}
                onChange={(e) => setDurationInMonths(e.target.value)}
                placeholder="F.eks. 3"
                required
                disabled={mode === 'edit'}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anvendelse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Gælder for produkt</Label>
            <Select
              value={applicableProductId}
              onValueChange={setApplicableProductId}
            >
              <SelectTrigger id="product" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PRODUCT}>Alle produkter</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Vælg et specifikt produkt eller lad rabatten gælde for alle
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded border-input"
              />
              Aktiv
            </label>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? mode === 'create'
              ? 'Opretter...'
              : 'Gemmer...'
            : mode === 'create'
              ? 'Opret rabatkode'
              : 'Gem ændringer'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/discounts')}
        >
          Annuller
        </Button>
      </div>
    </form>
  )
}
