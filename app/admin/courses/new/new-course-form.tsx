'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { createCourseAction } from '../actions'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function NewCourseForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const slugManuallyEdited = useRef(false)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugManuallyEdited.current) setSlug(generateSlug(value))
  }

  function handleSlugChange(value: string) {
    slugManuallyEdited.current = true
    setSlug(value)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const result = await createCourseAction({
          title,
          slug,
          description: description || undefined,
        })
        toast.success('Kursus oprettet')
        router.push(`/admin/courses/${result.id}/edit`)
      } catch (error) {
        toast.error('Kunne ikke oprette kursus')
        console.error(error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grundoplysninger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="F.eks. Søvn for spædbørn"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="auto-genereret-slug"
              required
              pattern="^[a-z0-9-]+$"
              title="Slug skal bestå af små bogstaver, tal og bindestreger"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv kurset..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Opretter...' : 'Opret kursus'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/courses')}>
          Annuller
        </Button>
      </div>
    </form>
  )
}
