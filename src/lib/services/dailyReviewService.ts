import {
  getDailyContextDataForDate,
  getExistingDailyContextReviewForDate,
  getDailyReviewStatistics,
  getMetricTrendData,
  submitDailyContextReview,
} from '@/lib/actions/daily-context-review'
import { executeAutomaticTaskRollover } from '@/lib/actions/tasks'
import type { DailyContextData, DailyReviewRow } from '@/types/daily-review'

export async function loadDailyReviewData(date: string): Promise<{
  contextData: DailyContextData | null
  existingReview: DailyReviewRow | null
}> {
  const [contextData, existingReview] = await Promise.all([
    getDailyContextDataForDate(date),
    getExistingDailyContextReviewForDate(date),
  ])

  return { contextData, existingReview }
}

export async function submitDailyReview(data: {
  date: string
  executionScore: number
  unfocusedFactors: string[]
  lessonLearned: string | null
  highlights: string | null
  screenTimeMinutes: number
  executionScoreSuggested?: number
  executionScoreLocked: boolean
  rolledOverTaskIds?: string[]
}) {
  return submitDailyContextReview(
    data.date,
    data.executionScore,
    data.unfocusedFactors,
    data.lessonLearned,
    data.highlights,
    data.screenTimeMinutes,
    data.executionScoreSuggested,
    data.executionScoreLocked,
    data.rolledOverTaskIds ?? []
  )
}

export async function loadDailyReviewSummary(days = 30, trendDays = 7) {
  const [statistics, trendData] = await Promise.all([
    getDailyReviewStatistics(days),
    getMetricTrendData(trendDays),
  ])

  return { statistics, trendData }
}

export async function runAutomaticTaskRolloverIfNeeded(date: string) {
  return executeAutomaticTaskRollover(date)
}
