import { z } from 'zod'

export const userListFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  status: z.enum(['TRIAL', 'ACTIVE', 'INACTIVE', 'CHURNED']).optional(),
  tagId: z.string().uuid().optional(),
  journeyId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
})

export const updateUserProfileSchema = z.object({
  name: z.string().trim().max(120).nullable(),
  email: z.string().trim().toLowerCase().email('Ugyldig email'),
})

export const grantAccessSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid().optional(),
  bundleId: z.string().uuid().optional(),
}).refine(
  (data) => (data.courseId ? !data.bundleId : !!data.bundleId),
  { message: 'Angiv enten courseId eller bundleId, ikke begge' }
)

export const bulkEmailSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
  subject: z.string().min(1, 'Emne er påkrævet').max(200),
  body: z.string().min(1, 'Besked er påkrævet').max(10000),
})
