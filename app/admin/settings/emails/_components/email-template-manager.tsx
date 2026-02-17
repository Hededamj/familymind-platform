'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Pencil, Save, X } from 'lucide-react'
import { updateEmailTemplateAction } from '../../engagement-actions'

type EmailTemplate = {
  id: string
  templateKey: string
  subject: string
  bodyHtml: string
  description: string | null
  isActive: boolean
  updatedAt: Date
}

type EmailTemplateManagerProps = {
  templates: EmailTemplate[]
}

const TEMPLATE_VARIABLES = [
  { name: '{{userName}}', desc: 'Brugerens navn' },
  { name: '{{appUrl}}', desc: 'Link til appen' },
  { name: '{{unsubscribeUrl}}', desc: 'Afmeldingslink' },
]

export function EmailTemplateManager({
  templates,
}: EmailTemplateManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)

  // Edit form state
  const [editSubject, setEditSubject] = useState('')
  const [editBodyHtml, setEditBodyHtml] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editActive, setEditActive] = useState(true)

  function startEdit(tpl: EmailTemplate) {
    setEditingId(tpl.id)
    setEditSubject(tpl.subject)
    setEditBodyHtml(tpl.bodyHtml)
    setEditDescription(tpl.description ?? '')
    setEditActive(tpl.isActive)
  }

  function handleSave() {
    if (!editingId || !editSubject.trim()) return
    startTransition(async () => {
      try {
        await updateEmailTemplateAction(editingId, {
          subject: editSubject.trim(),
          bodyHtml: editBodyHtml,
          description: editDescription.trim() || undefined,
          isActive: editActive,
        })
        toast.success('E-mail skabelon opdateret')
        setEditingId(null)
      } catch {
        toast.error('Kunne ikke opdatere e-mail skabelon')
      }
    })
  }

  function handleToggle(tpl: EmailTemplate) {
    startTransition(async () => {
      try {
        await updateEmailTemplateAction(tpl.id, {
          isActive: !tpl.isActive,
        })
        toast.success(
          tpl.isActive ? 'Skabelon deaktiveret' : 'Skabelon aktiveret'
        )
      } catch {
        toast.error('Kunne ikke opdatere status')
      }
    })
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">
          Ingen e-mail skabeloner konfigureret endnu. Koer seed-scriptet for
          at oprette standardskabeloner.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Template variables reference */}
      <div className="rounded-md border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold mb-2">
          Tilgaengelige skabelonvariabler
        </h3>
        <div className="flex flex-wrap gap-3">
          {TEMPLATE_VARIABLES.map((v) => (
            <div key={v.name} className="flex items-center gap-1.5">
              <Badge variant="secondary" className="font-mono text-xs">
                {v.name}
              </Badge>
              <span className="text-xs text-muted-foreground">{v.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Template list */}
      <div className="space-y-3">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-md border">
            {editingId === tpl.id ? (
              // Edit mode
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {tpl.templateKey}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Beskrivelse</Label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Beskrivelse af skabelonen"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Emnelinje</Label>
                  <Input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Indhold (HTML)</Label>
                  <Textarea
                    value={editBodyHtml}
                    onChange={(e) => setEditBodyHtml(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={editActive}
                    onCheckedChange={setEditActive}
                  />
                  <Label>{editActive ? 'Aktiv' : 'Inaktiv'}</Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isPending || !editSubject.trim()}
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
                    <Badge variant="outline" className="font-mono">
                      {tpl.templateKey}
                    </Badge>
                    {tpl.isActive ? (
                      <Badge>Aktiv</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Inaktiv
                      </Badge>
                    )}
                  </div>
                  {tpl.description && (
                    <p className="text-sm text-muted-foreground">
                      {tpl.description}
                    </p>
                  )}
                  <p className="font-medium">{tpl.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                    {tpl.bodyHtml.substring(0, 150)}
                    {tpl.bodyHtml.length > 150 ? '...' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={tpl.isActive}
                    onCheckedChange={() => handleToggle(tpl)}
                    disabled={isPending}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(tpl)}
                    disabled={isPending}
                  >
                    <Pencil className="mr-1 size-4" />
                    Rediger
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
