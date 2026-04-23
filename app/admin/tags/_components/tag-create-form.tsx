'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createTagAction } from '../actions'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  { hex: '#EF4444', label: 'Rød' },
  { hex: '#F59E0B', label: 'Gul' },
  { hex: '#10B981', label: 'Grøn' },
  { hex: '#3B82F6', label: 'Blå' },
  { hex: '#8B5CF6', label: 'Lilla' },
  { hex: '#6B7280', label: 'Grå' },
] as const

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
  const [color, setColor] = useState<string>(PRESET_COLORS[5].hex)
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
        await createTagAction({ name: name.trim(), slug: slug.trim(), color })
        toast.success('Tag oprettet')
        setName('')
        setSlug('')
        setSlugManuallyEdited(false)
        setColor(PRESET_COLORS[5].hex)
      } catch {
        toast.error('Kunne ikke oprette tag. Tjek at navn og slug er unikke.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="tag-name">Navn</Label>
        <Input
          id="tag-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="F.eks. Søvn"
          required
          maxLength={50}
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
          maxLength={50}
          className="w-60"
        />
      </div>
      <div className="space-y-2">
        <Label>Farve</Label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              title={preset.label}
              onClick={() => setColor(preset.hex)}
              className={cn(
                'size-7 rounded-full transition-all',
                color === preset.hex
                  ? 'ring-primary ring-2 ring-offset-2'
                  : 'hover:scale-110'
              )}
              style={{ backgroundColor: preset.hex }}
            >
              <span className="sr-only">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={isPending || !name.trim() || !slug.trim()}>
        <Plus className="mr-2 size-4" />
        {isPending ? 'Opretter...' : 'Opret tag'}
      </Button>
    </form>
  )
}
