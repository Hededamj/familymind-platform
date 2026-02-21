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
import { toast } from 'sonner'
import { createContentAction, updateContentAction } from '../actions'
import { X } from 'lucide-react'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

type Tag = {
  id: string
  name: string
  slug: string
}

type ContentFormData = {
  id?: string
  title: string
  description: string
  slug: string
  mediaType: 'VIDEO' | 'AUDIO' | 'PDF' | 'TEXT'
  mediaUrl: string
  bunnyVideoId: string
  thumbnailUrl: string
  durationMinutes: string
  difficulty: 'INTRODUCTORY' | 'INTERMEDIATE' | 'ADVANCED'
  ageMin: string
  ageMax: string
  isStandalone: boolean
  isFree: boolean
  accessLevel: 'FREE' | 'SUBSCRIPTION' | 'PURCHASE'
  tagIds: string[]
}

type ContentUnit = {
  id: string
  title: string
  description: string | null
  slug: string
  mediaType: 'VIDEO' | 'AUDIO' | 'PDF' | 'TEXT'
  mediaUrl: string | null
  bunnyVideoId: string | null
  thumbnailUrl: string | null
  durationMinutes: number | null
  difficulty: 'INTRODUCTORY' | 'INTERMEDIATE' | 'ADVANCED'
  ageMin: number | null
  ageMax: number | null
  isStandalone: boolean
  isFree: boolean
  accessLevel: 'FREE' | 'SUBSCRIPTION' | 'PURCHASE'
  tags: { tagId: string; tag: Tag }[]
}

type ContentFormProps = {
  mode: 'create' | 'edit'
  availableTags: Tag[]
  initialData?: ContentUnit
}

export function ContentForm({
  mode,
  availableTags,
  initialData,
}: ContentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const slugManuallyEdited = useRef(false)

  const [formData, setFormData] = useState<ContentFormData>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    slug: initialData?.slug ?? '',
    mediaType: initialData?.mediaType ?? 'VIDEO',
    mediaUrl: initialData?.mediaUrl ?? '',
    bunnyVideoId: initialData?.bunnyVideoId ?? '',
    thumbnailUrl: initialData?.thumbnailUrl ?? '',
    durationMinutes: initialData?.durationMinutes?.toString() ?? '',
    difficulty: initialData?.difficulty ?? 'INTRODUCTORY',
    ageMin: initialData?.ageMin?.toString() ?? '',
    ageMax: initialData?.ageMax?.toString() ?? '',
    isStandalone: initialData?.isStandalone ?? false,
    isFree: initialData?.isFree ?? false,
    accessLevel: initialData?.accessLevel ?? 'FREE',
    tagIds: initialData?.tags?.map((t) => t.tagId) ?? [],
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

  function toggleTag(tagId: string) {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const payload = {
      title: formData.title,
      description: formData.description || undefined,
      slug: formData.slug,
      mediaType: formData.mediaType,
      mediaUrl: formData.mediaUrl || undefined,
      bunnyVideoId: formData.bunnyVideoId || undefined,
      thumbnailUrl: formData.thumbnailUrl || undefined,
      durationMinutes: formData.durationMinutes
        ? parseInt(formData.durationMinutes, 10)
        : undefined,
      difficulty: formData.difficulty,
      ageMin: formData.ageMin ? parseInt(formData.ageMin, 10) : undefined,
      ageMax: formData.ageMax ? parseInt(formData.ageMax, 10) : undefined,
      isStandalone: formData.isStandalone,
      isFree: formData.isFree,
      accessLevel: formData.accessLevel,
      tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createContentAction(payload)
          toast.success('Indhold oprettet')
        } else {
          await updateContentAction(initialData!.id, payload)
          toast.success('Indhold opdateret')
        }
        router.push('/admin/content')
      } catch (error) {
        toast.error(
          mode === 'create'
            ? 'Kunne ikke oprette indhold'
            : 'Kunne ikke opdatere indhold'
        )
        console.error(error)
      }
    })
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
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader>
          <CardTitle>Medie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mediaType">Medietype *</Label>
              <Select
                value={formData.mediaType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    mediaType: value as ContentFormData['mediaType'],
                  }))
                }
              >
                <SelectTrigger id="mediaType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="AUDIO">Lyd</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="TEXT">Tekst</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Varighed (minutter)</Label>
              <Input
                id="durationMinutes"
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    durationMinutes: e.target.value,
                  }))
                }
                placeholder="F.eks. 15"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mediaUrl">Medie-URL</Label>
              <Input
                id="mediaUrl"
                type="url"
                value={formData.mediaUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mediaUrl: e.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bunnyVideoId">Bunny Video ID</Label>
              <Input
                id="bunnyVideoId"
                value={formData.bunnyVideoId}
                onChange={(e) => {
                  const videoId = e.target.value
                  setFormData((prev) => ({
                    ...prev,
                    bunnyVideoId: videoId,
                    // Auto-generate thumbnail URL from Bunny CDN
                    thumbnailUrl: videoId
                      ? `https://${process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME ?? 'vz-b4f34ae0-620.b-cdn.net'}/${videoId}/thumbnail.jpg`
                      : prev.thumbnailUrl,
                  }))
                }}
                placeholder="Bunny CDN video ID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail-URL</Label>
            <Input
              id="thumbnailUrl"
              type="url"
              value={formData.thumbnailUrl}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  thumbnailUrl: e.target.value,
                }))
              }
              placeholder="Autoudfyldes fra Bunny Video ID"
            />
            {formData.thumbnailUrl && (
              <div className="mt-2">
                <img
                  src={formData.thumbnailUrl}
                  alt="Thumbnail preview"
                  className="h-24 w-auto rounded border object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader>
          <CardTitle>Klassificering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Sværhedsgrad</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    difficulty: value as ContentFormData['difficulty'],
                  }))
                }
              >
                <SelectTrigger id="difficulty" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTRODUCTORY">Introduktion</SelectItem>
                  <SelectItem value="INTERMEDIATE">Mellem</SelectItem>
                  <SelectItem value="ADVANCED">Avanceret</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ageMin">Minimumsalder (måneder)</Label>
              <Input
                id="ageMin"
                type="number"
                min="0"
                value={formData.ageMin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ageMin: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ageMax">Maksimumsalder (måneder)</Label>
              <Input
                id="ageMax"
                type="number"
                min="0"
                value={formData.ageMax}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ageMax: e.target.value,
                  }))
                }
                placeholder="36"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access */}
      <Card>
        <CardHeader>
          <CardTitle>Adgang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accessLevel">Adgangsniveau</Label>
              <Select
                value={formData.accessLevel}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    accessLevel: value as ContentFormData['accessLevel'],
                  }))
                }
              >
                <SelectTrigger id="accessLevel" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Gratis</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Abonnement</SelectItem>
                  <SelectItem value="PURCHASE">Køb</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isStandalone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isStandalone: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-input"
                />
                Selvstændig
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isFree: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-input"
                />
                Gratis
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      {availableTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = formData.tagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                  >
                    <Badge
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                    >
                      {tag.name}
                      {isSelected && <X className="ml-1 size-3" />}
                    </Badge>
                  </button>
                )
              })}
            </div>
            {formData.tagIds.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {formData.tagIds.length} tag(s) valgt
              </p>
            )}
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
              ? 'Opret indhold'
              : 'Gem ændringer'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/content')}
        >
          Annuller
        </Button>
      </div>
    </form>
  )
}
