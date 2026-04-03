'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { submitOnboarding } from '../actions'
import { cn } from '@/lib/utils'

// ---------- Types ----------

type OnboardingOption = {
  id: string
  label: string
  value: string
  tagId: string | null
  position: number
  tag: { id: string; name: string; slug: string } | null
}

type OnboardingQuestion = {
  id: string
  questionText: string
  questionType: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'DATE' | 'SLIDER'
  position: number
  isActive: boolean
  helperText: string | null
  options: OnboardingOption[]
}

type Props = {
  questions: OnboardingQuestion[]
  brandName: string
}

// ---------- Helpers ----------

function formatMonths(months: number): string {
  if (months < 12) {
    return `${months} ${months === 1 ? 'måned' : 'måneder'}`
  }
  const years = Math.floor(months / 12)
  const remaining = months % 12
  if (remaining === 0) {
    return `${years} år`
  }
  return `${years} år og ${remaining} ${remaining === 1 ? 'måned' : 'måneder'}`
}

// ---------- Component ----------

export function OnboardingWizard({ questions, brandName }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<
    Record<string, string[]>
  >({})
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({})
  const [isPending, startTransition] = useTransition()

  const totalSteps = questions.length
  const question = questions[currentStep]
  const progressPercent = ((currentStep + 1) / totalSteps) * 100

  // Current selection for this question
  const currentSelection = responses[question.id] ?? []
  const currentSliderValue = sliderValues[question.id] ?? 24

  // Check if the current step has a valid answer
  const hasAnswer = (() => {
    if (question.questionType === 'SLIDER') {
      // Slider always has a value (defaults to 24)
      return true
    }
    if (question.questionType === 'DATE') {
      // DATE type: check if a date has been entered
      return currentSelection.length > 0 && currentSelection[0] !== ''
    }
    return currentSelection.length > 0
  })()

  const isLastStep = currentStep === totalSteps - 1

  // ---------- Selection handlers ----------

  function handleSingleSelect(optionId: string) {
    setResponses((prev) => ({
      ...prev,
      [question.id]: [optionId],
    }))
  }

  function handleMultiSelect(optionId: string) {
    setResponses((prev) => {
      const current = prev[question.id] ?? []
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      return { ...prev, [question.id]: next }
    })
  }

  function handleSliderChange(value: number[]) {
    setSliderValues((prev) => ({
      ...prev,
      [question.id]: value[0],
    }))
  }

  function handleDateChange(dateStr: string) {
    setResponses((prev) => ({
      ...prev,
      [question.id]: [dateStr],
    }))
  }

  // ---------- Navigation ----------

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  function handleNext() {
    if (isLastStep) {
      handleSubmit()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      // Build raw responses array — derived fields (childAges,
      // primaryChallengeTagId) are computed server-side
      const responsesArray = questions.map((q) => {
        if (q.questionType === 'SLIDER') {
          return {
            questionId: q.id,
            selectedOptionIds: [String(sliderValues[q.id] ?? 24)],
          }
        }
        return {
          questionId: q.id,
          selectedOptionIds: responses[q.id] ?? [],
        }
      })

      await submitOnboarding({ responses: responsesArray })
    })
  }

  // ---------- Render question types ----------

  function renderQuestion() {
    switch (question.questionType) {
      case 'SINGLE_SELECT':
        return (
          <div className="grid gap-3">
            {question.options.map((option) => {
              const isSelected = currentSelection.includes(option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSingleSelect(option.id)}
                  className={cn(
                    'flex w-full items-center rounded-xl border-2 px-4 py-4 text-left text-base font-medium transition-all active:scale-[0.98]',
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-muted/50'
                  )}
                >
                  <span
                    className={cn(
                      'mr-3 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {isSelected && (
                      <span className="size-2 rounded-full bg-white" />
                    )}
                  </span>
                  {option.label}
                </button>
              )
            })}
          </div>
        )

      case 'MULTI_SELECT':
        return (
          <div className="grid gap-3">
            {question.options.map((option) => {
              const isSelected = currentSelection.includes(option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleMultiSelect(option.id)}
                  className={cn(
                    'flex w-full items-center rounded-xl border-2 px-4 py-4 text-left text-base font-medium transition-all active:scale-[0.98]',
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-muted/50'
                  )}
                >
                  <span
                    className={cn(
                      'mr-3 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="size-3 text-white"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </span>
                  {option.label}
                </button>
              )
            })}
          </div>
        )

      case 'SLIDER':
        return (
          <div className="space-y-8 px-2">
            <div className="text-center">
              <span className="text-4xl font-bold text-primary">
                {formatMonths(currentSliderValue)}
              </span>
            </div>
            <Slider
              value={[currentSliderValue]}
              onValueChange={handleSliderChange}
              min={0}
              max={72}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0 måneder</span>
              <span>6 år</span>
            </div>
          </div>
        )

      case 'DATE':
        return (
          <div className="space-y-4">
            <input
              type="date"
              value={currentSelection[0] ?? ''}
              onChange={(e) => handleDateChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-xl border-2 border-border bg-card px-4 py-4 text-base transition-colors focus:border-primary focus:outline-none"
            />
            {currentSelection[0] && (
              <p className="text-center text-sm text-muted-foreground">
                Det er ca.{' '}
                <span className="font-medium text-foreground">
                  {formatMonths(
                    Math.max(
                      0,
                      Math.floor(
                        (new Date().getTime() -
                          new Date(currentSelection[0]).getTime()) /
                          (1000 * 60 * 60 * 24 * 30.44)
                      )
                    )
                  )}
                </span>
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // ---------- Main render ----------

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Top progress area */}
      <div className="px-4 pt-6 pb-2">
        <div className="mx-auto max-w-lg">
          {/* Logo */}
          <p className="mb-4 text-center font-serif text-lg">{brandName}</p>
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Trin {currentStep + 1} af {totalSteps}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Question card */}
      <div className="flex flex-1 items-start justify-center px-4 pt-6 pb-32 sm:items-center sm:pb-24 sm:pt-0">
        <div className="w-full max-w-lg">
          <div className="mb-2 pb-2">
            <h2 className="font-serif text-xl sm:text-2xl">
              {question.questionText}
            </h2>
            {question.helperText && (
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                {question.helperText}
              </p>
            )}
          </div>
          <div className="mt-4">{renderQuestion()}</div>
        </div>
      </div>

      {/* Bottom navigation - fixed on mobile */}
      <div
        className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 pt-4 backdrop-blur-sm sm:relative sm:border-t-0 sm:bg-transparent sm:backdrop-blur-none"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleBack}
            disabled={currentStep === 0 || isPending}
            className="h-12 flex-1 rounded-xl text-base"
          >
            <ChevronLeft className="mr-1 size-5" />
            Tilbage
          </Button>
          <Button
            size="lg"
            onClick={handleNext}
            disabled={!hasAnswer || isPending}
            className="h-12 flex-1 rounded-xl text-base"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1 size-5 animate-spin" />
                Gemmer...
              </>
            ) : isLastStep ? (
              'Kom i gang'
            ) : (
              <>
                Næste
                <ChevronRight className="ml-1 size-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
