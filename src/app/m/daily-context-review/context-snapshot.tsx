'use client'

import { useDailyReview } from './DailyReviewContext'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { MobileSlider } from '@/components/mobile/inputs/MobileSlider'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'

export default function ContextSnapshot({ onNext }: { onNext: () => void }) {
  const { formData, setFormData, contextData } = useDailyReview()

  if (!contextData) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-400">Loading daily data...</p>
      </div>
    )
  }

  // Format study hours
  const studyHours = Math.floor(contextData.studyMinutes / 60)
  const studyMinutes = contextData.studyMinutes % 60
  const studyText = studyHours > 0
    ? `${studyHours}h ${studyMinutes}m`
    : `${studyMinutes}m`

  // Format screen time
  const screenHours = Math.floor(contextData.screenTimeMinutes / 60)
  const screenMinutes = contextData.screenTimeMinutes % 60
  const screenText = screenHours > 0
    ? `${screenHours}h ${screenMinutes}m`
    : `${screenMinutes}m`

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">Todays Reality</h1>

      <MobileCard title="The Good">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Study Time:</span>
            <span className="text-white font-semibold">{studyText}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Gym Completion:</span>
            <span className="text-white font-semibold">
              {contextData.workoutsCompleted}/{contextData.workoutsTotal} workouts
            </span>
          </div>
        </div>
      </MobileCard>

      <MobileCard title="The Bad">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Screen Time:</span>
            <span className="text-white font-semibold">{screenText}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Spent:</span>
            <span className="text-white font-semibold">
              ${contextData.spendingAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </MobileCard>

      <MobileCard title="Execution Score">
        <p className="text-zinc-400 text-sm mb-4">
          Reviewing todays data, how do you rate your execution?
        </p>
        <MobileSlider
          label="Execution Score"
          min={0}
          max={100}
          value={formData.executionScore}
          onChange={(value) => setFormData({ executionScore: value })}
          showValue
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-2">
          <span>Let the day happen</span>
          <span>Perfect execution</span>
        </div>
      </MobileCard>

      <PrimaryButton
        variant="primary"
        size="lg"
        onClick={onNext}
        className="w-full mt-8"
      >
        Continue to Internal State
      </PrimaryButton>
    </div>
  )
}