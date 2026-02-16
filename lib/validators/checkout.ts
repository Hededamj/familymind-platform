import { z } from 'zod'

export const createCheckoutSchema = z.object({
  productId: z.string().uuid(),
  discountCode: z.string().optional(),
})
