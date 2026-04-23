import { z } from 'zod'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const createTagSchema = z.object({
  name: z.string().min(1, 'Navn er påkrævet').max(50, 'Maks 50 tegn').trim(),
  slug: z
    .string()
    .regex(SLUG, 'Slug må kun indeholde små bogstaver, tal og bindestreger')
    .max(50, 'Maks 50 tegn')
    .optional(),
  color: z.string().regex(HEX_COLOR, 'Ugyldig hex-farve').default('#6B7280'),
})

export const updateTagSchema = createTagSchema.partial()
