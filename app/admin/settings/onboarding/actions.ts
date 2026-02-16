'use server'

import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const PATH = '/admin/settings/onboarding'

// ─── Questions ───────────────────────────────────────

export async function createQuestionAction(data: {
  questionText: string
  questionType: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'DATE' | 'SLIDER'
  helperText?: string
}) {
  await requireAdmin()

  const maxPos = await prisma.onboardingQuestion.aggregate({
    _max: { position: true },
  })
  const position = (maxPos._max.position ?? -1) + 1

  await prisma.onboardingQuestion.create({
    data: {
      questionText: data.questionText,
      questionType: data.questionType,
      helperText: data.helperText || null,
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

  await prisma.onboardingQuestion.update({
    where: { id },
    data: {
      questionText: data.questionText,
      questionType: data.questionType,
      helperText: data.helperText || null,
      isActive: data.isActive,
    },
  })

  revalidatePath(PATH)
}

export async function deleteQuestionAction(id: string) {
  await requireAdmin()
  await prisma.onboardingQuestion.delete({ where: { id } })
  revalidatePath(PATH)
}

export async function moveQuestionAction(
  id: string,
  direction: 'up' | 'down'
) {
  await requireAdmin()

  const questions = await prisma.onboardingQuestion.findMany({
    orderBy: { position: 'asc' },
  })

  const idx = questions.findIndex((q) => q.id === id)
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

  const maxPos = await prisma.onboardingOption.aggregate({
    where: { questionId },
    _max: { position: true },
  })
  const position = (maxPos._max.position ?? -1) + 1

  await prisma.onboardingOption.create({
    data: {
      questionId,
      label: data.label,
      value: data.value,
      tagId: data.tagId || null,
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

  await prisma.onboardingOption.update({
    where: { id },
    data: {
      label: data.label,
      value: data.value,
      tagId: data.tagId || null,
    },
  })

  revalidatePath(PATH)
}

export async function deleteOptionAction(id: string) {
  await requireAdmin()
  await prisma.onboardingOption.delete({ where: { id } })
  revalidatePath(PATH)
}
