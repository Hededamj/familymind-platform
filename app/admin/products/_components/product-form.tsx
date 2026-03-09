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
  addBundleItemAction,
  removeBundleItemAction,
  syncToStripeAction,
  createModuleAction,
  updateModuleAction,
  deleteModuleAction,
  reorderModulesAction,
  assignLessonToModuleAction,
  updateProductImagesAction,
  updateLandingPageAction,
} from '../actions'
import {
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  RefreshCw,
  Loader2,
  Package,
  Info,
} from 'lucide-react'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

type ContentUnit = {
  id: string
  title: string
  slug: string
  mediaType: string
}

type CourseModule = {
  id: string
  title: string
  description: string | null
  position: number
}

type CourseLesson = {
  id: string
  contentUnitId: string
  moduleId: string | null
  position: number
  contentUnit: ContentUnit
  module: CourseModule | null
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
  coverImageUrl: string
  thumbnailUrl: string
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
  coverImageUrl: string | null
  thumbnailUrl: string | null
  landingPage: unknown
  courseLessons: CourseLesson[]
  modules: CourseModule[]
  bundleItems: BundleItem[]
}

type AvailableProduct = {
  id: string
  title: string
  type: string
}

type ProductFormProps = {
  mode: 'create' | 'edit'
  initialData?: Product
  availableContentUnits?: ContentUnit[]
  availableProducts?: AvailableProduct[]
}

export function ProductForm({
  mode,
  initialData,
  availableContentUnits = [],
  availableProducts = [],
}: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSyncing, setIsSyncing] = useState(false)
  const slugManuallyEdited = useRef(false)
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [showBundleDialog, setShowBundleDialog] = useState(false)
  const [lessons, setLessons] = useState<CourseLesson[]>(
    initialData?.courseLessons ?? []
  )
  const [bundleItems, setBundleItems] = useState<BundleItem[]>(
    initialData?.bundleItems ?? []
  )
  const [modules, setModules] = useState<CourseModule[]>(
    initialData?.modules ?? []
  )
  const [showModuleDialog, setShowModuleDialog] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')

  type LandingPageData = {
    subtitle: string
    benefits: string[]
    ctaText: string
    ctaUrl: string
  }

  const [landingPage, setLandingPage] = useState<LandingPageData>(() => {
    const lp = (initialData?.landingPage as Record<string, unknown>) || {}
    return {
      subtitle: (lp.subtitle as string) || '',
      benefits: (lp.benefits as string[]) || [],
      ctaText: (lp.ctaText as string) || '',
      ctaUrl: (lp.ctaUrl as string) || '',
    }
  })

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
    coverImageUrl: initialData?.coverImageUrl ?? '',
    thumbnailUrl: initialData?.thumbnailUrl ?? '',
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
              moduleId: null,
              position: prev.length + 1,
              contentUnit: unit,
              module: null,
            },
          ])
        }
        setShowLessonDialog(false)
        toast.success('Lektion tilfojet')
      } catch {
        toast.error('Kunne ikke tilføje lektion')
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

  async function handleAddBundleItem(includedProductId: string) {
    if (!initialData) return

    startTransition(async () => {
      try {
        await addBundleItemAction(initialData.id, includedProductId)
        const product = availableProducts.find(
          (p) => p.id === includedProductId
        )
        if (product) {
          setBundleItems((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              includedProductId: product.id,
              includedProduct: {
                id: product.id,
                title: product.title,
                type: product.type,
              },
            },
          ])
        }
        setShowBundleDialog(false)
        toast.success('Produkt tilfojet til pakke')
      } catch {
        toast.error('Kunne ikke tilføje produkt til pakke')
      }
    })
  }

  async function handleRemoveBundleItem(includedProductId: string) {
    if (!initialData) return

    startTransition(async () => {
      try {
        await removeBundleItemAction(initialData.id, includedProductId)
        setBundleItems((prev) =>
          prev.filter((item) => item.includedProductId !== includedProductId)
        )
        toast.success('Produkt fjernet fra pakke')
      } catch {
        toast.error('Kunne ikke fjerne produkt fra pakke')
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

  async function handleCreateModule() {
    if (!initialData || !newModuleTitle.trim()) return
    startTransition(async () => {
      try {
        const mod = await createModuleAction(initialData.id, { title: newModuleTitle.trim() })
        setModules(prev => [...prev, { ...mod, description: mod.description ?? null }])
        setNewModuleTitle('')
        setShowModuleDialog(false)
        toast.success('Modul oprettet')
      } catch {
        toast.error('Kunne ikke oprette modul')
      }
    })
  }

  async function handleDeleteModule(moduleId: string) {
    startTransition(async () => {
      try {
        await deleteModuleAction(moduleId)
        setModules(prev => prev.filter(m => m.id !== moduleId))
        // Unassign lessons from this module locally
        setLessons(prev => prev.map(l => l.moduleId === moduleId ? { ...l, moduleId: null, module: null } : l))
        toast.success('Modul slettet')
      } catch {
        toast.error('Kunne ikke slette modul')
      }
    })
  }

  async function handleMoveModule(index: number, direction: 'up' | 'down') {
    if (!initialData) return
    const newModules = [...modules]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newModules.length) return
    ;[newModules[index], newModules[swapIndex]] = [newModules[swapIndex], newModules[index]]
    const reordered = newModules.map((m, i) => ({ ...m, position: i + 1 }))
    setModules(reordered)
    startTransition(async () => {
      try {
        await reorderModulesAction(initialData.id, reordered.map(m => m.id))
      } catch {
        setModules(modules)
        toast.error('Kunne ikke omsortere moduler')
      }
    })
  }

  async function handleAssignLessonToModule(lessonId: string, moduleId: string | null) {
    startTransition(async () => {
      try {
        await assignLessonToModuleAction(lessonId, moduleId)
        setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, moduleId, module: moduleId ? modules.find(m => m.id === moduleId) || null : null } : l))
        toast.success('Lektion flyttet')
      } catch {
        toast.error('Kunne ikke flytte lektion')
      }
    })
  }

  async function handleSaveImages() {
    if (!initialData) return
    startTransition(async () => {
      try {
        await updateProductImagesAction(initialData.id, {
          coverImageUrl: formData.coverImageUrl || undefined,
          thumbnailUrl: formData.thumbnailUrl || undefined,
        })
        toast.success('Billeder gemt')
      } catch {
        toast.error('Kunne ikke gemme billeder')
      }
    })
  }

  async function handleSaveLandingPage() {
    if (!initialData) return
    startTransition(async () => {
      try {
        await updateLandingPageAction(initialData.id, {
          subtitle: landingPage.subtitle,
          benefits: landingPage.benefits.filter(Boolean),
          ctaText: landingPage.ctaText,
          ctaUrl: landingPage.ctaUrl,
        })
        toast.success('Landing page gemt')
      } catch {
        toast.error('Kunne ikke gemme landing page')
      }
    })
  }

  // Content units not yet added as lessons
  const availableLessonUnits = availableContentUnits.filter(
    (unit) => !lessons.some((l) => l.contentUnitId === unit.id)
  )

  // Products not yet added to bundle (excludes bundles and self, already filtered server-side)
  const availableBundleProducts = availableProducts.filter(
    (product) =>
      !bundleItems.some((item) => item.includedProductId === product.id)
  )

  // For SINGLE type: the linked content unit (first lesson)
  const singleContentUnit = formData.type === 'SINGLE' ? lessons[0] ?? null : null

  // Content units available for SINGLE type (not yet linked)
  const availableSingleUnits = availableContentUnits.filter(
    (unit) => !lessons.some((l) => l.contentUnitId === unit.id)
  )

  const productTypeLabels: Record<string, string> = {
    SUBSCRIPTION: 'Abonnement',
    COURSE: 'Kursus',
    SINGLE: 'Enkeltstående',
    BUNDLE: 'Pakke',
  }

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
                pattern="^[a-z0-9-]+$"
                title="Slug skal bestå af små bogstaver, tal og bindestreger"
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
              placeholder="Tilføj en beskrivelse..."
              rows={4}
            />
          </div>

          {mode === 'edit' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">Coverbillede URL</Label>
                <Input
                  id="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">Bruges på landing page og browse-side</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">Lille billede til kort og lister</p>
              </div>
            </div>
          )}
          {mode === 'edit' && (formData.coverImageUrl || formData.thumbnailUrl) && (
            <Button type="button" variant="outline" size="sm" onClick={handleSaveImages} disabled={isPending}>
              Gem billeder
            </Button>
          )}

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
                  <SelectItem value="SINGLE">Enkeltstående</SelectItem>
                  <SelectItem value="BUNDLE">Pakke</SelectItem>
                </SelectContent>
              </Select>
              {mode === 'edit' && (
                <p className="text-xs text-muted-foreground">
                  Produkttype kan ikke ændres efter oprettelse
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

      {/* Modules (only for COURSE type in edit mode) */}
      {formData.type === 'COURSE' && mode === 'edit' && initialData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Moduler</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowModuleDialog(true)} disabled={isPending}>
                <Plus className="mr-2 size-4" />
                Tilføj modul
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ingen moduler oprettet endnu. Moduler grupperer lektioner i logiske sektioner.
              </p>
            ) : (
              <div className="space-y-3">
                {modules.map((mod, index) => {
                  const moduleLessons = lessons.filter(l => l.moduleId === mod.id)
                  return (
                    <div key={mod.id} className="rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{mod.title}</div>
                          {mod.description && <div className="text-xs text-muted-foreground">{mod.description}</div>}
                          <div className="text-xs text-muted-foreground">{moduleLessons.length} lektioner</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="sm" className="size-8 p-0" onClick={() => handleMoveModule(index, 'up')} disabled={index === 0 || isPending}>
                            <ArrowUp className="size-4" /><span className="sr-only">Flyt op</span>
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="size-8 p-0" onClick={() => handleMoveModule(index, 'down')} disabled={index === modules.length - 1 || isPending}>
                            <ArrowDown className="size-4" /><span className="sr-only">Flyt ned</span>
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="size-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteModule(mod.id)} disabled={isPending}>
                            <X className="size-4" /><span className="sr-only">Slet</span>
                          </Button>
                        </div>
                      </div>
                      {moduleLessons.length > 0 && (
                        <div className="mt-3 space-y-1 border-t pt-3">
                          {moduleLessons.map(l => (
                            <div key={l.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                              {l.contentUnit.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {/* Unassigned lessons */}
            {lessons.filter(l => !l.moduleId).length > 0 && modules.length > 0 && (
              <div className="mt-4 rounded-lg border border-dashed p-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Ikke-tildelte lektioner</p>
                <div className="space-y-2">
                  {lessons.filter(l => !l.moduleId).map(l => (
                    <div key={l.id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm">{l.contentUnit.title}</span>
                      <Select onValueChange={(v) => handleAssignLessonToModule(l.id, v)} defaultValue="">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Flyt til modul" />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                Tilføj lektion
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ingen lektioner tilfojet endnu. Tilføj indhold som lektioner
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
                    {modules.length > 0 && (
                      <Select
                        value={lesson.moduleId || 'none'}
                        onValueChange={(v) => handleAssignLessonToModule(lesson.id, v === 'none' ? null : v)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ingen modul</SelectItem>
                          {modules.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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

      {/* Bundle Items (only for BUNDLE type in edit mode) */}
      {formData.type === 'BUNDLE' && mode === 'edit' && initialData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pakkeindhold</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowBundleDialog(true)}
                disabled={isPending || availableBundleProducts.length === 0}
              >
                <Plus className="mr-2 size-4" />
                Tilføj produkt
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {bundleItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ingen produkter tilfojet endnu. Tilføj produkter til denne
                pakke.
              </p>
            ) : (
              <div className="space-y-2">
                {bundleItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-md border p-3"
                  >
                    <Package className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {item.includedProduct.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {productTypeLabels[item.includedProduct.type] ??
                          item.includedProduct.type}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-destructive hover:text-destructive"
                      onClick={() =>
                        handleRemoveBundleItem(item.includedProductId)
                      }
                      disabled={isPending}
                    >
                      <X className="size-4" />
                      <span className="sr-only">Fjern</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bundle placeholder for create mode */}
      {formData.type === 'BUNDLE' && mode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Pakkeindhold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Produkter kan tilfojes til pakken efter oprettelse.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Single Content Unit (only for SINGLE type in edit mode) */}
      {formData.type === 'SINGLE' && mode === 'edit' && initialData && (
        <Card>
          <CardHeader>
            <CardTitle>Indhold</CardTitle>
          </CardHeader>
          <CardContent>
            {singleContentUnit ? (
              <div className="flex items-center gap-3 rounded-md border p-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {singleContentUnit.contentUnit.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {singleContentUnit.contentUnit.mediaType} &middot; /
                    {singleContentUnit.contentUnit.slug}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await handleRemoveLesson(singleContentUnit.contentUnitId)
                    setShowLessonDialog(true)
                  }}
                  disabled={isPending}
                >
                  Skift
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Intet indhold tilknyttet endnu. Vælg en indholdsenhed til
                  dette produkt.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLessonDialog(true)}
                  disabled={isPending || availableSingleUnits.length === 0}
                >
                  <Plus className="mr-2 size-4" />
                  Vælg indhold
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Single placeholder for create mode */}
      {formData.type === 'SINGLE' && mode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Indhold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Indhold kan tilknyttes efter oprettelse af produktet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Landing Page (for COURSE and BUNDLE types in edit mode) */}
      {(formData.type === 'COURSE' || formData.type === 'BUNDLE') && mode === 'edit' && initialData && (
        <Card>
          <CardHeader>
            <CardTitle>Landing page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Undertitel</Label>
              <Input
                value={landingPage.subtitle}
                onChange={(e) => setLandingPage(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Kort undertitel til hero-sektionen"
              />
            </div>
            <div className="space-y-2">
              <Label>Fordele (én per linje)</Label>
              <Textarea
                value={landingPage.benefits.join('\n')}
                onChange={(e) => setLandingPage(prev => ({ ...prev, benefits: e.target.value.split('\n') }))}
                rows={4}
                placeholder={"Forstå hvad der driver dit barns angst\nLær konkrete værktøjer\nSkab ro i hverdagen"}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA knaptekst</Label>
                <Input
                  value={landingPage.ctaText}
                  onChange={(e) => setLandingPage(prev => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="Start nu"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA link</Label>
                <Input
                  value={landingPage.ctaUrl}
                  onChange={(e) => setLandingPage(prev => ({ ...prev, ctaUrl: e.target.value }))}
                  placeholder="/subscribe"
                />
              </div>
            </div>
            <Button type="button" variant="outline" onClick={handleSaveLandingPage} disabled={isPending}>
              Gem landing page
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Subscription Info */}
      {formData.type === 'SUBSCRIPTION' && (
        <Card>
          <CardHeader>
            <CardTitle>Abonnement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-4">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="space-y-1 text-sm">
                <p>
                  Abonnementsproduktet giver adgang til alt indhold markeret med
                  "Abonnement" adgangsniveau.
                </p>
                <p className="text-muted-foreground">
                  Stripe-synkronisering opretter en gentagende månedlig pris
                  baseret pådet angivne beløb.
                </p>
              </div>
            </div>
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
              : 'Gem ændringer'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
        >
          Annuller
        </Button>
      </div>

      {/* Add Lesson / Content Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formData.type === 'SINGLE'
                ? 'Vælg indhold'
                : 'Tilføj lektion'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {(formData.type === 'SINGLE'
              ? availableSingleUnits
              : availableLessonUnits
            ).length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Intet tilgængeligt indhold at tilføje.
              </p>
            ) : (
              <div className="space-y-2">
                {(formData.type === 'SINGLE'
                  ? availableSingleUnits
                  : availableLessonUnits
                ).map((unit) => (
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
                        {unit.mediaType}
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

      {/* Add Bundle Item Dialog */}
      <Dialog open={showBundleDialog} onOpenChange={setShowBundleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilføj produkt til pakke</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {availableBundleProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Ingen tilgængelige produkter at tilføje.
              </p>
            ) : (
              <div className="space-y-2">
                {availableBundleProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent"
                    onClick={() => handleAddBundleItem(product.id)}
                    disabled={isPending}
                  >
                    <Package className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {product.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {productTypeLabels[product.type] ?? product.type}
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

      {/* Add Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilføj modul</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Modultitel *</Label>
              <Input
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="F.eks. Grundlæggende teknikker"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModuleDialog(false)}>Annuller</Button>
              <Button type="button" onClick={handleCreateModule} disabled={!newModuleTitle.trim() || isPending}>Opret modul</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
