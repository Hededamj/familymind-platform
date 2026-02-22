'use server'

import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { revalidatePath } from 'next/cache'

const PATH = '/admin/settings/branding'

export async function updateBrandingAction(data: {
  brandName: string
  tagline?: string
  description?: string
  logoUrl?: string
  faviconUrl?: string
  websiteUrl?: string
  contactEmail?: string
  contactPhone?: string
  contactUrl?: string
  emailFromName?: string
  emailFromEmail?: string
  colorPrimary?: string
  colorPrimaryForeground?: string
  colorAccent?: string
  colorSuccess?: string
  colorBackground?: string
  colorSand?: string
  colorForeground?: string
  colorBorder?: string
  heroHeading?: string
  heroSubheading?: string
  heroCtaText?: string
  heroCtaUrl?: string
  aboutHeading?: string
  aboutName?: string
  aboutBio?: string
  aboutUrl?: string
  aboutImageUrl?: string
  subscriptionPriceDisplay?: string
  subscriptionPeriodDisplay?: string
  footerCopyright?: string
}) {
  await requireAdmin()

  const tenant = await getTenantConfig()

  await prisma.organization.update({
    where: { id: tenant.id },
    data: {
      brandName: data.brandName,
      tagline: data.tagline || null,
      description: data.description || null,
      logoUrl: data.logoUrl || null,
      faviconUrl: data.faviconUrl || null,
      websiteUrl: data.websiteUrl || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      contactUrl: data.contactUrl || null,
      emailFromName: data.emailFromName || null,
      emailFromEmail: data.emailFromEmail || null,
      colorPrimary: data.colorPrimary || undefined,
      colorPrimaryForeground: data.colorPrimaryForeground || undefined,
      colorAccent: data.colorAccent || undefined,
      colorSuccess: data.colorSuccess || undefined,
      colorBackground: data.colorBackground || undefined,
      colorSand: data.colorSand || undefined,
      colorForeground: data.colorForeground || undefined,
      colorBorder: data.colorBorder || undefined,
      heroHeading: data.heroHeading || null,
      heroSubheading: data.heroSubheading || null,
      heroCtaText: data.heroCtaText || null,
      heroCtaUrl: data.heroCtaUrl || null,
      aboutHeading: data.aboutHeading || null,
      aboutName: data.aboutName || null,
      aboutBio: data.aboutBio || null,
      aboutUrl: data.aboutUrl || null,
      aboutImageUrl: data.aboutImageUrl || null,
      subscriptionPriceDisplay: data.subscriptionPriceDisplay || null,
      subscriptionPeriodDisplay: data.subscriptionPeriodDisplay || null,
      footerCopyright: data.footerCopyright || null,
    },
  })

  revalidatePath(PATH)
  revalidatePath('/', 'layout')
}
