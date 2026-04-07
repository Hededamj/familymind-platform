import { z } from 'zod'

export const createCheckoutSchema = z.object({
  priceVariantId: z.string().uuid(),
  discountCode: z.string().optional(),
})
