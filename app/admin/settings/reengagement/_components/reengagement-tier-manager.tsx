'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Pencil, Save, X } from 'lucide-react'
import { updateReEngagementTierAction } from '../../engagement-actions'

type EmailTemplate = {
  id: string
  templateKey: string
  subject: string
}

type ReEngagementTier = {
  id: string
  tierNumber: number
  daysInactiveMin: number
  daysInactiveMax: number
  emailTemplateId: string
  isActive: boolean
  emailTemplate: EmailTemplate
}

type ReEngagementTierManagerProps = {
  tiers: ReEngagementTier[]
  emailTemplates: EmailTemplate[]
}

export function ReEngagementTierManager({
  tiers,
  emailTemplates,
}: ReEngagementTierManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)

  // Edit form state
  const [editDaysMin, setEditDaysMin] = useState(0)
  const [editDaysMax, setEditDaysMax] = useState(0)
  const [editTemplateId, setEditTemplateId] = useState('')
  const [editActive, setEditActive] = useState(true)

  function startEdit(tier: ReEngagementTier) {
    setEditingId(tier.id)
    setEditDaysMin(tier.daysInactiveMin)
    setEditDaysMax(tier.daysInactiveMax)
    setEditTemplateId(tier.emailTemplateId)
    setEditActive(tier.isActive)
  }

  function handleSave() {
    if (!editingId || !editTemplateId) return
    if (editDaysMin < 0 || editDaysMax < editDaysMin) {
      toast.error('Ugyldige dageintervaller')
      return
    }
    startTransition(async () => {
      try {
        await updateReEngagementTierAction(editingId, {
          daysInactiveMin: editDaysMin,
          daysInactiveMax: editDaysMax,
          emailTemplateId: editTemplateId,
          isActive: editActive,
        })
        toast.success('Genaktiveringsniveau opdateret')
        setEditingId(null)
      } catch {
        toast.error('Kunne ikke opdatere genaktiveringsniveau')
      }
    })
  }

  function handleToggle(tier: ReEngagementTier) {
    startTransition(async () => {
      try {
        await updateReEngagementTierAction(tier.id, {
          isActive: !tier.isActive,
        })
        toast.success(
          tier.isActive ? 'Niveau deaktiveret' : 'Niveau aktiveret'
        )
      } catch {
        toast.error('Kunne ikke opdatere status')
      }
    })
  }

  if (tiers.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">
          Ingen genaktiveringsniveauer konfigureret endnu. Kør seed-scriptet
          for at oprette standardniveauer.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Genaktiveringsniveauer definerer hvornår inaktive brugere modtager
        e-mails baseret på antal dage uden aktivitet. Niveauerne er faste og
        kan ikke tilføjes eller slettes, kun redigeres.
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Niveau</TableHead>
              <TableHead>Dage inaktiv (min)</TableHead>
              <TableHead>Dage inaktiv (maks)</TableHead>
              <TableHead>E-mail skabelon</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier) =>
              editingId === tier.id ? (
                <TableRow key={tier.id}>
                  <TableCell>
                    <Badge variant="secondary">#{tier.tierNumber}</Badge>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={editDaysMin}
                      onChange={(e) => setEditDaysMin(Number(e.target.value))}
                      className="w-[100px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={editDaysMax}
                      onChange={(e) => setEditDaysMax(Number(e.target.value))}
                      className="w-[100px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editTemplateId}
                      onValueChange={setEditTemplateId}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.map((tpl) => (
                          <SelectItem key={tpl.id} value={tpl.id}>
                            {tpl.templateKey}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editActive}
                        onCheckedChange={setEditActive}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0"
                        onClick={handleSave}
                        disabled={isPending}
                      >
                        <Save className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={tier.id}>
                  <TableCell>
                    <Badge variant="secondary">#{tier.tierNumber}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {tier.daysInactiveMin} dage
                  </TableCell>
                  <TableCell className="font-medium">
                    {tier.daysInactiveMax} dage
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {tier.emailTemplate.templateKey}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={tier.isActive}
                      onCheckedChange={() => handleToggle(tier)}
                      disabled={isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0"
                      onClick={() => startEdit(tier)}
                      disabled={isPending}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
