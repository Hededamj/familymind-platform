'use server'

import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const brandingSchema = z.object({
  brandName: z.string().min(1, 'Brandnavn er påkrævet'),
  tagline: z.string().optional().default(''),
  description: z.string().optional().default(''),
  logoUrl: z.string().url().optional().or(z.literal('')).default(''),
  faviconUrl: z.string().url().optional().or(z.literal('')).default(''),
  websiteUrl: z.string().url().optional().or(z.literal('')).default(''),

  colorPrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  colorPrimaryForeground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  colorAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  colorSuccess: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  colorBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  colorSand: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  colorForeground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  colorBorder: z.string().regex(/^#[0-9a-fA-F]{6}$/),

  contactEmail: z.string().email().optional().or(z.literal('')).default(''),
  contactPhone: z.string().optional().default(''),
  contactUrl: z.string().url().optional().or(z.literal('')).default(''),

  emailFromName: z.string().optional().default(''),
  emailFromEmail: z.string().email().optional().or(z.literal('')).default(''),

  heroHeading: z.string().optional().default(''),
  heroSubheading: z.string().optional().default(''),
  heroCtaText: z.string().optional().default(''),
  heroCtaUrl: z.string().optional().default(''),

  aboutHeading: z.string().optional().default(''),
  aboutName: z.string().optional().default(''),
  aboutBio: z.string().optional().default(''),
  aboutUrl: z.string().url().optional().or(z.literal('')).default(''),
  aboutImageUrl: z.string().url().optional().or(z.literal('')).default(''),

  subscriptionPriceDisplay: z.string().optional().default(''),
  subscriptionPeriodDisplay: z.string().optional().default(''),

  footerCopyright: z.string().optional().default(''),
})

export async function updateBrandingAction(data: z.infer<typeof brandingSchema>) {
  const user = await requireAdmin()

  const parsed = brandingSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Ugyldig data: ' + parsed.error.issues.map(i => i.message).join(', '))
  }

  const d = parsed.data

  await prisma.organization.update({
    where: { id: user.organizationId! },
    data: {
      brandName: d.brandName,
      tagline: d.tagline || null,
      description: d.description || null,
      logoUrl: d.logoUrl || null,
      faviconUrl: d.faviconUrl || null,
      websiteUrl: d.websiteUrl || null,
      colorPrimary: d.colorPrimary,
      colorPrimaryForeground: d.colorPrimaryForeground,
      colorAccent: d.colorAccent,
      colorSuccess: d.colorSuccess,
      colorBackground: d.colorBackground,
      colorSand: d.colorSand,
      colorForeground: d.colorForeground,
      colorBorder: d.colorBorder,
      contactEmail: d.contactEmail || null,
      contactPhone: d.contactPhone || null,
      contactUrl: d.contactUrl || null,
      emailFromName: d.emailFromName || null,
      emailFromEmail: d.emailFromEmail || null,
      heroHeading: d.heroHeading || null,
      heroSubheading: d.heroSubheading || null,
      heroCtaText: d.heroCtaText || null,
      heroCtaUrl: d.heroCtaUrl || null,
      aboutHeading: d.aboutHeading || null,
      aboutName: d.aboutName || null,
      aboutBio: d.aboutBio || null,
      aboutUrl: d.aboutUrl || null,
      aboutImageUrl: d.aboutImageUrl || null,
      subscriptionPriceDisplay: d.subscriptionPriceDisplay || null,
      subscriptionPeriodDisplay: d.subscriptionPeriodDisplay || null,
      footerCopyright: d.footerCopyright || null,
    },
  })

  revalidatePath('/admin/settings/branding')
  revalidatePath('/', 'layout')
}

const landingJsonSchema = z.object({
  landingBenefits: z.array(z.string()).optional().default([]),
  landingSteps: z.array(z.object({ title: z.string(), description: z.string(), icon: z.string() })).optional().default([]),
  landingFeatures: z.array(z.object({ title: z.string(), description: z.string(), icon: z.string() })).optional().default([]),
  landingTestimonials: z.array(z.object({ name: z.string(), quote: z.string(), stars: z.number().min(1).max(5) })).optional().default([]),
  landingFaq: z.array(z.object({ question: z.string(), answer: z.string() })).optional().default([]),
  footerLinks: z.array(z.object({ label: z.string(), url: z.string() })).optional().default([]),
})

export async function updateLandingJsonAction(data: z.infer<typeof landingJsonSchema>) {
  const user = await requireAdmin()

  const parsed = landingJsonSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Ugyldig data: ' + parsed.error.issues.map(i => i.message).join(', '))
  }

  const d = parsed.data

  await prisma.organization.update({
    where: { id: user.organizationId! },
    data: {
      landingBenefits: d.landingBenefits.length > 0 ? d.landingBenefits : undefined,
      landingSteps: d.landingSteps.length > 0 ? d.landingSteps : undefined,
      landingFeatures: d.landingFeatures.length > 0 ? d.landingFeatures : undefined,
      landingTestimonials: d.landingTestimonials.length > 0 ? d.landingTestimonials : undefined,
      landingFaq: d.landingFaq.length > 0 ? d.landingFaq : undefined,
      footerLinks: d.footerLinks.length > 0 ? d.footerLinks : undefined,
    },
  })

  revalidatePath('/admin/settings/branding')
  revalidatePath('/', 'layout')
}
