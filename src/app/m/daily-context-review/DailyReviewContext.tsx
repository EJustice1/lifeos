'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface DailyReviewFormData {
  executionScore: number
  focusQuality: number
  physicalVitality: number
  frictionFactors: string[]
  lessonLearned: string | null
  highlights: string | null
}

interface DailyContextData {
  date: string
  studyHours: number
  studyMinutes: number
  workoutsCompleted: number
  workoutsTotal: number
  screenTimeHours: number
  screenTimeMinutes: number
  spendingAmount: number
}

export interface DailyReviewRow {
  id: string
  user_id: string
  date: string
  execution_score: number
  focus_quality: number
  physical_vitality: number
  friction_factors: string[]
  lesson_learned: string | null
  highlights: string | null
  created_at: string
}

interface DailyReviewContextType {
  formData: DailyReviewFormData
  setFormData: (data: Partial<DailyReviewFormData>) => void
  contextData: DailyContextData | null
  existingReview: DailyReviewRow | null
}

const DailyReviewContext = createContext<DailyReviewContextType | undefined>(undefined)

export function DailyReviewProvider({
  children,
  initialData,
}: {
  children: ReactNode
  initialData: {
    contextData: DailyContextData | null
    existingReview: DailyReviewRow | null
  }
}) {
  const [formData, setFormData] = useState<DailyReviewFormData>(() => {
    // Initialize with existing review data if available
    if (initialData.existingReview) {
      return {
        executionScore: initialData.existingReview.execution_score || 50,
        focusQuality: initialData.existingReview.focus_quality || 3,
        physicalVitality: initialData.existingReview.physical_vitality || 3,
        frictionFactors: initialData.existingReview.friction_factors || [],
        lessonLearned: initialData.existingReview.lesson_learned || null,
        highlights: initialData.existingReview.highlights || null,
      }
    }

    return {
      executionScore: 50,
      focusQuality: 3,
      physicalVitality: 3,
      frictionFactors: [],
      lessonLearned: null,
      highlights: null,
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