'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createJourneyAction, updateJourneyAction } from '../actions'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

type JourneyFormData = {
  title: string
  description: string
  slug: string
  targetAgeMin: string
  targetAgeMax: string
  estimatedDays: string
  isActive: boolean
  productId: string | null
}

type JourneyFormProps = {
  mode: 'create' | 'edit'
  initialData?: {
    id: string
    title: string
    description: string | null
    slug: string
    targetAgeMin: number | null
    targetAgeMax: number | null
    estimatedDays: number | null
    isActive: boolean
    productId: string | null
  }
  availableCourses?: Array<{ id: string; title: string; slug: string }>
}

export function JourneyForm({ mode, initialData, availableCourses = [] }: JourneyFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const slugManuallyEdited = useRef(false)

  const [formData, setFormData] = useState<JourneyFormData>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    slug: initialData?.slug ?? '',
    targetAgeMin: initialData?.targetAgeMin?.toString() ?? '',
    targetAgeMax: initialData?.targetAgeMax?.toString() ?? '',
    estimatedDays: initialData?.estimatedDays?.toString() ?? '',
    isActive: initialData?.isActive ?? true,
    productId: initialData?.productId ?? null,
  })

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

    startTransition(async () => {
      try {
        if (mode === 'create') {
          const result = await createJourneyAction({
            title: formData.title,
            description: formData.description || undefined,
            slug: formData.slug,
            targetAgeMin: formData.targetAgeMin
              ? parseInt(formData.targetAgeMin, 10)
              : undefined,
            targetAgeMax: formData.targetAgeMax
              ? parseInt(formData.targetAgeMax, 10)
              : undefined,
            estimatedDays: formData.estimatedDays
              ? parseInt(formData.estimatedDays, 10)
              : undefined,
          })
          toast.success('Forløb oprettet')
          router.push(`/admin/journeys/${result.id}/edit`)
        } else {
          await updateJourneyAction(initialData!.id, {
            title: formData.title,
            description: formData.description || null,
            slug: formData.slug,
            targetAgeMin: formData.targetAgeMin
              ? parseInt(formData.targetAgeMin, 10)
              : null,
            targetAgeMax: formData.targetAgeMax
              ? parseInt(formData.targetAgeMax, 10)
              : null,
            estimatedDays: formData.estimatedDays
              ? parseInt(formData.estimatedDays, 10)
              : null,
            isActive: formData.isActive,
            productId: formData.productId,
          })
          toast.success('Forløb opdateret')
          router.refresh()
        }
      } catch (error) {
        toast.error(
          mode === 'create'
            ? 'Kunne ikke oprette forløb'
            : 'Kunne ikke opdatere forløb'
        )
        console.error(error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
                placeholder="F.eks. Søvnforløbet"
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
              placeholder="Beskriv forløbet..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detaljer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAgeMin">Min. alder (år)</Label>
              <Input
                id="targetAgeMin"
                type="number"
                min="0"
                value={formData.targetAgeMin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetAgeMin: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAgeMax">Maks. alder (år)</Label>
              <Input
                id="targetAgeMax"
                type="number"
                min="0"
                value={formData.targetAgeMax}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetAgeMax: e.target.value,
                  }))
                }
                placeholder="36"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDays">Estimerede dage</Label>
              <Input
                id="estimatedDays"
                type="number"
                min="1"
                value={formData.estimatedDays}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    estimatedDays: e.target.value,
                  }))
                }
                placeholder="14"
              />
            </div>
          </div>

          {availableCourses.length > 0 && (
            <div className="space-y-2">
              <Label>Tilknyttet kursus (valgfrit)</Label>
              <Select
                value={formData.productId || 'none'}
                onValueChange={(v) => setFormData(prev => ({ ...prev, productId: v === 'none' ? null : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Intet kursus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Intet kursus (selvstændigt forløb)</SelectItem>
                  {availableCourses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Når et kursus er tilknyttet, vises forløbet som &quot;Guidet forløb&quot; på kursussiden
              </p>
            </div>
          )}

          {mode === 'edit' && (
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="isActive">Aktiv</Label>
            </div>
          )}
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
              ? 'Opret forløb'
              : 'Gem ændringer'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/journeys')}
        >
          Annuller
        </Button>
      </div>
    </form>
  )
}
