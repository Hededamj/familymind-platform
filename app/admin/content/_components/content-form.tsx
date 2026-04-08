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
import { RichTextEditor } from '@/components/rich-text-editor'
import { VideoUploader } from '@/components/video-uploader'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  X,
  Upload,
  Loader2,
  CheckCircle,
  FolderOpen,
  Search,
  FileText as FileTextIcon,
  Headphones,
} from 'lucide-react'

function prettifyFileName(urlOrName: string): string {
  const name = urlOrName.split('/').pop() ?? urlOrName
  return name.replace(/-\d{10,}(\.[^.]+)$/, '$1')
}

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

type MediaType = 'VIDEO' | 'AUDIO' | 'PDF' | 'TEXT'
type Difficulty = 'INTRODUCTORY' | 'INTERMEDIATE' | 'ADVANCED'

type ContentFormData = {
  title: string
  description: string
  slug: string
  mediaType: MediaType
  mediaUrl: string
  bunnyVideoId: string
  thumbnailUrl: string
  durationMinutes: string
  difficulty: Difficulty
  ageMin: string
  ageMax: string
  isFree: boolean
  bodyHtml: string
  tagIds: string[]
}

type ContentUnit = {
  id: string
  title: string
  description: string | null
  slug: string
  mediaType: MediaType
  mediaUrl: string | null
  bunnyVideoId: string | null
  thumbnailUrl: string | null
  durationMinutes: number | null
  difficulty: Difficulty
  ageMin: number | null
  ageMax: number | null
  isFree: boolean
  bodyHtml: string | null
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

  const [isUploading, setIsUploading] = useState(false)

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
    isFree: initialData?.isFree ?? false,
    bodyHtml: initialData?.bodyHtml ?? '',
    tagIds: initialData?.tags?.map((t) => t.tagId) ?? [],
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

  function toggleTag(tagId: string) {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  async function handleFileUpload(file: File) {
    setIsUploading(true)
    try {
      const body = new FormData()
      body.set('file', file)
      body.set('mediaType', formData.mediaType)
      const res = await fetch('/api/upload', { method: 'POST', body })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Upload fejlede')
      }
      const { url } = await res.json()
      setFormData((prev) => ({ ...prev, mediaUrl: url }))
      toast.success('Fil uploadet')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload fejlede'
      toast.error(msg)
    } finally {
      setIsUploading(false)
    }
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
      isFree: formData.isFree,
      bodyHtml:
        formData.mediaType === 'TEXT' && formData.bodyHtml
          ? formData.bodyHtml
          : undefined,
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
                    mediaType: value as MediaType,
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

          {(formData.mediaType === 'PDF' || formData.mediaType === 'AUDIO') && (
            <FileUploadSection
              mediaType={formData.mediaType}
              currentUrl={formData.mediaUrl}
              isUploading={isUploading}
              onUpload={handleFileUpload}
              onSelect={(url) =>
                setFormData((prev) => ({ ...prev, mediaUrl: url }))
              }
            />
          )}

          {formData.mediaType === 'VIDEO' && (
            <div className="space-y-2">
              <Label>Video</Label>
              <VideoUploader
                currentVideoId={formData.bunnyVideoId || undefined}
                onUploadComplete={(videoId) => {
                  setFormData((prev) => ({
                    ...prev,
                    bunnyVideoId: videoId,
                    thumbnailUrl: `https://${process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME ?? ''}/${videoId}/thumbnail.jpg`,
                  }))
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {formData.mediaType === 'TEXT' && (
        <Card>
          <CardHeader>
            <CardTitle>Artikelindhold</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              content={formData.bodyHtml}
              onChange={(html) =>
                setFormData((prev) => ({ ...prev, bodyHtml: html }))
              }
              placeholder="Skriv din artikel her..."
            />
          </CardContent>
        </Card>
      )}

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
                    difficulty: value as Difficulty,
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
                  setFormData((prev) => ({ ...prev, ageMin: e.target.value }))
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
                  setFormData((prev) => ({ ...prev, ageMax: e.target.value }))
                }
                placeholder="36"
              />
            </div>
          </div>

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
            Gratis indhold
          </label>
        </CardContent>
      </Card>

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

export default ContentForm

// ─── File Upload + Pick Section ──────────────────────

type StorageFile = {
  name: string
  size: number
  url: string
  lastModified: string
}

function FileUploadSection({
  mediaType,
  currentUrl,
  isUploading,
  onUpload,
  onSelect,
}: {
  mediaType: 'PDF' | 'AUDIO'
  currentUrl: string
  isUploading: boolean
  onUpload: (file: File) => void
  onSelect: (url: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const isPdf = mediaType === 'PDF'
  const Icon = isPdf ? FileTextIcon : Headphones
  const label = isPdf ? 'PDF' : 'lydfil'

  if (currentUrl) {
    return (
      <div className="space-y-2">
        <Label>Fil</Label>
        <div className="flex items-center gap-3 rounded-md border p-3">
          <Icon className="size-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <CheckCircle className="size-4 text-green-600" />
              {prettifyFileName(currentUrl)}
            </p>
          </div>
          <div className="flex gap-1.5">
            <label className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>Upload ny</span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept={isPdf ? '.pdf' : 'audio/*'}
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onUpload(file)
                }}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPicker(true)}
            >
              Vælg
            </Button>
          </div>
        </div>
        <FilePicker
          open={showPicker}
          onOpenChange={setShowPicker}
          folder={isPdf ? 'pdf' : 'audio'}
          mediaType={mediaType}
          onSelect={(url) => {
            onSelect(url)
            setShowPicker(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>Fil</Label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-muted/30">
          <Upload className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Upload ny {label}</p>
            <p className="text-xs text-muted-foreground">Max 100 MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={isPdf ? '.pdf' : 'audio/*'}
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-muted/30"
        >
          <FolderOpen className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Vælg eksisterende</p>
            <p className="text-xs text-muted-foreground">
              Fra mediebiblioteket
            </p>
          </div>
        </button>
      </div>
      {isUploading && (
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-sm">Uploader...</span>
        </div>
      )}
      <FilePicker
        open={showPicker}
        onOpenChange={setShowPicker}
        folder={isPdf ? 'pdf' : 'audio'}
        mediaType={mediaType}
        onSelect={(url) => {
          onSelect(url)
          setShowPicker(false)
        }}
      />
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FilePicker({
  open,
  onOpenChange,
  folder,
  mediaType,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: string
  mediaType: string
  onSelect: (url: string) => void
}) {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) {
      setLoading(true)
      setSearch('')
      fetch(`/api/files?folder=${folder}`)
        .then((res) => res.json())
        .then((data) => setFiles(data.files ?? []))
        .catch(() => toast.error('Kunne ikke hente filer'))
        .finally(() => setLoading(false))
    }
  }, [open, folder])

  const filtered = search
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files

  const Icon = mediaType === 'PDF' ? FileTextIcon : Headphones

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Vælg {mediaType === 'PDF' ? 'PDF' : 'lydfil'} fra mediebiblioteket
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søg..."
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {search
                  ? 'Ingen filer matcher søgningen'
                  : 'Ingen filer uploadet endnu'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => onSelect(file.url)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/50"
                >
                  <Icon className="size-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {prettifyFileName(file.name)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
