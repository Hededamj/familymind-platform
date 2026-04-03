'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import { createRoomAction, updateRoomAction } from '../actions'

type TagOption = { id: string; name: string; slug: string }

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const ICON_OPTIONS = [
  { value: 'MessageCircle', label: 'Besked' },
  { value: 'Heart', label: 'Hjerte' },
  { value: 'Star', label: 'Stjerne' },
  { value: 'BookOpen', label: 'Bog' },
  { value: 'Users', label: 'Brugere' },
  { value: 'Lightbulb', label: 'Idé' },
  { value: 'Coffee', label: 'Kaffe' },
  { value: 'Sparkles', label: 'Gnister' },
  { value: 'Baby', label: 'Baby' },
  { value: 'Home', label: 'Hjem' },
  { value: 'HelpCircle', label: 'Hjælp' },
  { value: 'Megaphone', label: 'Megafon' },
]

type RoomData = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  isPublic: boolean
  sortOrder: number
  isArchived: boolean
  tagIds?: string[]
}

type RoomFormProps =
  | { mode: 'create'; initialData?: undefined; allTags: TagOption[] }
  | { mode: 'edit'; initialData: RoomData; allTags: TagOption[] }

export function RoomForm({ mode, initialData, allTags }: RoomFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const slugManuallyEdited = useRef(false)

  const [name, setName] = useState(initialData?.name ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [description, setDescription] = useState(
    initialData?.description ?? ''
  )
  const [icon, setIcon] = useState(initialData?.icon ?? '')
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true)
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds ?? [])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugManuallyEdited.current) {
      setSlug(generateSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    slugManuallyEdited.current = true
    setSlug(value)
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('name', name)
        formData.set('slug', slug)
        formData.set('description', description)
        formData.set('icon', icon)
        formData.set('isPublic', String(isPublic))
        formData.set('sortOrder', String(sortOrder))
        formData.set('tagIds', JSON.stringify(selectedTagIds))

        if (mode === 'edit') {
          await updateRoomAction(initialData.id, formData)
          toast.success('Rum opdateret')
        } else {
          await createRoomAction(formData)
          toast.success('Rum oprettet')
        }

        router.push('/admin/community/rooms')
        router.refresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Noget gik galt'
        toast.error(message)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Nyt rum' : 'Rediger rum'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Navn</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="f.eks. Generelt"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="f.eks. generelt"
            maxLength={100}
          />
          <p className="text-sm text-muted-foreground">
            Bruges i URL: /community/{slug || '...'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Beskrivelse</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kort beskrivelse af rummet"
            maxLength={500}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">Ikon</Label>
          <Select value={icon} onValueChange={setIcon}>
            <SelectTrigger id="icon">
              <SelectValue placeholder="Vælg ikon" />
            </SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <p className="text-sm text-muted-foreground">
            Tags bruges til at anbefale rum baseret på onboarding-quiz
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedTagIds.map((tagId) => {
              const tag = allTags.find((t) => t.id === tagId)
              if (!tag) return null
              return (
                <Badge key={tagId} variant="secondary" className="gap-1">
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => setSelectedTagIds((prev) => prev.filter((id) => id !== tagId))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
          {allTags.filter((t) => !selectedTagIds.includes(t.id)).length > 0 && (
            <Select
              value=""
              onValueChange={(tagId) => setSelectedTagIds((prev) => [...prev, tagId])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tilføj tag..." />
              </SelectTrigger>
              <SelectContent>
                {allTags
                  .filter((t) => !selectedTagIds.includes(t.id))
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Rækkefølge</Label>
          <Input
            id="sortOrder"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
          <p className="text-sm text-muted-foreground">
            Lavere tal vises først
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="isPublic"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="isPublic">Offentligt rum</Label>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mode === 'create' ? 'Opret rum' : 'Gem ændringer'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/community/rooms')}
            disabled={isPending}
          >
            Annuller
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
