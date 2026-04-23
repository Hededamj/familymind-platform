'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Pencil, Save, X } from 'lucide-react'
import { updateDashboardMessageAction } from '../actions'

const STATE_KEY_LABELS: Record<string, string> = {
  new_user: 'Ny bruger',
  active_journey: 'Aktivt forløb',
  completed_journey: 'Afsluttet forløb',
  no_journey: 'Intet forløb',
  returning_user: 'Tilbagevendende bruger',
  inactive_user: 'Inaktiv bruger',
}

type DashboardMessage = {
  id: string
  stateKey: string
  heading: string
  body: string
  ctaLabel: string | null
  ctaUrl: string | null
  tag: { name: string; color: string; slug: string } | null
}

type DashboardMessagesManagerProps = {
  messages: DashboardMessage[]
}

export function DashboardMessagesManager({
  messages,
}: DashboardMessagesManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editHeading, setEditHeading] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editCtaLabel, setEditCtaLabel] = useState('')
  const [editCtaUrl, setEditCtaUrl] = useState('')

  function startEdit(msg: DashboardMessage) {
    setEditingId(msg.id)
    setEditHeading(msg.heading)
    setEditBody(msg.body)
    setEditCtaLabel(msg.ctaLabel ?? '')
    setEditCtaUrl(msg.ctaUrl ?? '')
  }

  function handleSave() {
    if (!editingId || !editHeading.trim() || !editBody.trim()) return
    startTransition(async () => {
      try {
        await updateDashboardMessageAction(editingId, {
          heading: editHeading.trim(),
          body: editBody.trim(),
          ctaLabel: editCtaLabel.trim() || undefined,
          ctaUrl: editCtaUrl.trim() || undefined,
        })
        toast.success('Besked opdateret')
        setEditingId(null)
      } catch {
        toast.error('Kunne ikke opdatere besked')
      }
    })
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">
          Ingen dashboard beskeder konfigureret endnu. Kør seed-scriptet for at
          oprette standardbeskeder.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Dashboard beskeder vises til brugere baseret på deres nuværende
        tilstand. Tilstanderne er faste og kan ikke tilføjes eller slettes,
        kun redigeres.
      </p>

      <div className="space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-md border">
            {editingId === msg.id ? (
              // Edit mode
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {STATE_KEY_LABELS[msg.stateKey] ?? msg.stateKey}
                  </Badge>
                  <Badge variant="outline">{msg.stateKey}</Badge>
                  {msg.tag ? (
                    <Badge
                      className="text-white"
                      style={{ backgroundColor: msg.tag.color }}
                    >
                      {msg.tag.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Generisk
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Overskrift</Label>
                  <Input
                    value={editHeading}
                    onChange={(e) => setEditHeading(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Besked</Label>
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>CTA Label (valgfrit)</Label>
                    <Input
                      value={editCtaLabel}
                      onChange={(e) => setEditCtaLabel(e.target.value)}
                      placeholder="F.eks. Start dit forløb"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA URL (valgfrit)</Label>
                    <Input
                      value={editCtaUrl}
                      onChange={(e) => setEditCtaUrl(e.target.value)}
                      placeholder="F.eks. /browse"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={
                      isPending || !editHeading.trim() || !editBody.trim()
                    }
                  >
                    <Save className="mr-2 size-4" />
                    {isPending ? 'Gemmer...' : 'Gem'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="mr-2 size-4" />
                    Annuller
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {STATE_KEY_LABELS[msg.stateKey] ?? msg.stateKey}
                    </Badge>
                    <Badge variant="outline">{msg.stateKey}</Badge>
                  </div>
                  <h3 className="font-semibold">{msg.heading}</h3>
                  <p className="text-sm text-muted-foreground">{msg.body}</p>
                  {(msg.ctaLabel || msg.ctaUrl) && (
                    <p className="text-xs text-muted-foreground">
                      CTA: {msg.ctaLabel ?? '-'} &rarr; {msg.ctaUrl ?? '-'}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => startEdit(msg)}
                  disabled={isPending}
                >
                  <Pencil className="mr-1 size-4" />
                  Rediger
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
