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

const DEFAULT_COLOR = '#6B7280'

export function AdminTagForm() {
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) return

    startTransition(async () => {
      try {
        await createTagAction({ name: name.trim(), color })
        toast.success('Tag oprettet')
        setName('')
        setColor(DEFAULT_COLOR)
      } catch {
        toast.error('Kunne ikke oprette tag')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="admin-tag-name">Navn</Label>
          <Input
            id="admin-tag-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Navn på tag..."
            maxLength={50}
            required
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
                    ? 'ring-2 ring-offset-2 ring-primary'
                    : 'hover:scale-110'
                )}
                style={{ backgroundColor: preset.hex }}
              >
                <span className="sr-only">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={isPending || !name.trim()}>
          <Plus className="mr-2 size-4" />
          {isPending ? 'Opretter...' : 'Opret tag'}
        </Button>
      </div>
    </form>
  )
}
