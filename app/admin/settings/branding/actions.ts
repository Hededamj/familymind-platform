'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { revalidatePath } from 'next/cache'

// ── Validation helpers ──

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ugyldig hex-farve')

/** Allow only relative paths (/foo) or https:// URLs */
const safeUrl = z
  .string()
  .refine(
    (v) => v === '' || v.startsWith('/') || v.startsWith('https://'),
    'URL skal starte med / eller https://'
  )

const optionalSafeUrl = safeUrl.optional()

// ── Schema ──

const brandingSchema = z.object({
  brandName: z.string().min(1, 'Brandnavn er påkrævet').max(100),
  tagline: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  logoUrl: optionalSafeUrl,
  faviconUrl: optionalSafeUrl,
  websiteUrl: optionalSafeUrl,
  contactEmail: z.string().email('Ugyldig e-mail').or(z.literal('')).optional(),
  contactPhone: z.string().max(50).optional(),
  contactUrl: optionalSafeUrl,
  emailFromName: z.string().max(100).optional(),
  emailFromEmail: z.string().email('Ugyldig e-mail').or(z.literal('')).optional(),
  colorPrimary: hexColor.optional(),
  colorPrimaryForeground: hexColor.optional(),
  colorAccent: hexColor.optional(),
  colorSuccess: hexColor.optional(),
  colorBackground: hexColor.optional(),
  colorSand: hexColor.optional(),
  colorForeground: hexColor.optional(),
  colorBorder: hexColor.optional(),
  heroHeading: z.string().max(200).optional(),
  heroSubheading: z.string().max(500).optional(),
  heroCtaText: z.string().max(100).optional(),
  heroCtaUrl: optionalSafeUrl,
  aboutHeading: z.string().max(200).optional(),
  aboutName: z.string().max(100).optional(),
  aboutBio: z.string().max(2000).optional(),
  aboutUrl: optionalSafeUrl,
  aboutImageUrl: optionalSafeUrl,
  subscriptionPriceDisplay: z.string().max(50).optional(),
  subscriptionPeriodDisplay: z.string().max(50).optional(),
  footerCopyright: z.string().max(200).optional(),
})

// ── Action ──

export async function updateBrandingAction(rawData: unknown) {
  await requireAdmin()

  const result = brandingSchema.safeParse(rawData)
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(', '))
  }
  const data = result.data

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

  // Revalidate all pages that read tenant config
  revalidatePath('/admin/settings/branding')
  revalidatePath('/', 'layout')
  revalidatePath('/')
  revalidatePath('/browse')
  revalidatePath('/subscribe')
  revalidatePath('/dashboard')
  revalidatePath('/login')
  revalidatePath('/signup')
}
