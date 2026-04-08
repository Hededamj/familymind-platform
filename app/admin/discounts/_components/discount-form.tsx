'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createDiscountAction, updateDiscountAction } from '../actions'

type CourseOption = { id: string; title: string }
type BundleOption = { id: string; title: string }

type DiscountInitialData = {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  maxUses: number | null
  validFrom: Date
  validUntil: Date | null
  applicableCourseId: string | null
  applicableBundleId: string | null
  isActive: boolean
  duration: 'once' | 'repeating' | 'forever'
  durationInMonths: number | null
}

type DiscountFormProps = {
  mode: 'create' | 'edit'
  initialData?: DiscountInitialData
  courses: CourseOption[]
  bundles: BundleOption[]
}

type Target = 'all' | 'course' | 'bundle'

function dateToInput(d: Date | null | undefined): string {
  if (!d) return ''
  return d.toISOString().slice(0, 10)
}

export function DiscountForm({ mode, initialData, courses, bundles }: DiscountFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [code, setCode] = useState(initialData?.code ?? '')
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>(
    initialData?.type ?? 'PERCENTAGE'
  )
  const [value, setValue] = useState(
    initialData ? (type === 'FIXED_AMOUNT' ? (initialData.value / 100).toString() : initialData.value.toString()) : ''
  )
  const [maxUses, setMaxUses] = useState(initialData?.maxUses?.toString() ?? '')
  const [validFrom, setValidFrom] = useState(dateToInput(initialData?.validFrom))
  const [validUntil, setValidUntil] = useState(dateToInput(initialData?.validUntil))
  const [duration, setDuration] = useState<'once' | 'repeating' | 'forever'>(
    initialData?.duration ?? 'once'
  )
  const [durationInMonths, setDurationInMonths] = useState(
    initialData?.durationInMonths?.toString() ?? '3'
  )
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)

  const initialTarget: Target = initialData?.applicableCourseId
    ? 'course'
    : initialData?.applicableBundleId
      ? 'bundle'
      : 'all'
  const [target, setTarget] = useState<Target>(initialTarget)
  const [courseId, setCourseId] = useState(initialData?.applicableCourseId ?? '')
  const [bundleId, setBundleId] = useState(initialData?.applicableBundleId ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!code.trim()) {
      toast.error('Kode er påkrævet')
      return
    }
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      toast.error('Værdi skal være større end 0')
      return
    }

    // Convert FIXED_AMOUNT DKK to cents
    const valueInCents = type === 'FIXED_AMOUNT' ? Math.round(numValue * 100) : numValue

    const payload = {
      code: code.trim().toUpperCase(),
      type,
      value: valueInCents,
      maxUses: maxUses ? parseInt(maxUses, 10) : null,
      validFrom: validFrom || undefined,
      validUntil: validUntil || null,
      applicableCourseId: target === 'course' ? courseId || null : null,
      applicableBundleId: target === 'bundle' ? bundleId || null : null,
      isActive,
      duration,
      durationInMonths: duration === 'repeating' ? parseInt(durationInMonths, 10) : null,
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createDiscountAction(payload)
          toast.success('Rabatkode oprettet')
        } else if (initialData) {
          await updateDiscountAction(initialData.id, {
            code: payload.code,
            maxUses: payload.maxUses,
            validUntil: payload.validUntil,
            applicableCourseId: payload.applicableCourseId,
            applicableBundleId: payload.applicableBundleId,
            isActive: payload.isActive,
          })
          toast.success('Rabatkode opdateret')
        }
        router.push('/admin/discounts')
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Kunne ikke gemme rabatkode'
        toast.error(msg)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="code">Kode *</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="F.eks. WELCOME50"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Type *</Label>
        <Select value={type} onValueChange={(v) => setType(v as 'PERCENTAGE' | 'FIXED_AMOUNT')} disabled={mode === 'edit'}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PERCENTAGE">Procent rabat</SelectItem>
            <SelectItem value="FIXED_AMOUNT">Fast beløb (DKK)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">
          Værdi * {type === 'PERCENTAGE' ? '(%)' : '(DKK)'}
        </Label>
        <Input
          id="value"
          type="number"
          min="1"
          step={type === 'FIXED_AMOUNT' ? '0.01' : '1'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          disabled={mode === 'edit'}
        />
      </div>

      <div className="space-y-2">
        <Label>Varighed (for abonnementer) *</Label>
        <Select value={duration} onValueChange={(v) => setDuration(v as 'once' | 'repeating' | 'forever')} disabled={mode === 'edit'}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">Én gang (kun første betaling)</SelectItem>
            <SelectItem value="repeating">Gentages i N måneder</SelectItem>
            <SelectItem value="forever">For altid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {duration === 'repeating' && (
        <div className="space-y-2">
          <Label htmlFor="durationInMonths">Antal måneder *</Label>
          <Input
            id="durationInMonths"
            type="number"
            min="1"
            max="36"
            value={durationInMonths}
            onChange={(e) => setDurationInMonths(e.target.value)}
            required
            disabled={mode === 'edit'}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="maxUses">Maks. antal brug (valgfrit)</Label>
        <Input
          id="maxUses"
          type="number"
          min="1"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          placeholder="Lad være tom for ubegrænset"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="validFrom">Gyldig fra</Label>
          <Input
            id="validFrom"
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="validUntil">Gyldig til (valgfrit)</Label>
          <Input
            id="validUntil"
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Gælder for</Label>
        <Select value={target} onValueChange={(v) => setTarget(v as Target)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kurser og bundler</SelectItem>
            <SelectItem value="course">Specifikt kursus</SelectItem>
            <SelectItem value="bundle">Specifik bundel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {target === 'course' && (
        <div className="space-y-2">
          <Label>Vælg kursus *</Label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Vælg et kursus" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {target === 'bundle' && (
        <div className="space-y-2">
          <Label>Vælg bundel *</Label>
          <Select value={bundleId} onValueChange={setBundleId}>
            <SelectTrigger>
              <SelectValue placeholder="Vælg en bundel" />
            </SelectTrigger>
            <SelectContent>
              {bundles.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="isActive">Aktiv</Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Gemmer...' : mode === 'create' ? 'Opret rabatkode' : 'Gem ændringer'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/discounts')}
          disabled={isPending}
        >
          Annullér
        </Button>
      </div>
    </form>
  )
}
export default DiscountForm
