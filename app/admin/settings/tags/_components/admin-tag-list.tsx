'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { updateTagAction, deleteTagAction } from '../actions'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  { hex: '#EF4444', label: 'Rød' },
  { hex: '#F59E0B', label: 'Gul' },
  { hex: '#10B981', label: 'Grøn' },
  { hex: '#3B82F6', label: 'Blå' },
  { hex: '#8B5CF6', label: 'Lilla' },
  { hex: '#6B7280', label: 'Grå' },
] as const

type AdminTagWithCount = {
  id: string
  name: string
  color: string
  _count: {
    users: number
  }
}

type AdminTagListProps = {
  tags: AdminTagWithCount[]
}

export function AdminTagList({ tags }: AdminTagListProps) {
  const [isPending, startTransition] = useTransition()
  const [editTarget, setEditTarget] = useState<AdminTagWithCount | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<AdminTagWithCount | null>(
    null
  )

  function openEdit(tag: AdminTagWithCount) {
    setEditTarget(tag)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  function handleUpdate() {
    if (!editTarget || !editName.trim()) return

    startTransition(async () => {
      try {
        await updateTagAction(editTarget.id, {
          name: editName.trim(),
          color: editColor,
        })
        toast.success('Tag opdateret')
        setEditTarget(null)
      } catch {
        toast.error('Kunne ikke opdatere tag')
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return

    startTransition(async () => {
      try {
        await deleteTagAction(deleteTarget.id)
        toast.success(`Tag "${deleteTarget.name}" slettet`)
        setDeleteTarget(null)
      } catch {
        toast.error('Kunne ikke slette tag')
      }
    })
  }

  if (tags.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">Ingen tags oprettet endnu.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Brugere</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell>
                  <Badge
                    className="text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  {tag._count.users > 0 ? (
                    <span>
                      {tag._count.users}{' '}
                      {tag._count.users === 1 ? 'bruger' : 'brugere'}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">0 brugere</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0"
                      onClick={() => openEdit(tag)}
                      disabled={isPending}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Rediger</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(tag)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Slet</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger tag</DialogTitle>
            <DialogDescription>
              Opdater navn og farve for tagget.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tag-name">Navn</Label>
              <Input
                id="edit-tag-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
                required
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
                    onClick={() => setEditColor(preset.hex)}
                    className={cn(
                      'size-7 rounded-full transition-all',
                      editColor === preset.hex
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isPending || !editName.trim()}
            >
              {isPending ? 'Gemmer...' : 'Gem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slet tag</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil slette tagget &ldquo;{deleteTarget?.name}
              &rdquo;? Det fjernes fra alle brugere.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? 'Sletter...' : 'Slet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
