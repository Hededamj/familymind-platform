'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { updateBrandingAction, updateLandingJsonAction } from '../actions'

// ── Types ──

type OrgData = {
  id: string
  brandName: string
  tagline: string | null
  description: string | null
  logoUrl: string | null
  faviconUrl: string | null
  websiteUrl: string | null
  colorPrimary: string
  colorPrimaryForeground: string
  colorAccent: string
  colorSuccess: string
  colorBackground: string
  colorSand: string
  colorForeground: string
  colorBorder: string
  contactEmail: string | null
  contactPhone: string | null
  contactUrl: string | null
  emailFromName: string | null
  emailFromEmail: string | null
  heroHeading: string | null
  heroSubheading: string | null
  heroCtaText: string | null
  heroCtaUrl: string | null
  aboutHeading: string | null
  aboutName: string | null
  aboutBio: string | null
  aboutUrl: string | null
  aboutImageUrl: string | null
  landingBenefits: unknown
  landingSteps: unknown
  landingFeatures: unknown
  landingTestimonials: unknown
  landingFaq: unknown
  subscriptionPriceDisplay: string | null
  subscriptionPeriodDisplay: string | null
  footerCopyright: string | null
  footerLinks: unknown
}

type StepOrFeature = { title: string; description: string; icon: string }
type Testimonial = { name: string; quote: string; stars: number }
type FaqItem = { question: string; answer: string }
type FooterLink = { label: string; url: string }

// ── Color input helper — hoisted so identity is stable across renders ──

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-border p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono"
        />
      </div>
    </div>
  )
}

// ── Component ──

export function BrandingForm({ org }: { org: OrgData }) {
  // ── Scalar fields state ──
  const [brandName, setBrandName] = useState(org.brandName)
  const [tagline, setTagline] = useState(org.tagline ?? '')
  const [description, setDescription] = useState(org.description ?? '')
  const [logoUrl, setLogoUrl] = useState(org.logoUrl ?? '')
  const [faviconUrl, setFaviconUrl] = useState(org.faviconUrl ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(org.websiteUrl ?? '')

  const [colorPrimary, setColorPrimary] = useState(org.colorPrimary)
  const [colorPrimaryForeground, setColorPrimaryForeground] = useState(org.colorPrimaryForeground)
  const [colorAccent, setColorAccent] = useState(org.colorAccent)
  const [colorSuccess, setColorSuccess] = useState(org.colorSuccess)
  const [colorBackground, setColorBackground] = useState(org.colorBackground)
  const [colorSand, setColorSand] = useState(org.colorSand)
  const [colorForeground, setColorForeground] = useState(org.colorForeground)
  const [colorBorder, setColorBorder] = useState(org.colorBorder)

  const [contactEmail, setContactEmail] = useState(org.contactEmail ?? '')
  const [contactPhone, setContactPhone] = useState(org.contactPhone ?? '')
  const [contactUrl, setContactUrl] = useState(org.contactUrl ?? '')
  const [emailFromName, setEmailFromName] = useState(org.emailFromName ?? '')
  const [emailFromEmail, setEmailFromEmail] = useState(org.emailFromEmail ?? '')

  const [heroHeading, setHeroHeading] = useState(org.heroHeading ?? '')
  const [heroSubheading, setHeroSubheading] = useState(org.heroSubheading ?? '')
  const [heroCtaText, setHeroCtaText] = useState(org.heroCtaText ?? '')
  const [heroCtaUrl, setHeroCtaUrl] = useState(org.heroCtaUrl ?? '')
  const [aboutHeading, setAboutHeading] = useState(org.aboutHeading ?? '')
  const [aboutName, setAboutName] = useState(org.aboutName ?? '')
  const [aboutBio, setAboutBio] = useState(org.aboutBio ?? '')
  const [aboutUrl, setAboutUrl] = useState(org.aboutUrl ?? '')
  const [aboutImageUrl, setAboutImageUrl] = useState(org.aboutImageUrl ?? '')

  const [subscriptionPriceDisplay, setSubscriptionPriceDisplay] = useState(org.subscriptionPriceDisplay ?? '')
  const [subscriptionPeriodDisplay, setSubscriptionPeriodDisplay] = useState(org.subscriptionPeriodDisplay ?? '')
  const [footerCopyright, setFooterCopyright] = useState(org.footerCopyright ?? '')

  // ── JSON fields state ──
  const [benefits, setBenefits] = useState<string[]>(
    (org.landingBenefits as string[] | null) ?? []
  )
  const [steps, setSteps] = useState<StepOrFeature[]>(
    (org.landingSteps as StepOrFeature[] | null) ?? []
  )
  const [features, setFeatures] = useState<StepOrFeature[]>(
    (org.landingFeatures as StepOrFeature[] | null) ?? []
  )
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    (org.landingTestimonials as Testimonial[] | null) ?? []
  )
  const [faq, setFaq] = useState<FaqItem[]>(
    (org.landingFaq as FaqItem[] | null) ?? []
  )
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>(
    (org.footerLinks as FooterLink[] | null) ?? []
  )

  // ── Transitions ──
  const [isPendingBrand, startBrandTransition] = useTransition()
  const [isPendingColors, startColorsTransition] = useTransition()
  const [isPendingContact, startContactTransition] = useTransition()
  const [isPendingHero, startHeroTransition] = useTransition()
  const [isPendingPrices, startPricesTransition] = useTransition()
  const [isPendingJson, startJsonTransition] = useTransition()

  // ── Helpers ──
  function buildScalarData() {
    return {
      brandName,
      tagline,
      description,
      logoUrl,
      faviconUrl,
      websiteUrl,
      colorPrimary,
      colorPrimaryForeground,
      colorAccent,
      colorSuccess,
      colorBackground,
      colorSand,
      colorForeground,
      colorBorder,
      contactEmail,
      contactPhone,
      contactUrl,
      emailFromName,
      emailFromEmail,
      heroHeading,
      heroSubheading,
      heroCtaText,
      heroCtaUrl,
      aboutHeading,
      aboutName,
      aboutBio,
      aboutUrl,
      aboutImageUrl,
      subscriptionPriceDisplay,
      subscriptionPeriodDisplay,
      footerCopyright,
    }
  }

  function handleSaveScalar(
    startTransition: typeof startBrandTransition,
    successMsg: string
  ) {
    startTransition(async () => {
      try {
        await updateBrandingAction(buildScalarData())
        toast.success(successMsg)
      } catch {
        toast.error('Kunne ikke gemme')
      }
    })
  }

  function handleSaveJson() {
    startJsonTransition(async () => {
      try {
        await updateLandingJsonAction({
          landingBenefits: benefits,
          landingSteps: steps,
          landingFeatures: features,
          landingTestimonials: testimonials,
          landingFaq: faq,
          footerLinks,
        })
        toast.success('Landing page-sektioner gemt')
      } catch {
        toast.error('Kunne ikke gemme')
      }
    })
  }

  return (
    <Tabs defaultValue="brand">
      <TabsList className="flex-wrap">
        <TabsTrigger value="brand">Brand</TabsTrigger>
        <TabsTrigger value="farver">Farver</TabsTrigger>
        <TabsTrigger value="kontakt">Kontakt & Email</TabsTrigger>
        <TabsTrigger value="hero">Hero & Om</TabsTrigger>
        <TabsTrigger value="priser">Priser & Footer</TabsTrigger>
        <TabsTrigger value="landing">Landing Page</TabsTrigger>
      </TabsList>

      {/* ── Tab 1: Brand ── */}
      <TabsContent value="brand">
        <Card>
          <CardHeader>
            <CardTitle>Brand-identitet</CardTitle>
            <CardDescription>
              Grundlæggende brandoplysninger og logo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brandnavn *</Label>
                <Input
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="FamilyMind"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Forældreskab med indsigt"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kort beskrivelse af platformen..."
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://dit-domæne.dk"
              />
            </div>
            <Button
              onClick={() => handleSaveScalar(startBrandTransition, 'Brand-indstillinger gemt')}
              disabled={isPendingBrand}
            >
              {isPendingBrand ? 'Gemmer...' : 'Gem brand'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Tab 2: Farver ── */}
      <TabsContent value="farver">
        <Card>
          <CardHeader>
            <CardTitle>Farvepalette</CardTitle>
            <CardDescription>
              Hex-farver brugt i hele platformens tema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField label="Primær" value={colorPrimary} onChange={setColorPrimary} />
              <ColorField label="Primær forgrund" value={colorPrimaryForeground} onChange={setColorPrimaryForeground} />
              <ColorField label="Accent" value={colorAccent} onChange={setColorAccent} />
              <ColorField label="Succes" value={colorSuccess} onChange={setColorSuccess} />
              <ColorField label="Baggrund" value={colorBackground} onChange={setColorBackground} />
              <ColorField label="Sand" value={colorSand} onChange={setColorSand} />
              <ColorField label="Forgrund" value={colorForeground} onChange={setColorForeground} />
              <ColorField label="Kant" value={colorBorder} onChange={setColorBorder} />
            </div>
            <Button
              onClick={() => handleSaveScalar(startColorsTransition, 'Farver gemt')}
              disabled={isPendingColors}
            >
              {isPendingColors ? 'Gemmer...' : 'Gem farver'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Tab 3: Kontakt & Email ── */}
      <TabsContent value="kontakt">
        <Card>
          <CardHeader>
            <CardTitle>Kontakt & Email</CardTitle>
            <CardDescription>
              Kontaktoplysninger og email-afsenderindstillinger
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Kontakt-email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="kontakt@dit-domæne.dk"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefon</Label>
                <Input
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+45 12 34 56 78"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactUrl">Kontaktside URL</Label>
              <Input
                id="contactUrl"
                value={contactUrl}
                onChange={(e) => setContactUrl(e.target.value)}
                placeholder="https://dit-domæne.dk/kontakt"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emailFromName">Email-afsendernavn</Label>
                <Input
                  id="emailFromName"
                  value={emailFromName}
                  onChange={(e) => setEmailFromName(e.target.value)}
                  placeholder="FamilyMind"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailFromEmail">Email-afsenderadresse</Label>
                <Input
                  id="emailFromEmail"
                  type="email"
                  value={emailFromEmail}
                  onChange={(e) => setEmailFromEmail(e.target.value)}
                  placeholder="noreply@dit-domæne.dk"
                />
              </div>
            </div>
            <Button
              onClick={() => handleSaveScalar(startContactTransition, 'Kontaktindstillinger gemt')}
              disabled={isPendingContact}
            >
              {isPendingContact ? 'Gemmer...' : 'Gem kontakt'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Tab 4: Hero & Om ── */}
      <TabsContent value="hero">
        <Card>
          <CardHeader>
            <CardTitle>Hero-sektion</CardTitle>
            <CardDescription>
              Overskrift og call-to-action på forsiden
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroHeading">Overskrift</Label>
              <Input
                id="heroHeading"
                value={heroHeading}
                onChange={(e) => setHeroHeading(e.target.value)}
                placeholder="Bliv den forælder du drømmer om"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubheading">Underoverskrift</Label>
              <Textarea
                id="heroSubheading"
                value={heroSubheading}
                onChange={(e) => setHeroSubheading(e.target.value)}
                placeholder="Korte beskrivelse under overskriften..."
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="heroCtaText">CTA-tekst</Label>
                <Input
                  id="heroCtaText"
                  value={heroCtaText}
                  onChange={(e) => setHeroCtaText(e.target.value)}
                  placeholder="Kom i gang"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heroCtaUrl">CTA-link</Label>
                <Input
                  id="heroCtaUrl"
                  value={heroCtaUrl}
                  onChange={(e) => setHeroCtaUrl(e.target.value)}
                  placeholder="/signup"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Om-sektion</CardTitle>
            <CardDescription>
              Information om personen/virksomheden bag platformen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="aboutHeading">Sektionsoverskrift</Label>
                <Input
                  id="aboutHeading"
                  value={aboutHeading}
                  onChange={(e) => setAboutHeading(e.target.value)}
                  placeholder="Om mig"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aboutName">Navn</Label>
                <Input
                  id="aboutName"
                  value={aboutName}
                  onChange={(e) => setAboutName(e.target.value)}
                  placeholder="Dit navn"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aboutBio">Biografi</Label>
              <Textarea
                id="aboutBio"
                value={aboutBio}
                onChange={(e) => setAboutBio(e.target.value)}
                placeholder="Fortæl om dig selv..."
                rows={4}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="aboutUrl">Link</Label>
                <Input
                  id="aboutUrl"
                  value={aboutUrl}
                  onChange={(e) => setAboutUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aboutImageUrl">Billede URL</Label>
                <Input
                  id="aboutImageUrl"
                  value={aboutImageUrl}
                  onChange={(e) => setAboutImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <Button
              onClick={() => handleSaveScalar(startHeroTransition, 'Hero- og om-indstillinger gemt')}
              disabled={isPendingHero}
            >
              {isPendingHero ? 'Gemmer...' : 'Gem hero & om'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Tab 5: Priser & Footer ── */}
      <TabsContent value="priser">
        <Card>
          <CardHeader>
            <CardTitle>Priser & Footer</CardTitle>
            <CardDescription>
              Prisvisning og footer-tekst
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subscriptionPriceDisplay">Prisvisning</Label>
                <Input
                  id="subscriptionPriceDisplay"
                  value={subscriptionPriceDisplay}
                  onChange={(e) => setSubscriptionPriceDisplay(e.target.value)}
                  placeholder="149 kr."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionPeriodDisplay">Periodevisning</Label>
                <Input
                  id="subscriptionPeriodDisplay"
                  value={subscriptionPeriodDisplay}
                  onChange={(e) => setSubscriptionPeriodDisplay(e.target.value)}
                  placeholder="/md."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerCopyright">Footer copyright-tekst</Label>
              <Input
                id="footerCopyright"
                value={footerCopyright}
                onChange={(e) => setFooterCopyright(e.target.value)}
                placeholder="© 2026 FamilyMind. Alle rettigheder forbeholdes."
              />
            </div>
            <Button
              onClick={() => handleSaveScalar(startPricesTransition, 'Pris- og footer-indstillinger gemt')}
              disabled={isPendingPrices}
            >
              {isPendingPrices ? 'Gemmer...' : 'Gem priser & footer'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Tab 6: Landing Page Sektioner (JSON) ── */}
      <TabsContent value="landing">
        <div className="space-y-4">
          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Fordele</CardTitle>
              <CardDescription>Liste af fordele vist på forsiden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={b}
                    onChange={(e) => {
                      const next = [...benefits]
                      next[i] = e.target.value
                      setBenefits(next)
                    }}
                    placeholder="En fordel..."
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setBenefits(benefits.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBenefits([...benefits, ''])}
              >
                <Plus className="mr-1 size-4" />
                Tilføj fordel
              </Button>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Trin</CardTitle>
              <CardDescription>Trin-for-trin guide på forsiden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={s.title}
                      onChange={(e) => {
                        const next = [...steps]
                        next[i] = { ...next[i], title: e.target.value }
                        setSteps(next)
                      }}
                      placeholder="Titel"
                    />
                    <Input
                      value={s.description}
                      onChange={(e) => {
                        const next = [...steps]
                        next[i] = { ...next[i], description: e.target.value }
                        setSteps(next)
                      }}
                      placeholder="Beskrivelse"
                    />
                    <Input
                      value={s.icon}
                      onChange={(e) => {
                        const next = [...steps]
                        next[i] = { ...next[i], icon: e.target.value }
                        setSteps(next)
                      }}
                      placeholder="Ikon (f.eks. ClipboardCheck)"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSteps([...steps, { title: '', description: '', icon: '' }])}
              >
                <Plus className="mr-1 size-4" />
                Tilføj trin
              </Button>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Funktioner</CardTitle>
              <CardDescription>Fremhævede funktioner på forsiden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={f.title}
                      onChange={(e) => {
                        const next = [...features]
                        next[i] = { ...next[i], title: e.target.value }
                        setFeatures(next)
                      }}
                      placeholder="Titel"
                    />
                    <Input
                      value={f.description}
                      onChange={(e) => {
                        const next = [...features]
                        next[i] = { ...next[i], description: e.target.value }
                        setFeatures(next)
                      }}
                      placeholder="Beskrivelse"
                    />
                    <Input
                      value={f.icon}
                      onChange={(e) => {
                        const next = [...features]
                        next[i] = { ...next[i], icon: e.target.value }
                        setFeatures(next)
                      }}
                      placeholder="Ikon (f.eks. BookOpen)"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFeatures(features.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeatures([...features, { title: '', description: '', icon: '' }])}
              >
                <Plus className="mr-1 size-4" />
                Tilføj funktion
              </Button>
            </CardContent>
          </Card>

          {/* Testimonials */}
          <Card>
            <CardHeader>
              <CardTitle>Anmeldelser</CardTitle>
              <CardDescription>Kundeanmeldelser vist på forsiden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {testimonials.map((t, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={t.name}
                      onChange={(e) => {
                        const next = [...testimonials]
                        next[i] = { ...next[i], name: e.target.value }
                        setTestimonials(next)
                      }}
                      placeholder="Navn"
                    />
                    <Textarea
                      value={t.quote}
                      onChange={(e) => {
                        const next = [...testimonials]
                        next[i] = { ...next[i], quote: e.target.value }
                        setTestimonials(next)
                      }}
                      placeholder="Citat"
                      rows={2}
                    />
                    <div className="space-y-1">
                      <Label>Stjerner (1-5)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={t.stars}
                        onChange={(e) => {
                          const next = [...testimonials]
                          next[i] = { ...next[i], stars: Number(e.target.value) }
                          setTestimonials(next)
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTestimonials(testimonials.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestimonials([...testimonials, { name: '', quote: '', stars: 5 }])}
              >
                <Plus className="mr-1 size-4" />
                Tilføj anmeldelse
              </Button>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
              <CardDescription>Ofte stillede spørgsmål</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {faq.map((f, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={f.question}
                      onChange={(e) => {
                        const next = [...faq]
                        next[i] = { ...next[i], question: e.target.value }
                        setFaq(next)
                      }}
                      placeholder="Spørgsmål"
                    />
                    <Textarea
                      value={f.answer}
                      onChange={(e) => {
                        const next = [...faq]
                        next[i] = { ...next[i], answer: e.target.value }
                        setFaq(next)
                      }}
                      placeholder="Svar"
                      rows={2}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFaq(faq.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFaq([...faq, { question: '', answer: '' }])}
              >
                <Plus className="mr-1 size-4" />
                Tilføj spørgsmål
              </Button>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <Card>
            <CardHeader>
              <CardTitle>Footer-links</CardTitle>
              <CardDescription>Links vist i sidefoden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {footerLinks.map((fl, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={fl.label}
                    onChange={(e) => {
                      const next = [...footerLinks]
                      next[i] = { ...next[i], label: e.target.value }
                      setFooterLinks(next)
                    }}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    value={fl.url}
                    onChange={(e) => {
                      const next = [...footerLinks]
                      next[i] = { ...next[i], url: e.target.value }
                      setFooterLinks(next)
                    }}
                    placeholder="/side eller https://..."
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFooterLinks(footerLinks.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFooterLinks([...footerLinks, { label: '', url: '' }])}
              >
                <Plus className="mr-1 size-4" />
                Tilføj link
              </Button>
            </CardContent>
          </Card>

          {/* Save JSON */}
          <Button onClick={handleSaveJson} disabled={isPendingJson}>
            {isPendingJson ? 'Gemmer...' : 'Gem landing page-sektioner'}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}
