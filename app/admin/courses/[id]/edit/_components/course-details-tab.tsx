'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUploader } from '@/components/image-uploader'
import { toast } from 'sonner'
import { updateCourseAction } from '../../../actions'

type Props = {
  course: {
    id: string
    title: string
    slug: string
    description: string | null
    coverImageUrl: string | null
    isActive: boolean
    showStandalone: boolean
  }
}

export function CourseDetailsTab({ course }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(course.title)
  const [slug, setSlug] = useState(course.slug)
  const [description, setDescription] = useState(course.description ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(course.coverImageUrl)
  const [isActive, setIsActive] = useState(course.isActive)
  const [showStandalone, setShowStandalone] = useState(course.showStandalone)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateCourseAction(course.id, {
          title,
          slug,
          description: description || null,
          coverImageUrl,
          isActive,
          showStandalone,
        })
        toast.success('Kursus opdateret')
        router.refresh()
      } catch {
        toast.error('Kunne ikke opdatere kursus')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detaljer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                pattern="^[a-z0-9-]+$"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <ImageUploader
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            label="Cover-billede"
          />

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              <div className="space-y-1">
                <Label htmlFor="isActive">Aktiv</Label>
                <p className="text-xs text-muted-foreground">
                  Når deaktiveret er kurset utilgængeligt overalt — også i bundler.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Switch
                id="showStandalone"
                checked={showStandalone}
                onCheckedChange={setShowStandalone}
              />
              <div className="space-y-1">
                <Label htmlFor="showStandalone">Vis som selvstændigt produkt</Label>
                <p className="text-xs text-muted-foreground">
                  Når aktiveret vises kurset i kataloget så kunder kan købe det selvstændigt.
                  Slået fra er kurset kun tilgængeligt via bundler.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Gemmer...' : 'Gem ændringer'}
      </Button>
    </form>
  )
}
