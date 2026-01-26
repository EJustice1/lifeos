'use client'

import { useState, useEffect } from 'react'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { ExecutionChart } from './execution-chart'
import { getDailyContextReviewStats } from '@/lib/actions/daily-context-review'
import type { DailyReviewRow } from './DailyReviewContext'

interface DailyContextData {
  date: string
  studyHours: number
  studyMinutes: number
  workoutsCompleted: number
  workoutsTotal: number
  screenTimeHours: number
  screenTimeMinutes: number
}

interface ReviewSummaryProps {
  review: DailyReviewRow
  contextData: DailyContextData | null
  onEdit: () => void
}

function MetricDisplay({ 
  label, 
  value,
  color = 'var(--mobile-purple)'
}: { 
  label: string
  value: number | string
  color?: string
}) {
  return (
    <div className="flex-1 text-center">
      <div className="text-headline-lg font-bold text-white mb-1">{value}</div>
      <div className="text-label-sm text-zinc-400">{label}</div>
      <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all"
          style={{ 
            backgroundColor: color,
            width: typeof value === 'number' ? `${(value / 10) * 100}%` : '100%'
          }}
        />
      </div>
    </div>
  )
}

export function DailyContextReviewSummary({ review, contextData, onEdit }: ReviewSummaryProps) {
  const [executionHistory, setExecutionHistory] = useState<Array<{ date: string; execution_score: number }>>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      try {
        const stats = await getDailyContextReviewStats(7)
        setExecutionHistory(stats)
      } catch (error) {
        console.error('Failed to load execution history:', error)
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-900 p-4 space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-headline-md font-bold text-white mb-2">Daily Review Complete</h1>
        <p className="text-zinc-400 text-body-sm">
          {new Date(review.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Execution Metrics */}
      <div>
        <h3 className="text-title-lg font-semibold mb-4 text-white">Today's Performance</h3>
        <div className="flex justify-center">
          <MetricDisplay 
            label="Execution Score"
            value={review.execution_score}
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* Context Snapshot */}
      {contextData && (
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Today's Activity</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-headline-md font-bold text-white">
                {Math.floor(contextData.studyMinutes / 60)}h {contextData.studyMinutes % 60}m
              </div>
              <div className="text-label-sm text-zinc-400">Study Time</div>
            </div>
            <div className="text-center">
              <div className="text-headline-md font-bold text-white">
                {contextData.workoutsCompleted}/{contextData.workoutsTotal}
              </div>
              <div className="text-label-sm text-zinc-400">Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-headline-md font-bold text-white">
                {Math.floor(contextData.screenTimeMinutes / 60)}h {contextData.screenTimeMinutes % 60}m
              </div>
              <div className="text-label-sm text-zinc-400">Screen Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Time */}
      {(review.screen_time_minutes ?? 0) > 0 && (
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Screen Time</h3>
          <div className="text-center">
            <div className="text-headline-lg font-bold text-white mb-1">
              {Math.floor((review.screen_time_minutes ?? 0) / 60)}h {(review.screen_time_minutes ?? 0) % 60}m
            </div>
            <div className="text-body-sm text-zinc-400">Total Time</div>
          </div>
        </div>
      )}

      {/* Unfocused Factors */}
      {review.unfocused_factors && review.unfocused_factors.length > 0 && (
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Unfocused Factors</h3>
          <div className="flex flex-wrap gap-2">
            {review.unfocused_factors.map((factor) => (
              <span
                key={factor}
                className="px-3 py-1.5 rounded-full text-body-sm bg-orange-600/20 text-orange-300 border border-orange-600/30"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Highlights */}
      {review.highlights && (
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Highlights</h3>
          <p className="text-white whitespace-pre-wrap">{review.highlights}</p>
        </div>
      )}

      {/* Lesson Learned */}
      {review.lesson_learned && (
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Lesson Learned</h3>
          <p className="text-white whitespace-pre-wrap">{review.lesson_learned}</p>
        </div>
      )}

      {/* Tomorrow's Goals */}
      {review.tomorrow_goals && review.tomorrow_goals.length > 0 && (
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Tomorrow's Goals</h3>
          <ul className="space-y-2">
            {review.tomorrow_goals.map((goal, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span className="text-white">{goal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Execution History Chart */}
      {!loadingHistory && executionHistory.length > 0 && (
        <ExecutionChart data={executionHistory} />
      )}

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
