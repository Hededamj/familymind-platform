'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  createQuestionSchema,
  updateQuestionSchema,
  createOptionSchema,
  updateOptionSchema,
} from '@/lib/validators/settings'

const uuid = z.string().uuid()
const PATH = '/admin/settings/onboarding'

// ─── Questions ───────────────────────────────────────

export async function createQuestionAction(data: {
  questionText: string
  questionType: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'DATE' | 'SLIDER'
  helperText?: string
}) {
  await requireAdmin()
  const valid = createQuestionSchema.parse(data)

  const maxPos = await prisma.onboardingQuestion.aggregate({
    _max: { position: true },
  })
  const position = (maxPos._max.position ?? -1) + 1

  await prisma.onboardingQuestion.create({
    data: {
      questionText: valid.questionText,
      questionType: valid.questionType,
      helperText: valid.helperText || null,
      position,
    },
  })

  revalidatePath(PATH)
}

export async function updateQuestionAction(
  id: string,
  data: {
    questionText: string
    questionType: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'DATE' | 'SLIDER'
    helperText?: string
    isActive: boolean
  }
) {
  await requireAdmin()
  const validId = uuid.parse(id)
  const valid = updateQuestionSchema.parse(data)

  await prisma.onboardingQuestion.update({
    where: { id: validId },
    data: {
      questionText: valid.questionText,
      questionType: valid.questionType,
      helperText: valid.helperText || null,
      isActive: valid.isActive,
    },
  })

  revalidatePath(PATH)
}

export async function deleteQuestionAction(id: string) {
  await requireAdmin()
  const validId = uuid.parse(id)
  await prisma.onboardingQuestion.delete({ where: { id: validId } })
  revalidatePath(PATH)
}

export async function moveQuestionAction(
  id: string,
  direction: 'up' | 'down'
) {
  await requireAdmin()
  const validId = uuid.parse(id)

  const questions = await prisma.onboardingQuestion.findMany({
    orderBy: { position: 'asc' },
  })

  const idx = questions.findIndex((q) => q.id === validId)
  if (idx === -1) return

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= questions.length) return

  const current = questions[idx]
  const swap = questions[swapIdx]

  await prisma.$transaction([
    prisma.onboardingQuestion.update({
      where: { id: current.id },
      data: { position: swap.position },
    }),
    prisma.onboardingQuestion.update({
      where: { id: swap.id },
      data: { position: current.position },
    }),
  ])

  revalidatePath(PATH)
}

// ─── Options ─────────────────────────────────────────

export async function createOptionAction(
  questionId: string,
  data: {
    label: string
    value: string
    tagId?: string
  }
) {
  await requireAdmin()
  const validQuestionId = uuid.parse(questionId)
  const valid = createOptionSchema.parse(data)

  const maxPos = await prisma.onboardingOption.aggregate({
    where: { questionId: validQuestionId },
    _max: { position: true },
  })
  const position = (maxPos._max.position ?? -1) + 1

  await prisma.onboardingOption.create({
    data: {
      questionId: validQuestionId,
      label: valid.label,
      value: valid.value,
      tagId: valid.tagId || null,
      position,
    },
  })

  revalidatePath(PATH)
}

export async function updateOptionAction(
  id: string,
  data: {
    label: string
    value: string
    tagId?: string
  }
) {
  await requireAdmin()
  const validId = uuid.parse(id)
  const valid = updateOptionSchema.parse(data)

  await prisma.onboardingOption.update({
    where: { id: validId },
    data: {
      label: valid.label,
      value: valid.value,
      tagId: valid.tagId || null,
    },
  })

  revalidatePath(PATH)
}

export async function deleteOptionAction(id: string) {
  await requireAdmin()
  const validId = uuid.parse(id)
  await prisma.onboardingOption.delete({ where: { id: validId } })
  revalidatePath(PATH)
}
