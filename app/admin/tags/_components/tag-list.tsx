'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Trash2 } from 'lucide-react'
import { deleteTagAction } from '../actions'

type TagWithCount = {
  id: string
  name: string
  slug: string
  _count: {
    contentUnits: number
  }
}

type TagListProps = {
  tags: TagWithCount[]
}

export function TagList({ tags }: TagListProps) {
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<TagWithCount | null>(null)

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
        <p className="text-muted-foreground">
          Ingen tags endnu. Opret dit første tag ovenfor.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Navn</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Antal indhold</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => {
              const inUse = tag._count.contentUnits > 0
              return (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tag.slug}</Badge>
                  </TableCell>
                  <TableCell>
                    {inUse ? (
                      <Badge variant="outline">
                        {tag._count.contentUnits}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slet tag</DialogTitle>
            <DialogDescription>
              {deleteTarget && deleteTarget._count.contentUnits > 0 ? (
                <>
                  Tagget &ldquo;{deleteTarget.name}&rdquo; bruges af{' '}
                  {deleteTarget._count.contentUnits} indhold. Hvis du sletter
                  det, fjernes det fra alt tilknyttet indhold.
                </>
              ) : (
                <>
                  Er du sikker på, at du vil slette tagget &ldquo;
                  {deleteTarget?.name}&rdquo;? Denne handling kan ikke fortrydes.
                </>
              )}
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
