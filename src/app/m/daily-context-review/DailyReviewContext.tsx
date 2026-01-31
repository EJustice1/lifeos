'use client'

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import type { DailyContextData, DailyReviewRow } from '@/types/daily-review'

export interface DailyReviewFormData {
  executionScore: number
  unfocusedFactors: string[]
  lessonLearned: string | null
  highlights: string | null
  tomorrowGoals?: string[]
  // Screentime field (total only, no productive/unproductive split)
  screenTimeMinutes: number
  // Execution validation fields
  executionScoreSuggested?: number
  executionScoreLocked?: boolean
}

export type { DailyContextData, DailyReviewRow }

interface DailyReviewContextType {
  formData: DailyReviewFormData
  setFormData: (data: Partial<DailyReviewFormData>) => void
  contextData: DailyContextData | null
  existingReview: DailyReviewRow | null
  reviewDate: string
  yesterdayGoals: string[]
  setYesterdayGoals: (goals: string[]) => void
  completedGoals: Set<number>
  setCompletedGoals: (goals: Set<number>) => void
}

const DailyReviewContext = createContext<DailyReviewContextType | undefined>(undefined)

export function DailyReviewProvider({
  children,
  initialData = { contextData: null, existingReview: null },
  reviewDate,
}: {
  children: ReactNode
  initialData?: {
    contextData: DailyContextData | null
    existingReview: DailyReviewRow | null
  }
  reviewDate: string
}) {
  const [yesterdayGoals, setYesterdayGoals] = useState<string[]>([])
  const [completedGoals, setCompletedGoals] = useState<Set<number>>(new Set())

  const buildInitialFormData = useMemo(() => {
    return () => {
      if (initialData.existingReview) {
        return {
          executionScore: initialData.existingReview.execution_score || 50,
          unfocusedFactors: initialData.existingReview.unfocused_factors || [],
          lessonLearned: initialData.existingReview.lesson_learned || null,
          highlights: initialData.existingReview.highlights || null,
          screenTimeMinutes: initialData.existingReview.screen_time_minutes || 0,
          executionScoreSuggested: initialData.existingReview.execution_score_suggested,
          executionScoreLocked: initialData.existingReview.execution_score_locked || false,
        }
      }

      return {
        executionScore: 50,
        unfocusedFactors: [],
        lessonLearned: null,
        highlights: null,
        tomorrowGoals: [],
        screenTimeMinutes: 0,
        executionScoreSuggested: undefined,
        executionScoreLocked: false,
      }
    }
  }, [initialData.existingReview])

  const [formData, setFormData] = useState<DailyReviewFormData>(() => buildInitialFormData())

  const updateFormData = (data: Partial<DailyReviewFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  useEffect(() => {
    setFormData(buildInitialFormData())
    setYesterdayGoals([])
    setCompletedGoals(new Set())
  }, [buildInitialFormData, reviewDate])

  const contextValue: DailyReviewContextType = {
    formData,
    setFormData: updateFormData,
    contextData: initialData.contextData,
    existingReview: initialData.existingReview,
    reviewDate,
    yesterdayGoals,
    setYesterdayGoals,
    completedGoals,
    setCompletedGoals,
  }

  return (
    <DailyReviewContext.Provider value={contextValue}>
      {children}
    </DailyReviewContext.Provider>
  )
}

export function useDailyReview() {
  const context = useContext(DailyReviewContext)
  if (!context) {
    throw new Error('useDailyReview must be used within a DailyReviewProvider')
  }
  return context
}