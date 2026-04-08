'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { updateBundleAction } from '../../../actions'

type Props = {
  bundle: {
    id: string
    title: string
    slug: string
    description: string | null
    coverImageUrl: string | null
    isActive: boolean
  }
}

export function BundleDetailsTab({ bundle }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(bundle.title)
  const [slug, setSlug] = useState(bundle.slug)
  const [description, setDescription] = useState(bundle.description ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(bundle.coverImageUrl ?? '')
  const [isActive, setIsActive] = useState(bundle.isActive)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateBundleAction(bundle.id, {
          title,
          slug,
          description: description || null,
          coverImageUrl: coverImageUrl || null,
          isActive,
        })
        toast.success('Bundle opdateret')
        router.refresh()
      } catch {
        toast.error('Kunne ikke opdatere bundle')
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

          <div className="space-y-2">
            <Label htmlFor="coverImageUrl">Cover-billede URL</Label>
            <Input
              id="coverImageUrl"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive">Aktiv</Label>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Gemmer...' : 'Gem ændringer'}
      </Button>
    </form>
  )
}
