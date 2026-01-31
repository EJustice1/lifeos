'use client'

import { useCallback, useEffect, useReducer, useState } from 'react'
import { useToast } from '@/components/mobile/feedback/ToastProvider'
import { useDailyReviewDate } from '@/lib/hooks/useDailyReviewDate'
import { getReviewCutoffHour } from '@/lib/actions/settings'
import {
  loadDailyReviewData,
  runAutomaticTaskRolloverIfNeeded,
  submitDailyReview,
} from '@/lib/services/dailyReviewService'
import type { DailyContextData, DailyReviewRow } from '@/types/daily-review'

type ReviewState =
  | { type: 'LOADING' }
  | { type: 'EDITING_FORM' }
  | { type: 'VIEWING_SUMMARY' }
  | { type: 'SUBMITTING' }
  | { type: 'ERROR'; message: string }

type Action =
  | { type: 'LOAD_START' }
  | { type: 'DATA_LOADED'; existingReview: DailyReviewRow | null }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'START_SUBMIT' }
  | { type: 'START_EDIT' }
  | { type: 'SUBMIT_SUCCESS' }

function reducer(state: ReviewState, action: Action): ReviewState {
  switch (action.type) {
    case 'LOAD_START':
      return { type: 'LOADING' }
    case 'DATA_LOADED':
      return action.existingReview ? { type: 'VIEWING_SUMMARY' } : { type: 'EDITING_FORM' }
    case 'LOAD_ERROR':
      return { type: 'ERROR', message: action.message }
    case 'START_SUBMIT':
      return { type: 'SUBMITTING' }
    case 'START_EDIT':
      return { type: 'EDITING_FORM' }
    case 'SUBMIT_SUCCESS':
      return { type: 'VIEWING_SUMMARY' }
    default:
      return state
  }
}

export function useDailyReviewController() {
  const [state, dispatch] = useReducer(reducer, { type: 'LOADING' })
  const [contextData, setContextData] = useState<DailyContextData | null>(null)
  const [existingReview, setExistingReview] = useState<DailyReviewRow | null>(null)
  const [cutoffHour, setCutoffHour] = useState<number>(9)
  const [currentStep, setCurrentStep] = useState(0)
  const [rolledOverTaskIds, setRolledOverTaskIds] = useState<string[]>([])
  const [canProceedFromRollover, setCanProceedFromRollover] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    let isMounted = true
    async function loadCutoffHour() {
      try {
        const hour = await getReviewCutoffHour()
        if (isMounted) {
          setCutoffHour(hour)
        }
      } catch (error) {
        console.error('Failed to load cutoff hour:', error)
      }
    }
    loadCutoffHour()
    return () => {
      isMounted = false
    }
  }, [])

  const {
    selectedDate,
    isToday,
    isViewingPast,
    canGoPrev,
    canGoNext,
    oldestDate,
    newestDate,
    goToPrevDay,
    goToNextDay,
    setDate,
  } = useDailyReviewDate(cutoffHour)

  const loadData = useCallback(async () => {
    dispatch({ type: 'LOAD_START' })
    try {
      const { contextData, existingReview } = await loadDailyReviewData(selectedDate)
      setContextData(contextData)
      setExistingReview(existingReview)
      dispatch({ type: 'DATA_LOADED', existingReview })
    } catch (e) {
      dispatch({ type: 'LOAD_ERROR', message: 'Failed to load' })
      showToast('Failed to load daily review data', 'error')
    }
  }, [selectedDate, showToast])

  useEffect(() => {
    loadData()

    const refreshInterval = setInterval(() => {
      loadData()
    }, 5 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [loadData])

  useEffect(() => {
    setCurrentStep(0)
    setRolledOverTaskIds([])
    setCanProceedFromRollover(false)
  }, [selectedDate])

  const handleSubmit = useCallback(
    async (data: {
      executionScore: number
      unfocusedFactors: string[]
      lessonLearned: string | null
      highlights: string | null
      screenTimeMinutes: number
      executionScoreSuggested?: number
      executionScoreLocked: boolean
    }) => {
      dispatch({ type: 'START_SUBMIT' })
      try {
        if (isToday) {
          try {
            const rolloverResult = await runAutomaticTaskRolloverIfNeeded(selectedDate)
            if (rolloverResult.tasksMovedCount > 0 && !rolloverResult.alreadyExecuted) {
              showToast(
                `${rolloverResult.tasksMovedCount} incomplete task${rolloverResult.tasksMovedCount > 1 ? 's' : ''} from past dates moved to backlog.`,
                'success'
              )
            }
          } catch (rolloverError) {
            console.error('Rollover failed:', rolloverError)
            showToast('Warning: Some tasks may not have been rolled over', 'error')
          }
        }

        const taskIds = isViewingPast ? [] : rolledOverTaskIds

        await submitDailyReview({
          date: selectedDate,
          executionScore: data.executionScore,
          unfocusedFactors: data.unfocusedFactors,
          lessonLearned: data.lessonLearned,
          highlights: data.highlights,
          screenTimeMinutes: data.screenTimeMinutes,
          executionScoreSuggested: data.executionScoreSuggested,
          executionScoreLocked: data.executionScoreLocked,
          rolledOverTaskIds: taskIds,
        })

        showToast('Review submitted successfully!', 'success')
        dispatch({ type: 'SUBMIT_SUCCESS' })
        await loadData()
      } catch (error) {
        console.error('Failed to submit review:', error)
        showToast('Failed to submit review', 'error')
        dispatch({ type: 'START_EDIT' })
      }
    },
    [isToday, isViewingPast, rolledOverTaskIds, selectedDate, loadData, showToast]
  )

  const startEdit = useCallback(() => {
    dispatch({ type: 'START_EDIT' })
  }, [])

  return {
    state,
    contextData,
    existingReview,
    cutoffHour,
    selectedDate,
    isToday,
    isViewingPast,
    canGoPrev,
    canGoNext,
    oldestDate,
    newestDate,
    goToPrevDay,
    goToNextDay,
    setDate,
    loadData,
    handleSubmit,
    startEdit,
    currentStep,
    setCurrentStep,
    rolledOverTaskIds,
    setRolledOverTaskIds,
    canProceedFromRollover,
    setCanProceedFromRollover,
  }
}
