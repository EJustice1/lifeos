'use client'

import { useState } from 'react'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { useDailyReview } from './DailyReviewContext'

interface TomorrowGoalsProps {
  onSubmit: () => void
  onBack: () => void
}

export default function TomorrowGoals({ onSubmit, onBack }: TomorrowGoalsProps) {
  const { formData, setFormData } = useDailyReview()
  const [goalInput, setGoalInput] = useState('')
  const [goals, setGoals] = useState<string[]>(formData.tomorrowGoals || [])

  const addGoal = () => {
    if (!goalInput.trim()) return
    if (goals.length >= 5) return

    const newGoals = [...goals, goalInput.trim()]
    setGoals(newGoals)
    setFormData({ ...formData, tomorrowGoals: newGoals })
    setGoalInput('')
  }

  const removeGoal = (index: number) => {
    const newGoals = goals.filter((_, i) => i !== index)
    setGoals(newGoals)
    setFormData({ ...formData, tomorrowGoals: newGoals })
  }

  const handleSubmit = () => {
    setFormData({ ...formData, tomorrowGoals: goals })
    onSubmit()
  }

  const handleSkip = () => {
    setFormData({ ...formData, tomorrowGoals: [] })
    onSubmit()
  }

  return (
    <MobileCard>
      <h2 className="text-2xl font-bold mb-2">Tomorrow's Focus</h2>
      <p className="text-zinc-400 mb-6">What are your top priorities for tomorrow?</p>

      {/* Goal Input */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addGoal()
              }
            }}
            placeholder="Add a goal..."
            className="flex-1 p-3 bg-zinc-900 rounded-lg border border-zinc-700 focus:border-purple-500 focus:outline-none"
            disabled={goals.length >= 5}
            maxLength={200}
          />
          <button
            onClick={addGoal}
            disabled={!goalInput.trim() || goals.length >= 5}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
          >
            Add
          </button>
        </div>
        {goals.length >= 5 && (
          <p className="text-xs text-yellow-400 mt-2">Maximum 5 goals reached</p>
        )}
      </div>

      {/* Goals List */}
      {goals.length > 0 && (
        <div className="space-y-2 mb-6">
          {goals.map((goal, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800"
            >
              <span className="text-purple-400 font-bold">{index + 1}.</span>
              <span className="flex-1">{goal}</span>
              <button
                onClick={() => removeGoal(index)}
                className="text-red-400 hover:text-red-300 font-bold text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-8 text-zinc-500 mb-6">
          <p>No goals set yet. Add your priorities for tomorrow.</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-colors"
        >
          Back
        </button>
        <div className="flex-1 flex gap-2">
          {goals.length === 0 && (
            <button
              onClick={handleSkip}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-colors"
            >
              Skip
            </button>
          )}
          <PrimaryButton
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            className="flex-1"
          >
            Finish Review
          </PrimaryButton>
        </div>
      </div>
    </MobileCard>
  )
}
