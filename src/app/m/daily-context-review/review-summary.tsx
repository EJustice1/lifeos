'use client'

import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
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
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
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
  return (
    <div className="min-h-screen bg-zinc-900 p-4 space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Daily Review Complete</h1>
        <p className="text-zinc-400 text-sm">
          {new Date(review.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Execution Metrics */}
      <MobileCard title="Today's Performance">
        <div className="flex gap-4 mb-4">
          <MetricDisplay 
            label="Execution"
            value={review.execution_score}
            color="#8b5cf6"
          />
          <MetricDisplay 
            label="Focus"
            value={review.focus_quality}
            color="#06b6d4"
          />
          <MetricDisplay 
            label="Vitality"
            value={review.physical_vitality}
            color="#10b981"
          />
        </div>
      </MobileCard>

      {/* Context Snapshot */}
      {contextData && (
        <MobileCard title="Today's Activity">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.floor(contextData.studyMinutes / 60)}h {contextData.studyMinutes % 60}m
              </div>
              <div className="text-xs text-zinc-400">Study Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {contextData.workoutsCompleted}/{contextData.workoutsTotal}
              </div>
              <div className="text-xs text-zinc-400">Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.floor(contextData.screenTimeMinutes / 60)}h {contextData.screenTimeMinutes % 60}m
              </div>
              <div className="text-xs text-zinc-400">Screen Time</div>
            </div>
          </div>
        </MobileCard>
      )}

      {/* Screen Time Breakdown */}
      <MobileCard title="Screen Time Analysis">
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-green-400">
              {Math.floor(review.productive_screen_minutes / 60)}h {review.productive_screen_minutes % 60}m
            </div>
            <div className="text-xs text-zinc-400">Productive</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-red-400">
              {Math.floor(review.distracted_screen_minutes / 60)}h {review.distracted_screen_minutes % 60}m
            </div>
            <div className="text-xs text-zinc-400">Distracted</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden flex">
          <div 
            className="bg-green-500"
            style={{ 
              width: `${(review.productive_screen_minutes / (review.productive_screen_minutes + review.distracted_screen_minutes)) * 100}%` 
            }}
          />
          <div 
            className="bg-red-500"
            style={{ 
              width: `${(review.distracted_screen_minutes / (review.productive_screen_minutes + review.distracted_screen_minutes)) * 100}%` 
            }}
          />
        </div>
      </MobileCard>

      {/* Unfocused Factors */}
      {review.unfocused_factors && review.unfocused_factors.length > 0 && (
        <MobileCard title="Unfocused Factors">
          <div className="flex flex-wrap gap-2">
            {review.unfocused_factors.map((factor) => (
              <span
                key={factor}
                className="px-3 py-1.5 rounded-full text-sm bg-orange-600/20 text-orange-300 border border-orange-600/30"
              >
                {factor}
              </span>
            ))}
          </div>
        </MobileCard>
      )}

      {/* Highlights */}
      {review.highlights && (
        <MobileCard title="Highlights">
          <p className="text-white whitespace-pre-wrap">{review.highlights}</p>
        </MobileCard>
      )}

      {/* Lesson Learned */}
      {review.lesson_learned && (
        <MobileCard title="Lesson Learned">
          <p className="text-white whitespace-pre-wrap">{review.lesson_learned}</p>
        </MobileCard>
      )}

      {/* Tomorrow's Goals */}
      {review.tomorrow_goals && review.tomorrow_goals.length > 0 && (
        <MobileCard title="Tomorrow's Goals">
          <ul className="space-y-2">
            {review.tomorrow_goals.map((goal, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span className="text-white">{goal}</span>
              </li>
            ))}
          </ul>
        </MobileCard>
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
