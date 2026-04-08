'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import {
  addCourseToBundleAction,
  removeCourseFromBundleAction,
  listAvailableCoursesAction,
} from '../../../actions'

type BundleCourseRow = {
  courseId: string
  title: string
  slug: string
  position: number
}

type AvailableCourse = {
  id: string
  title: string
  slug: string
}

export function BundleContentsTab({
  bundleId,
  courses,
}: {
  bundleId: string
  courses: BundleCourseRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPicker, setShowPicker] = useState(false)
  const [available, setAvailable] = useState<AvailableCourse[]>([])

  async function openPicker() {
    try {
      const list = await listAvailableCoursesAction(bundleId)
      setAvailable(list)
      setShowPicker(true)
    } catch {
      toast.error('Kunne ikke hente kurser')
    }
  }

  function handlePick(courseId: string) {
    startTransition(async () => {
      try {
        await addCourseToBundleAction(bundleId, courseId)
        toast.success('Kursus tilføjet')
        setShowPicker(false)
        router.refresh()
      } catch {
        toast.error('Kunne ikke tilføje kursus')
      }
    })
  }

  function handleRemove(courseId: string) {
    startTransition(async () => {
      try {
        await removeCourseFromBundleAction(bundleId, courseId)
        toast.success('Kursus fjernet')
        router.refresh()
      } catch {
        toast.error('Kunne ikke fjerne kursus')
      }
    })
  }

  const sorted = [...courses].sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openPicker}>
          <Plus className="mr-2 size-4" />
          Tilføj kursus
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Ingen kurser i bundlen endnu. Tilføj et kursus for at komme i gang.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((c) => (
            <Card key={c.courseId}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="w-6 text-center text-sm text-muted-foreground">
                  {c.position + 1}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.slug}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  onClick={() => handleRemove(c.courseId)}
                  disabled={isPending}
                >
                  <X className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tilføj kursus</DialogTitle>
            <DialogDescription>
              Vælg et kursus at tilføje til bundlen. Kurser der allerede er i bundlen, vises ikke.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {available.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Ingen tilgængelige kurser.
              </p>
            ) : (
              available.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handlePick(c.id)}
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-muted"
                >
                  <div>
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.slug}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
