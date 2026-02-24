import { prisma } from '@/lib/prisma'
import { cache } from 'react'
import type { TenantConfig } from '@/lib/tenant'

/**
 * Hent tenant config for den aktuelle organisation.
 *
 * Fase 1: Resolver fra TENANT_SLUG env var (single-tenant deploy).
 * Fase 2 (fremtid): Resolver fra request hostname/subdomain.
 *
 * Cached per request via React cache().
 */
export const getTenantConfig = cache(async (): Promise<TenantConfig> => {
  const slug = process.env.TENANT_SLUG || 'familymind'

  const org = await prisma.organization.findUnique({
    where: { slug },
  })

  if (!org) {
    throw new Error(`Tenant "${slug}" not found. Run prisma db seed.`)
  }

  return {
    id: org.id,
    slug: org.slug,
    brandName: org.brandName,
    tagline: org.tagline,
    description: org.description,
    logoUrl: org.logoUrl,
    faviconUrl: org.faviconUrl,
    websiteUrl: org.websiteUrl,

    colorPrimary: org.colorPrimary,
    colorPrimaryForeground: org.colorPrimaryForeground,
    colorAccent: org.colorAccent,
    colorSuccess: org.colorSuccess,
    colorBackground: org.colorBackground,
    colorSand: org.colorSand,
    colorForeground: org.colorForeground,
    colorBorder: org.colorBorder,

    contactEmail: org.contactEmail,
    contactPhone: org.contactPhone,
    contactUrl: org.contactUrl,

    emailFromName: org.emailFromName,
    emailFromEmail: org.emailFromEmail,

    heroHeading: org.heroHeading,
    heroSubheading: org.heroSubheading,
    heroCtaText: org.heroCtaText,
    heroCtaUrl: org.heroCtaUrl,

    aboutHeading: org.aboutHeading,
    aboutName: org.aboutName,
    aboutBio: org.aboutBio,
    aboutUrl: org.aboutUrl,
    aboutImageUrl: org.aboutImageUrl,

    landingBenefits: org.landingBenefits as string[] | null,
    landingSteps: org.landingSteps as TenantConfig['landingSteps'],
    landingFeatures: org.landingFeatures as TenantConfig['landingFeatures'],
    landingTestimonials: org.landingTestimonials as TenantConfig['landingTestimonials'],
    landingFaq: org.landingFaq as TenantConfig['landingFaq'],

    subscriptionPriceDisplay: org.subscriptionPriceDisplay,
    subscriptionPeriodDisplay: org.subscriptionPeriodDisplay,

    footerCopyright: org.footerCopyright,
    footerLinks: org.footerLinks as TenantConfig['footerLinks'],
  }
})
