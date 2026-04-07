import { z } from 'zod'

export const createProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  type: z.enum(['SUBSCRIPTION', 'COURSE', 'SINGLE', 'BUNDLE']),
  priceAmountCents: z.number().int().min(0),
  priceCurrency: z.string().default('DKK'),
  coverImageUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const reorderLessonsSchema = z.object({
  productId: z.string().uuid(),
  lessonIds: z.array(z.string().uuid()),
})

export const priceVariantSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional().nullable(),
  amountCents: z.number().int().min(0),
  currency: z.string().default('DKK'),
  billingType: z.enum(['one_time', 'recurring']),
  interval: z.enum(['month', 'year']).optional().nullable(),
  intervalCount: z.number().int().min(1).default(1),
  trialDays: z.number().int().min(0).optional().nullable(),
  position: z.number().int().min(0).default(0),
  isHighlighted: z.boolean().default(false),
  isActive: z.boolean().default(true).optional(),
})

export const updatePriceVariantSchema = priceVariantSchema.partial()

export const landingPageSchema = z.object({
  subtitle: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  testimonials: z.array(z.object({ name: z.string(), text: z.string() })).optional(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().startsWith('/').optional(),
}).passthrough()
