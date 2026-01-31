'use client'

import { useState, useEffect } from 'react'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { loadDailyReviewSummary } from '@/lib/services/dailyReviewService'
import { ScoreHero } from '@/components/daily-review/ScoreHero'
import { MetricCard } from '@/components/daily-review/MetricCard'
import { CalendarHeatmap } from '@/components/daily-review/CalendarHeatmap'
import type { DailyContextData, DailyReviewRow } from '@/types/daily-review'

interface ReviewSummaryProps {
  review: DailyReviewRow
  contextData: DailyContextData | null
  onEdit: () => void
}

interface Statistics {
  avgExecutionScore: number
  avgStudyMinutes: number
  avgWorkouts: number
  avgScreenTimeMinutes: number
  dailyScores: Array<{ date: string; execution_score: number }>
  reviewCount: number
}

interface TrendData {
  dates: string[]
  studyData: number[]
  workoutData: number[]
  screentimeData: number[]
}

export function DailyContextReviewSummary({ review, contextData, onEdit }: ReviewSummaryProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [trendData, setTrendData] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAllData() {
      try {
        const { statistics, trendData } = await loadDailyReviewSummary(30, 7)
        setStatistics(statistics)
        setTrendData(trendData)
      } catch (error) {
        console.error('Failed to load summary data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [review.date])

  // Get actual metrics from context data (what was actually logged)
  const actualStudyMinutes = contextData?.studyMinutes ?? 0
  const actualScreenTime = review.screen_time_minutes ?? 0

  return (
    <div className="min-h-screen bg-zinc-950 p-4 space-y-3">
      {/* Hero Section */}
      <ScoreHero score={review.execution_score} date={review.date} />

      {/* Metrics Dashboard - Stacked Vertically */}
      {!loading && statistics && contextData && (
        <div className="space-y-2">
          {/* Study Time Card */}
          <MetricCard
            title="Study Time"
            value={`${Math.floor(actualStudyMinutes / 60)}h ${actualStudyMinutes % 60}m`}
            current={actualStudyMinutes}
            average={statistics.avgStudyMinutes}
            trendData={trendData?.studyData}
            format="minutes"
            higherIsBetter={true}
            color="rgb(34, 197, 94)" // Green
          />

          {/* Screen Time Card */}
          <MetricCard
            title="Screen Time"
            value={`${Math.floor(actualScreenTime / 60)}h ${actualScreenTime % 60}m`}
            current={actualScreenTime}
            average={statistics.avgScreenTimeMinutes}
            trendData={trendData?.screentimeData}
            format="minutes"
            higherIsBetter={false}
            color="rgb(239, 68, 68)" // Red
            warning={actualScreenTime > 360}
            warningMessage={actualScreenTime > 480 ? 'Excessive' : 'High'}
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Calendar Heatmap */}
      {!loading && statistics && statistics.dailyScores.length > 0 && (
        <CalendarHeatmap data={statistics.dailyScores} />
      )}

      {/* Reflections Section */}
      <div className="space-y-3">
        {/* Unfocused Factors */}
        {review.unfocused_factors && review.unfocused_factors.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <h3 className="text-body-md font-semibold mb-2 text-white">Unfocused Factors</h3>
            <div className="flex flex-wrap gap-1.5">
              {review.unfocused_factors.map((factor) => (
                <span
                  key={factor}
                  className="px-2.5 py-1 rounded-full text-label-sm bg-orange-600/20 text-orange-300 border border-orange-600/30"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {review.highlights && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <h3 className="text-body-md font-semibold mb-2 text-white">Highlights</h3>
            <p className="text-body-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{review.highlights}</p>
          </div>
        )}

        {/* Lesson Learned */}
        {review.lesson_learned && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <h3 className="text-body-md font-semibold mb-2 text-white">Lesson Learned</h3>
            <p className="text-body-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{review.lesson_learned}</p>
          </div>
        )}

        {/* Tomorrow's Goals */}
        {review.tomorrow_goals && review.tomorrow_goals.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <h3 className="text-body-md font-semibold mb-2 text-white">Tomorrow's Goals</h3>
            <ul className="space-y-1.5">
              {review.tomorrow_goals.map((goal, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-body-sm text-zinc-200">{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Edit Button */}
      <PrimaryButton
        variant="secondary"
        size="lg"
        onClick={onEdit}
      >
        Edit Review
      </PrimaryButton>
    </div>
  )
}
