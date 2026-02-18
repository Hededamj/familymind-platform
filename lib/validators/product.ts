import { z } from 'zod'

export const createProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  type: z.enum(['SUBSCRIPTION', 'COURSE', 'SINGLE', 'BUNDLE']),
  priceAmountCents: z.number().int().min(0),
  priceCurrency: z.string().default('DKK'),
})

export const updateProductSchema = createProductSchema.partial()

export const reorderLessonsSchema = z.object({
  productId: z.string().uuid(),
  lessonIds: z.array(z.string().uuid()),
})
