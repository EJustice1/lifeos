'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface DailyReviewFormData {
  executionScore: number
  focusQuality: number
  physicalVitality: number
  unfocusedFactors: string[]
  lessonLearned: string | null
  highlights: string | null
  tomorrowGoals?: string[]
  // NEW: Screentime fields
  productiveScreenMinutes: number
  distractedScreenMinutes: number
  // NEW: Execution validation fields
  executionScoreSuggested?: number
  executionScoreLocked?: boolean
}

interface DailyContextData {
  date: string
  studyHours: number
  studyMinutes: number
  workoutsCompleted: number
  workoutsTotal: number
  screenTimeHours: number
  screenTimeMinutes: number
}

export interface DailyReviewRow {
  id: string
  user_id: string
  date: string
  execution_score: number
  focus_quality: number
  physical_vitality: number
  unfocused_factors: string[]
  lesson_learned: string | null
  highlights: string | null
  tomorrow_goals?: string[]
  yesterday_goals?: string[]
  created_at: string
  // NEW: Screentime fields
  productive_screen_minutes?: number
  distracted_screen_minutes?: number
  // NEW: Execution validation fields
  execution_score_suggested?: number
  execution_score_locked?: boolean
}

interface DailyReviewContextType {
  formData: DailyReviewFormData
  setFormData: (data: Partial<DailyReviewFormData>) => void
  contextData: DailyContextData | null
  existingReview: DailyReviewRow | null
  yesterdayGoals: string[]
  setYesterdayGoals: (goals: string[]) => void
  completedGoals: Set<number>
  setCompletedGoals: (goals: Set<number>) => void
}

const DailyReviewContext = createContext<DailyReviewContextType | undefined>(undefined)

export function DailyReviewProvider({
  children,
  initialData = { contextData: null, existingReview: null },
}: {
  children: ReactNode
  initialData?: {
    contextData: DailyContextData | null
    existingReview: DailyReviewRow | null
  }
}) {
  const [yesterdayGoals, setYesterdayGoals] = useState<string[]>([])
  const [completedGoals, setCompletedGoals] = useState<Set<number>>(new Set())
  
  const [formData, setFormData] = useState<DailyReviewFormData>(() => {
    // Initialize with existing review data if available
    if (initialData.existingReview) {
      return {
        executionScore: initialData.existingReview.execution_score || 50,
        focusQuality: initialData.existingReview.focus_quality || 3,
        physicalVitality: initialData.existingReview.physical_vitality || 3,
        unfocusedFactors: initialData.existingReview.unfocused_factors || [],
        lessonLearned: initialData.existingReview.lesson_learned || null,
        highlights: initialData.existingReview.highlights || null,
        productiveScreenMinutes: initialData.existingReview.productive_screen_minutes || 0,
        distractedScreenMinutes: initialData.existingReview.distracted_screen_minutes || 0,
        executionScoreSuggested: initialData.existingReview.execution_score_suggested,
        executionScoreLocked: initialData.existingReview.execution_score_locked || false,
      }
    }

    return {
      executionScore: 50,
      focusQuality: 3,
      physicalVitality: 3,
      unfocusedFactors: [],
      lessonLearned: null,
      highlights: null,
      tomorrowGoals: [],
      productiveScreenMinutes: 0,
      distractedScreenMinutes: 0,
      executionScoreSuggested: undefined,
      executionScoreLocked: false,
    }
  })

  const updateFormData = (data: Partial<DailyReviewFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const contextValue: DailyReviewContextType = {
    formData,
    setFormData: updateFormData,
    contextData: initialData.contextData,
    existingReview: initialData.existingReview,
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