import { z } from 'zod'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

export const createTagSchema = z.object({
  name: z.string().min(1, 'Navn er påkrævet').max(50, 'Maks 50 tegn').trim(),
  color: z.string().regex(HEX_COLOR, 'Ugyldig hex-farve').default('#6B7280'),
})

export const updateTagSchema = createTagSchema.partial()
