'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { updateCompanySettingsAction } from '../actions'
import { updateCompanySettingsSchema } from '@/lib/validators/settings'

type Props = {
  settings: {
    company_name: string
    company_cvr: string
    company_address: string
    company_email: string
  }
}

export function CompanySettingsForm({ settings }: Props) {
  const [formData, setFormData] = useState(settings)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    const result = updateCompanySettingsSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    startTransition(async () => {
      try {
        await updateCompanySettingsAction(formData)
        toast.success('Firmaoplysninger gemt')
      } catch {
        toast.error('Kunne ikke gemme')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firmaoplysninger</CardTitle>
        <CardDescription>
          Bruges i privatlivspolitik, cookiepolitik og vilkår
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company_name">Firmanavn <span className="text-destructive">*</span></Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              placeholder="FamilyMind ApS"
            />
            {errors.company_name && <p className="text-sm text-destructive">{errors.company_name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_cvr">CVR-nummer <span className="text-destructive">*</span></Label>
            <Input
              id="company_cvr"
              value={formData.company_cvr}
              onChange={(e) => setFormData(prev => ({ ...prev, company_cvr: e.target.value }))}
              placeholder="12345678"
            />
            {errors.company_cvr && <p className="text-sm text-destructive">{errors.company_cvr}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_address">Adresse <span className="text-destructive">*</span></Label>
          <Input
            id="company_address"
            value={formData.company_address}
            onChange={(e) => setFormData(prev => ({ ...prev, company_address: e.target.value }))}
            placeholder="Eksempelvej 1, 1234 København"
          />
          {errors.company_address && <p className="text-sm text-destructive">{errors.company_address}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_email">Kontakt-email <span className="text-destructive">*</span></Label>
          <Input
            id="company_email"
            type="email"
            value={formData.company_email}
            onChange={(e) => setFormData(prev => ({ ...prev, company_email: e.target.value }))}
            placeholder="kontakt@familymind.dk"
          />
          {errors.company_email && <p className="text-sm text-destructive">{errors.company_email}</p>}
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Gemmer...' : 'Gem firmaoplysninger'}
        </Button>
      </CardContent>
    </Card>
  )
}
