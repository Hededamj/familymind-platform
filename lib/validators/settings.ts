import { z } from 'zod'

const uuid = z.string().uuid()

// ─── Email Templates ────────────────────────────────

export const updateEmailTemplateSchema = z.object({
  subject: z.string().min(1).optional(),
  bodyHtml: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

// ─── Notification Schedule ──────────────────────────

export const updateNotificationScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/, 'Forventet format: HH:mm').optional(),
  isActive: z.boolean().optional(),
})

// ─── Re-engagement Tiers ────────────────────────────

export const updateReEngagementTierSchema = z.object({
  daysInactiveMin: z.number().int().min(1).optional(),
  daysInactiveMax: z.number().int().min(1).optional(),
  emailTemplateId: uuid.optional(),
  isActive: z.boolean().optional(),
})

// ─── Milestone Definitions ──────────────────────────

export const updateMilestoneSchema = z.object({
  name: z.string().min(1).optional(),
  triggerType: z.enum(['DAYS_ACTIVE', 'PHASE_COMPLETE', 'JOURNEY_COMPLETE', 'CONTENT_COUNT', 'CHECKIN_STREAK']).optional(),
  triggerValue: z.number().int().min(1).optional(),
  celebrationTitle: z.string().min(1).optional(),
  celebrationMessage: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

// ─── Onboarding Questions ───────────────────────────

export const createQuestionSchema = z.object({
  questionText: z.string().min(1),
  questionType: z.enum(['SINGLE_SELECT', 'MULTI_SELECT', 'DATE', 'SLIDER']),
  helperText: z.string().optional(),
})

export const updateQuestionSchema = z.object({
  questionText: z.string().min(1),
  questionType: z.enum(['SINGLE_SELECT', 'MULTI_SELECT', 'DATE', 'SLIDER']),
  helperText: z.string().nullable().optional(),
  isActive: z.boolean(),
})

export const createOptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  tagId: uuid.nullable().optional(),
})

export const updateOptionSchema = z.object({
  label: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  tagId: uuid.nullable().optional(),
})

// ─── Check-in Options ───────────────────────────────

export const createCheckInOptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  emoji: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const updateCheckInOptionSchema = z.object({
  label: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  emoji: z.string().optional(),
  isActive: z.boolean().optional(),
})

// ─── Dashboard Messages ─────────────────────────────

export const updateDashboardMessageSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().url().optional(),
})

// ─── Recommendations ────────────────────────────────

export const createRecommendationRuleSchema = z.object({
  name: z.string().min(1),
  conditions: z.record(z.string(), z.unknown()),
  targetType: z.string().min(1),
  targetId: uuid,
  priority: z.number().int().min(0),
  isActive: z.boolean().optional(),
})

export const updateRecommendationRuleSchema = z.object({
  name: z.string().min(1).optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
  targetType: z.string().min(1).optional(),
  targetId: uuid.optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

// ─── Discount Codes ────────────────────────────────

export const createDiscountSchema = z.object({
  code: z.string().min(1),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.number().int().min(1),
  maxUses: z.number().int().min(1).nullable().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().nullable().optional(),
  applicableProductId: uuid.nullable().optional(),
  isActive: z.boolean().optional(),
  duration: z.enum(['once', 'repeating', 'forever']).optional(),
  durationInMonths: z.number().int().min(1).max(36).nullable().optional(),
})

export const updateDiscountSchema = z.object({
  code: z.string().min(1).optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  validUntil: z.string().nullable().optional(),
  applicableProductId: uuid.nullable().optional(),
  isActive: z.boolean().optional(),
})

// ─── General Settings ───────────────────────────────

export const updateCompanySettingsSchema = z.object({
  company_name: z.string().min(1),
  company_cvr: z.string().min(1),
  company_address: z.string().min(1),
  company_email: z.string().email(),
})
