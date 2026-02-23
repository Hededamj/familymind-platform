'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { updateIntegrationSettingsAction } from '../actions'
import { CheckCircle2, XCircle } from 'lucide-react'

type Props = {
  settings: {
    ga4_measurement_id: string
    meta_pixel_id: string
  }
  stripeConnected: boolean
}

export function IntegrationsForm({ settings, stripeConnected }: Props) {
  const [formData, setFormData] = useState(settings)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      try {
        await updateIntegrationSettingsAction(formData)
        toast.success('Integrationer gemt')
      } catch {
        toast.error('Kunne ikke gemme')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Stripe status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Stripe
            {stripeConnected ? (
              <CheckCircle2 className="size-5 text-green-600" />
            ) : (
              <XCircle className="size-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>
            {stripeConnected
              ? 'Stripe er forbundet. API-nøgler konfigureres via miljøvariabler.'
              : 'Stripe er ikke forbundet. Tilføj STRIPE_SECRET_KEY i miljøvariabler.'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Google Analytics 4</CardTitle>
          <CardDescription>
            Statistik-tracking. Kræver brugerens samtykke (statistik-cookies).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="ga4_measurement_id">Measurement ID</Label>
            <Input
              id="ga4_measurement_id"
              value={formData.ga4_measurement_id}
              onChange={(e) => setFormData(prev => ({ ...prev, ga4_measurement_id: e.target.value }))}
              placeholder="G-XXXXXXXXXX"
            />
            <p className="text-xs text-muted-foreground">
              Find dit Measurement ID i Google Analytics under Admin → Data Streams
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meta Pixel */}
      <Card>
        <CardHeader>
          <CardTitle>Meta Pixel</CardTitle>
          <CardDescription>
            Konverteringssporing for Facebook/Instagram-annoncer. Kræver brugerens samtykke (marketing-cookies).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="meta_pixel_id">Pixel ID</Label>
            <Input
              id="meta_pixel_id"
              value={formData.meta_pixel_id}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_pixel_id: e.target.value }))}
              placeholder="123456789012345"
            />
            <p className="text-xs text-muted-foreground">
              Find dit Pixel ID i Meta Events Manager
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? 'Gemmer...' : 'Gem integrationer'}
      </Button>
    </div>
  )
}
