import { prisma } from '@/lib/prisma'
import { cache } from 'react'
import type { TenantConfig } from '@/lib/tenant'

const FALLBACK_TENANT: TenantConfig = {
  id: 'fallback',
  slug: 'familymind',
  brandName: 'FamilyMind',
  tagline: 'Din strukturerede forældreguide',
  description: 'Evidensbaseret viden og praktiske værktøjer til hele familien.',
  logoUrl: null,
  faviconUrl: null,
  websiteUrl: 'https://mettehummel.dk',
  colorPrimary: '#86A0A6',
  colorPrimaryForeground: '#1A1A1A',
  colorAccent: '#E8715A',
  colorSuccess: '#2A6B5A',
  colorBackground: '#FAFAF8',
  colorSand: '#F5F0EB',
  colorForeground: '#1A1A1A',
  colorBorder: '#E8E4DF',
  contactEmail: null,
  contactPhone: null,
  contactUrl: 'https://mettehummel.dk',
  emailFromName: 'FamilyMind',
  emailFromEmail: 'noreply@familymind.dk',
  heroHeading: null,
  heroSubheading: null,
  heroCtaText: null,
  heroCtaUrl: null,
  aboutHeading: null,
  aboutName: null,
  aboutBio: null,
  aboutUrl: null,
  aboutImageUrl: null,
  landingBenefits: null,
  landingSteps: null,
  landingFeatures: null,
  landingTestimonials: null,
  landingFaq: null,
  subscriptionPriceDisplay: null,
  subscriptionPeriodDisplay: null,
  footerCopyright: null,
  footerLinks: null,
}

/**
 * Hent tenant config for den aktuelle organisation.
 *
 * Fase 1: Resolver fra TENANT_SLUG env var (single-tenant deploy).
 * Fase 2 (fremtid): Resolver fra request hostname/subdomain.
 *
 * Cached per request via React cache().
 * Falder tilbage til standardværdier hvis DB/tenant ikke er tilgængelig
 * (fx under build prerender). I prod-runtime findes tenanten og reel data returneres.
 */
export const getTenantConfig = cache(async (): Promise<TenantConfig> => {
  const slug = process.env.TENANT_SLUG || 'familymind'

  let org
  try {
    org = await prisma.organization.findUnique({
      where: { slug },
    })
  } catch {
    return FALLBACK_TENANT
  }

  if (!org) {
    return FALLBACK_TENANT
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
