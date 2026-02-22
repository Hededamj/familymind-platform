'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { updateBrandingAction } from '../actions'

type BrandingData = {
  brandName: string
  tagline: string | null
  description: string | null
  logoUrl: string | null
  faviconUrl: string | null
  websiteUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactUrl: string | null
  emailFromName: string | null
  emailFromEmail: string | null
  colorPrimary: string
  colorPrimaryForeground: string
  colorAccent: string
  colorSuccess: string
  colorBackground: string
  colorSand: string
  colorForeground: string
  colorBorder: string
  heroHeading: string | null
  heroSubheading: string | null
  heroCtaText: string | null
  heroCtaUrl: string | null
  aboutHeading: string | null
  aboutName: string | null
  aboutBio: string | null
  aboutUrl: string | null
  aboutImageUrl: string | null
  subscriptionPriceDisplay: string | null
  subscriptionPeriodDisplay: string | null
  footerCopyright: string | null
}

type Props = {
  tenant: BrandingData
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {type === 'color' ? (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="size-10 cursor-pointer rounded border border-border"
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

export function BrandingForm({ tenant }: Props) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    brandName: tenant.brandName,
    tagline: tenant.tagline ?? '',
    description: tenant.description ?? '',
    logoUrl: tenant.logoUrl ?? '',
    faviconUrl: tenant.faviconUrl ?? '',
    websiteUrl: tenant.websiteUrl ?? '',
    contactEmail: tenant.contactEmail ?? '',
    contactPhone: tenant.contactPhone ?? '',
    contactUrl: tenant.contactUrl ?? '',
    emailFromName: tenant.emailFromName ?? '',
    emailFromEmail: tenant.emailFromEmail ?? '',
    colorPrimary: tenant.colorPrimary,
    colorPrimaryForeground: tenant.colorPrimaryForeground,
    colorAccent: tenant.colorAccent,
    colorSuccess: tenant.colorSuccess,
    colorBackground: tenant.colorBackground,
    colorSand: tenant.colorSand,
    colorForeground: tenant.colorForeground,
    colorBorder: tenant.colorBorder,
    heroHeading: tenant.heroHeading ?? '',
    heroSubheading: tenant.heroSubheading ?? '',
    heroCtaText: tenant.heroCtaText ?? '',
    heroCtaUrl: tenant.heroCtaUrl ?? '',
    aboutHeading: tenant.aboutHeading ?? '',
    aboutName: tenant.aboutName ?? '',
    aboutBio: tenant.aboutBio ?? '',
    aboutUrl: tenant.aboutUrl ?? '',
    aboutImageUrl: tenant.aboutImageUrl ?? '',
    subscriptionPriceDisplay: tenant.subscriptionPriceDisplay ?? '',
    subscriptionPeriodDisplay: tenant.subscriptionPeriodDisplay ?? '',
    footerCopyright: tenant.footerCopyright ?? '',
  })

  function set(key: keyof typeof form) {
    return (value: string) => setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!form.brandName.trim()) {
      toast.error('Brandnavn er påkrævet')
      return
    }
    startTransition(async () => {
      try {
        await updateBrandingAction(form)
        toast.success('Branding opdateret')
      } catch {
        toast.error('Kunne ikke opdatere branding')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Brand Identity */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Brand identitet</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brandnavn *" value={form.brandName} onChange={set('brandName')} placeholder="FamilyMind" />
          <Field label="Tagline" value={form.tagline} onChange={set('tagline')} placeholder="Bedre familieliv starter her" />
        </div>
        <div className="space-y-2">
          <Label>Beskrivelse</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set('description')(e.target.value)}
            placeholder="Kort beskrivelse af platformen"
            rows={3}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo URL" value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..." />
          <Field label="Favicon URL" value={form.faviconUrl} onChange={set('faviconUrl')} placeholder="https://..." />
          <Field label="Website URL" value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="https://..." />
        </div>
      </section>

      <Separator />

      {/* Colors */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Farver</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Primær" value={form.colorPrimary} onChange={set('colorPrimary')} type="color" />
          <Field label="Primær forgrund" value={form.colorPrimaryForeground} onChange={set('colorPrimaryForeground')} type="color" />
          <Field label="Accent" value={form.colorAccent} onChange={set('colorAccent')} type="color" />
          <Field label="Succes" value={form.colorSuccess} onChange={set('colorSuccess')} type="color" />
          <Field label="Baggrund" value={form.colorBackground} onChange={set('colorBackground')} type="color" />
          <Field label="Sand" value={form.colorSand} onChange={set('colorSand')} type="color" />
          <Field label="Forgrund" value={form.colorForeground} onChange={set('colorForeground')} type="color" />
          <Field label="Kant" value={form.colorBorder} onChange={set('colorBorder')} type="color" />
        </div>
      </section>

      <Separator />

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Kontakt</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kontakt e-mail" value={form.contactEmail} onChange={set('contactEmail')} placeholder="kontakt@example.dk" />
          <Field label="Kontakt telefon" value={form.contactPhone} onChange={set('contactPhone')} placeholder="+45 12 34 56 78" />
          <Field label="Kontakt URL" value={form.contactUrl} onChange={set('contactUrl')} placeholder="https://..." />
        </div>
      </section>

      <Separator />

      {/* Email */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">E-mail afsender</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Afsendernavn" value={form.emailFromName} onChange={set('emailFromName')} placeholder="FamilyMind" />
          <Field label="Afsender e-mail" value={form.emailFromEmail} onChange={set('emailFromEmail')} placeholder="noreply@familymind.dk" />
        </div>
      </section>

      <Separator />

      {/* Hero */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Landingside — Hero</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Overskrift" value={form.heroHeading} onChange={set('heroHeading')} placeholder="Bliv den forælder du drømmer om" />
          <Field label="CTA tekst" value={form.heroCtaText} onChange={set('heroCtaText')} placeholder="Kom i gang" />
          <Field label="CTA URL" value={form.heroCtaUrl} onChange={set('heroCtaUrl')} placeholder="/signup" />
        </div>
        <div className="space-y-2">
          <Label>Underoverskrift</Label>
          <Textarea
            value={form.heroSubheading}
            onChange={(e) => set('heroSubheading')(e.target.value)}
            placeholder="Kort beskrivelse under overskriften"
            rows={2}
          />
        </div>
      </section>

      <Separator />

      {/* About */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Landingside — Om</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Overskrift" value={form.aboutHeading} onChange={set('aboutHeading')} placeholder="Bag FamilyMind" />
          <Field label="Navn" value={form.aboutName} onChange={set('aboutName')} placeholder="Mette Hummel" />
          <Field label="URL" value={form.aboutUrl} onChange={set('aboutUrl')} placeholder="https://..." />
          <Field label="Billede URL" value={form.aboutImageUrl} onChange={set('aboutImageUrl')} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea
            value={form.aboutBio}
            onChange={(e) => set('aboutBio')(e.target.value)}
            placeholder="Kort bio om personen/organisationen bag platformen"
            rows={4}
          />
        </div>
      </section>

      <Separator />

      {/* Pricing + Footer */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Priser & Footer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pris visning" value={form.subscriptionPriceDisplay} onChange={set('subscriptionPriceDisplay')} placeholder="149 kr" />
          <Field label="Periode visning" value={form.subscriptionPeriodDisplay} onChange={set('subscriptionPeriodDisplay')} placeholder="/måned" />
          <Field label="Footer copyright" value={form.footerCopyright} onChange={set('footerCopyright')} placeholder="FamilyMind. Alle rettigheder forbeholdes." />
        </div>
      </section>

      <Separator />

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending || !form.brandName.trim()}
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Gemmer...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              Gem ændringer
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
