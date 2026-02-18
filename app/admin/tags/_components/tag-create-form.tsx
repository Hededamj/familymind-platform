'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createTagAction } from '../actions'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function TagCreateForm() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleNameChange(value: string) {
    setName(value)
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true)
    setSlug(value)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !slug.trim()) return

    startTransition(async () => {
      try {
        await createTagAction({ name: name.trim(), slug: slug.trim() })
        toast.success('Tag oprettet')
        setName('')
        setSlug('')
        setSlugManuallyEdited(false)
      } catch {
        toast.error('Kunne ikke oprette tag. Tjek at navn og slug er unikke.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="tag-name">Navn</Label>
        <Input
          id="tag-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="F.eks. Søvn"
          required
          className="w-60"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tag-slug">Slug</Label>
        <Input
          id="tag-slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="auto-genereret"
          required
          className="w-60"
        />
      </div>
      <Button type="submit" disabled={isPending || !name.trim() || !slug.trim()}>
        <Plus className="mr-2 size-4" />
        {isPending ? 'Opretter...' : 'Tilføj tag'}
      </Button>
    </form>
  )
}
