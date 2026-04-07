import { z } from 'zod'

export const createCheckoutSchema = z.object({
  productId: z.string().uuid(),
  priceVariantId: z.string().uuid().optional(),
  discountCode: z.string().optional(),
})
