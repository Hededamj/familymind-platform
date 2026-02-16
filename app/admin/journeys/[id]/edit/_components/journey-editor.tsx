'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createPhaseAction } from '../../../actions'
import { JourneyForm } from '../../../_components/journey-form'
import { PhaseEditor } from './phase-editor'

type ContentUnit = {
  id: string
  title: string
  slug: string
  mediaType: string
}

type DayContent = {
  id: string
  contentUnitId: string
  position: number
  contentUnit: ContentUnit
}

type DayAction = {
  id: string
  actionText: string
  reflectionPrompt: string | null
}

type Day = {
  id: string
  position: number
  title: string | null
  contents: DayContent[]
  actions: DayAction[]
}

type Phase = {
  id: string
  title: string
  position: number
  days: Day[]
}

type Journey = {
  id: string
  title: string
  description: string | null
  slug: string
  targetAgeMin: number | null
  targetAgeMax: number | null
  estimatedDays: number | null
  isActive: boolean
  phases: Phase[]
}

type JourneyEditorProps = {
  journey: Journey
  allContentUnits: ContentUnit[]
}

export function JourneyEditor({
  journey,
  allContentUnits,
}: JourneyEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newPhaseTitle, setNewPhaseTitle] = useState('')
  const [showAddPhase, setShowAddPhase] = useState(false)

  function handleAddPhase() {
    if (!newPhaseTitle.trim()) return
    startTransition(async () => {
      try {
        await createPhaseAction(journey.id, newPhaseTitle.trim())
        toast.success('Fase oprettet')
        setNewPhaseTitle('')
        setShowAddPhase(false)
        router.refresh()
      } catch {
        toast.error('Kunne ikke oprette fase')
      }
    })
  }

  const totalDays = journey.phases.reduce(
    (sum, phase) => sum + phase.days.length,
    0
  )

  return (
    <div className="space-y-8">
      {/* Basic info */}
      <JourneyForm mode="edit" initialData={journey} />

      {/* Phases section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Faser og dage</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {journey.phases.length}{' '}
                {journey.phases.length === 1 ? 'fase' : 'faser'},{' '}
                {totalDays} {totalDays === 1 ? 'dag' : 'dage'} i alt
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAddPhase(true)}
            >
              <Plus className="mr-2 size-4" />
              Tilfoej fase
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {journey.phases.length === 0 && !showAddPhase ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                Ingen faser endnu. Tilfoej en fase for at begynde at
                strukturere rejsen.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddPhase(true)}
              >
                <Plus className="mr-2 size-4" />
                Tilfoej foerste fase
              </Button>
            </div>
          ) : (
            journey.phases.map((phase, index) => (
              <PhaseEditor
                key={phase.id}
                phase={phase}
                allContentUnits={allContentUnits}
                defaultOpen={index === 0}
              />
            ))
          )}

          {showAddPhase && (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Input
                value={newPhaseTitle}
                onChange={(e) => setNewPhaseTitle(e.target.value)}
                placeholder="Fasetitel, f.eks. 'Introduktion'"
                className="flex-1"
                disabled={isPending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddPhase()
                  }
                }}
                autoFocus
              />
              <Button
                onClick={handleAddPhase}
                disabled={isPending || !newPhaseTitle.trim()}
              >
                {isPending ? 'Opretter...' : 'Tilfoej'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddPhase(false)
                  setNewPhaseTitle('')
                }}
              >
                Annuller
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
