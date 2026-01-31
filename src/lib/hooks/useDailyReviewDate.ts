'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useMemo, useCallback } from 'react'
import { getReviewDate } from '@/lib/utils/review-date'

export interface UseDailyReviewDateReturn {
  selectedDate: string
  isToday: boolean
  isViewingPast: boolean
  canGoPrev: boolean
  canGoNext: boolean
  oldestDate: string
  newestDate: string
  goToPrevDay: () => void
  goToNextDay: () => void
  setDate: (date: string) => void
}

export function useDailyReviewDate(cutoffHour: number = 9): UseDailyReviewDateReturn {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Calculate today's review date based on cutoff hour
  const todayReviewDate = useMemo(() => getReviewDate(cutoffHour), [cutoffHour])

  // Get selected date from URL params, default to today's review date
  const selectedDate = useMemo(() => {
    const dateParam = searchParams.get('date')
    if (!dateParam) return todayReviewDate

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateParam)) return todayReviewDate

    // Ensure date is within valid range (today - 7 days to today)
    const paramDate = new Date(dateParam)
    const today = new Date(todayReviewDate)
    const oldestAllowed = new Date(today)
    oldestAllowed.setDate(oldestAllowed.getDate() - 7)

    if (paramDate > today || paramDate < oldestAllowed) {
      return todayReviewDate
    }

    return dateParam
  }, [searchParams, todayReviewDate])

  // Calculate date range boundaries
  const { oldestDate, newestDate } = useMemo(() => {
    const today = new Date(todayReviewDate)
    const oldest = new Date(today)
    oldest.setDate(oldest.getDate() - 7)

    return {
      oldestDate: oldest.toISOString().split('T')[0],
      newestDate: todayReviewDate,
    }
  }, [todayReviewDate])

  // Check if viewing today or a past date
  const isToday = selectedDate === todayReviewDate
  const isViewingPast = !isToday

  // Check if can navigate prev/next
  const canGoPrev = selectedDate > oldestDate
  const canGoNext = selectedDate < newestDate

  // Navigation helpers
  const setDate = useCallback((newDate: string) => {
    const params = new URLSearchParams(searchParams.toString())

    // If setting to today's review date, remove the param to keep URL clean
    if (newDate === todayReviewDate) {
      params.delete('date')
    } else {
      params.set('date', newDate)
    }

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.push(newUrl)
  }, [searchParams, router, todayReviewDate])

  const goToPrevDay = useCallback(() => {
    if (!canGoPrev) return

    const current = new Date(selectedDate)
    current.setDate(current.getDate() - 1)
    const prevDate = current.toISOString().split('T')[0]

    setDate(prevDate)
  }, [selectedDate, canGoPrev, setDate])

  const goToNextDay = useCallback(() => {
    if (!canGoNext) return

    const current = new Date(selectedDate)
    current.setDate(current.getDate() + 1)
    const nextDate = current.toISOString().split('T')[0]

    setDate(nextDate)
  }, [selectedDate, canGoNext, setDate])

  return {
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
  }
}
