'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  createProductAction,
  updateProductAction,
  addLessonAction,
  removeLessonAction,
  reorderLessonsAction,
  syncToStripeAction,
} from '../actions'
import {
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  RefreshCw,
  Loader2,
} from 'lucide-react'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9æøå]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

type ContentUnit = {
  id: string
  title: string
  slug: string
  mediaType: string
}

type CourseLesson = {
  id: string
  contentUnitId: string
  position: number
  contentUnit: ContentUnit
}

type BundleItem = {
  id: string
  includedProductId: string
  includedProduct: {
    id: string
    title: string
    type: string
  }
}

type ProductFormData = {
  title: string
  description: string
  slug: string
  type: 'SUBSCRIPTION' | 'COURSE' | 'SINGLE' | 'BUNDLE'
  priceAmountDKK: string
  priceCurrency: string
  isActive: boolean
}

type Product = {
  id: string
  title: string
  description: string | null
  slug: string
  type: 'SUBSCRIPTION' | 'COURSE' | 'SINGLE' | 'BUNDLE'
  priceAmountCents: number
  priceCurrency: string
  stripeProductId: string | null
  stripePriceId: string | null
  isActive: boolean
  courseLessons: CourseLesson[]
  bundleItems: BundleItem[]
}

type ProductFormProps = {
  mode: 'create' | 'edit'
  initialData?: Product
  availableContentUnits?: ContentUnit[]
}

export function ProductForm({
  mode,
  initialData,
  availableContentUnits = [],
}: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSyncing, setIsSyncing] = useState(false)
  const slugManuallyEdited = useRef(false)
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [lessons, setLessons] = useState<CourseLesson[]>(
    initialData?.courseLessons ?? []
  )

  const [formData, setFormData] = useState<ProductFormData>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    slug: initialData?.slug ?? '',
    type: initialData?.type ?? 'COURSE',
    priceAmountDKK: initialData
      ? (initialData.priceAmountCents / 100).toString()
      : '',
    priceCurrency: initialData?.priceCurrency ?? 'DKK',
    isActive: initialData?.isActive ?? true,
  })

  // In edit mode, consider slug as manually edited
  useEffect(() => {
    if (mode === 'edit') {
      slugManuallyEdited.current = true
    }
  }, [mode])

  function handleTitleChange(title: string) {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: slugManuallyEdited.current ? prev.slug : generateSlug(title),
    }))
  }

  function handleSlugChange(slug: string) {
    slugManuallyEdited.current = true
    setFormData((prev) => ({ ...prev, slug }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const priceAmountCents = Math.round(
      parseFloat(formData.priceAmountDKK || '0') * 100
    )

    const payload = {
      title: formData.title,
      description: formData.description || undefined,
      slug: formData.slug,
      type: formData.type,
      priceAmountCents,
      priceCurrency: formData.priceCurrency,
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createProductAction(payload)
          toast.success('Produkt oprettet')
        } else {
          await updateProductAction(initialData!.id, payload)
          toast.success('Produkt opdateret')
        }
        router.push('/admin/products')
      } catch (error) {
        toast.error(
          mode === 'create'
            ? 'Kunne ikke oprette produkt'
            : 'Kunne ikke opdatere produkt'
        )
        console.error(error)
      }
    })
  }

  async function handleAddLesson(contentUnitId: string) {
    if (!initialData) return

    startTransition(async () => {
      try {
        await addLessonAction(initialData.id, contentUnitId)
        // Update local state optimistically
        const unit = availableContentUnits.find(
          (u) => u.id === contentUnitId
        )
        if (unit) {
          setLessons((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(), // temporary ID until revalidation
              contentUnitId: unit.id,
              position: prev.length + 1,
              contentUnit: unit,
            },
          ])
        }
        setShowLessonDialog(false)
        toast.success('Lektion tilfojet')
      } catch {
        toast.error('Kunne ikke tilfoeje lektion')
      }
    })
  }

  async function handleRemoveLesson(contentUnitId: string) {
    if (!initialData) return

    startTransition(async () => {
      try {
        await removeLessonAction(initialData.id, contentUnitId)
        setLessons((prev) =>
          prev.filter((l) => l.contentUnitId !== contentUnitId)
        )
        toast.success('Lektion fjernet')
      } catch {
        toast.error('Kunne ikke fjerne lektion')
      }
    })
  }

  async function handleMoveLesson(index: number, direction: 'up' | 'down') {
    if (!initialData) return

    const newLessons = [...lessons]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newLessons.length) return

    ;[newLessons[index], newLessons[swapIndex]] = [
      newLessons[swapIndex],
      newLessons[index],
    ]

    // Update positions
    const reordered = newLessons.map((l, i) => ({ ...l, position: i + 1 }))
    setLessons(reordered)

    startTransition(async () => {
      try {
        await reorderLessonsAction(
          initialData.id,
          reordered.map((l) => l.id)
        )
      } catch {
        // Revert on error
        setLessons(lessons)
        toast.error('Kunne ikke omsortere lektioner')
      }
    })
  }

  async function handleSyncToStripe() {
    if (!initialData) return

    setIsSyncing(true)
    try {
      const result = await syncToStripeAction(initialData.id)
      if (result.success) {
        toast.success('Produkt synkroniseret med Stripe')
      } else {
        toast.error(result.error ?? 'Stripe-synkronisering fejlede')
      }
    } catch {
      toast.error('Stripe-synkronisering fejlede')
    } finally {
      setIsSyncing(false)
    }
  }

  // Content units not yet added as lessons
  const availableLessonUnits = availableContentUnits.filter(
    (unit) => !lessons.some((l) => l.contentUnitId === unit.id)
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Grundoplysninger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Indtast titel"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="auto-genereret-slug"
                required
                pattern="^[a-z0-9æøå-]+$"
                title="Slug skal bestaa af smaa bogstaver, tal og bindestreger"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Tilfoej en beskrivelse..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Produkttype *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as ProductFormData['type'],
                  }))
                }
                disabled={mode === 'edit'}
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBSCRIPTION">Abonnement</SelectItem>
                  <SelectItem value="COURSE">Kursus</SelectItem>
                  <SelectItem value="SINGLE">Enkeltstaaende</SelectItem>
                  <SelectItem value="BUNDLE">Pakke</SelectItem>
                </SelectContent>
              </Select>
              {mode === 'edit' && (
                <p className="text-xs text-muted-foreground">
                  Produkttype kan ikke aendres efter oprettelse
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Pris (DKK) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.priceAmountDKK}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priceAmountDKK: e.target.value,
                  }))
                }
                placeholder="F.eks. 149"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Valuta</Label>
              <Input
                id="currency"
                value={formData.priceCurrency}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priceCurrency: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="DKK"
              />
            </div>
          </div>

          {mode === 'edit' && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-input"
                />
                Aktiv
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Lessons (only for COURSE type in edit mode) */}
      {formData.type === 'COURSE' && mode === 'edit' && initialData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lektioner</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowLessonDialog(true)}
                disabled={isPending || availableLessonUnits.length === 0}
              >
                <Plus className="mr-2 size-4" />
                Tilfoej lektion
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ingen lektioner tilfojet endnu. Tilfoej indhold som lektioner
                til dette kursus.
              </p>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 rounded-md border p-3"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {lesson.contentUnit.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lesson.contentUnit.mediaType} &middot; /
                        {lesson.contentUnit.slug}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0"
                        onClick={() => handleMoveLesson(index, 'up')}
                        disabled={index === 0 || isPending}
                      >
                        <ArrowUp className="size-4" />
                        <span className="sr-only">Flyt op</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0"
                        onClick={() => handleMoveLesson(index, 'down')}
                        disabled={
                          index === lessons.length - 1 || isPending
                        }
                      >
                        <ArrowDown className="size-4" />
                        <span className="sr-only">Flyt ned</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-destructive hover:text-destructive"
                        onClick={() =>
                          handleRemoveLesson(lesson.contentUnitId)
                        }
                        disabled={isPending}
                      >
                        <X className="size-4" />
                        <span className="sr-only">Fjern</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Course Lessons placeholder for create mode */}
      {formData.type === 'COURSE' && mode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Lektioner</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Lektioner kan tilfojes efter oprettelse af kurset.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bundle placeholder */}
      {formData.type === 'BUNDLE' && (
        <Card>
          <CardHeader>
            <CardTitle>Pakkeindhold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bundle items administreres efter oprettelse.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stripe Sync (edit mode only) */}
      {mode === 'edit' && initialData && (
        <Card>
          <CardHeader>
            <CardTitle>Stripe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                {initialData.stripeProductId ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Synkroniseret</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Produkt-ID: {initialData.stripeProductId}
                    </p>
                    {initialData.stripePriceId && (
                      <p className="text-xs text-muted-foreground">
                        Pris-ID: {initialData.stripePriceId}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Produktet er endnu ikke synkroniseret med Stripe.
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSyncToStripe}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 size-4" />
                )}
                Synkroniser med Stripe
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? mode === 'create'
              ? 'Opretter...'
              : 'Gemmer...'
            : mode === 'create'
              ? 'Opret produkt'
              : 'Gem aendringer'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
        >
          Annuller
        </Button>
      </div>

      {/* Add Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilfoej lektion</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {availableLessonUnits.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Intet tilgaengeligt indhold at tilfoeje.
              </p>
            ) : (
              <div className="space-y-2">
                {availableLessonUnits.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent"
                    onClick={() => handleAddLesson(unit.id)}
                    disabled={isPending}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{unit.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {unit.mediaType} &middot; /{unit.slug}
                      </div>
                    </div>
                    <Plus className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
