import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BrandingForm } from './_components/branding-form'

export default async function BrandingSettingsPage() {
  const user = await requireAdmin()

  if (!user.organizationId) {
    return <p>Din brugerkonto er ikke tilknyttet en organisation.</p>
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: {
      id: true,
      brandName: true,
      tagline: true,
      description: true,
      logoUrl: true,
      faviconUrl: true,
      websiteUrl: true,
      colorPrimary: true,
      colorPrimaryForeground: true,
      colorAccent: true,
      colorSuccess: true,
      colorBackground: true,
      colorSand: true,
      colorForeground: true,
      colorBorder: true,
      contactEmail: true,
      contactPhone: true,
      contactUrl: true,
      emailFromName: true,
      emailFromEmail: true,
      heroHeading: true,
      heroSubheading: true,
      heroCtaText: true,
      heroCtaUrl: true,
      aboutHeading: true,
      aboutName: true,
      aboutBio: true,
      aboutUrl: true,
      aboutImageUrl: true,
      landingBenefits: true,
      landingSteps: true,
      landingFeatures: true,
      landingTestimonials: true,
      landingFaq: true,
      subscriptionPriceDisplay: true,
      subscriptionPeriodDisplay: true,
      footerCopyright: true,
      footerLinks: true,
    },
  })

  if (!org) {
    return <p>Organisation ikke fundet.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Branding</h1>
        <p className="text-muted-foreground">
          Tilpas brand, farver, landing page og email-indstillinger
        </p>
      </div>
      <BrandingForm org={org} />
    </div>
  )
}
