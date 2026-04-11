import { z } from 'zod'

export const createContentUnitSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  mediaType: z.enum(['VIDEO', 'AUDIO', 'PDF', 'TEXT']),
  mediaUrl: z.string().url().optional(),
  bunnyVideoId: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  durationMinutes: z.number().int().positive().optional(),
  difficulty: z.enum(['INTRODUCTORY', 'INTERMEDIATE', 'ADVANCED']).default('INTRODUCTORY'),
  ageMin: z.number().min(0).max(18).optional(), // years, decimals allowed (e.g. 0.5 = 6 months)
  ageMax: z.number().min(0).max(18).optional(), // years, decimals allowed
  isFree: z.boolean().default(false),
  bodyHtml: z.string().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

export const updateContentUnitSchema = createContentUnitSchema.partial()
