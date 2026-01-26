'use client'

import { useState, useEffect } from 'react'
import { useDailyReview } from './DailyReviewContext'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { ExecutionSlider } from '@/components/mobile/inputs/ExecutionSlider'
import { getUserSettings } from '@/lib/actions/settings'
import {
  calculateExecutionRange,
  EXECUTION_LEVELS,
  findExecutionLevel,
  ValidationResult,
} from '@/lib/execution-validator'

export default function ContextSnapshotStep() {
  const { formData, setFormData, contextData, yesterdayGoals, completedGoals } = useDailyReview()
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [studyTarget, setStudyTarget] = useState(120)
  const [workoutTarget, setWorkoutTarget] = useState(1)


  // Fetch user settings for targets
  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getUserSettings()
        if (settings) {
          setStudyTarget(settings.daily_study_target_minutes)
          setWorkoutTarget(settings.daily_workout_target)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }

    fetchSettings()
  }, [])

  // Run validation algorithm when metrics change
  useEffect(() => {
    if (!contextData) return

    const result = calculateExecutionRange({
      studyMinutes: contextData.studyMinutes,
      studyTarget: studyTarget,
      workoutsCompleted: contextData.workoutsCompleted,
      workoutsTarget: workoutTarget,
      screenTimeMinutes: formData.screenTimeMinutes,
      yesterdayGoalsCompleted: completedGoals.size,
      yesterdayGoalsTotal: yesterdayGoals.length,
    })

    setValidationResult(result)

    // Store suggested score in form data
    setFormData({ executionScoreSuggested: result.suggestedScore })

    console.log('Execution validation result:', result)
  }, [
    contextData,
    studyTarget,
    workoutTarget,
    formData.screenTimeMinutes,
    completedGoals,
    yesterdayGoals.length,
  ])


  if (!contextData) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-400">Loading daily data...</p>
      </div>
    )
  }

  // Format study time
  const studyHours = Math.floor(contextData.studyMinutes / 60)
  const studyMinutes = contextData.studyMinutes % 60
  const studyText = studyHours > 0
    ? `${studyHours}h ${studyMinutes}m`
    : `${studyMinutes}m`

  // Calculate total screen time from user input
  const totalScreenMinutes = formData.screenTimeMinutes
  const totalScreenHours = Math.floor(totalScreenMinutes / 60)
  const totalScreenMins = totalScreenMinutes % 60
  const totalScreenText = totalScreenHours > 0
    ? `${totalScreenHours}h ${totalScreenMins}m`
    : `${totalScreenMins}m`

  // Get current selected level
  const selectedLevel = findExecutionLevel(formData.executionScore)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">Today&apos;s Execution</h1>

      {/* Condensed Summary */}
      <MobileCard title="Summary">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Goals Completed:</span>
            <span className="text-white font-semibold">
              {completedGoals.size}/{yesterdayGoals.length}
            </span>
          </div>
          {yesterdayGoals.length > 0 && (
            <div className="space-y-1">
              {yesterdayGoals.map((goal, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={completedGoals.has(i) ? 'text-emerald-400' : 'text-zinc-500'}>
                    {completedGoals.has(i) ? '✓' : '○'}
                  </span>
                  <span className={completedGoals.has(i) ? 'text-zinc-400 line-through' : 'text-zinc-400'}>
                    {goal}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </MobileCard>

      {/* Today's Metrics - Neutral Display */}
      <MobileCard title="Today's Metrics">
        <div className="space-y-3">
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
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Total Screentime:</span>
            <span className="text-white font-semibold">{totalScreenText}</span>
          </div>
        </div>
      </MobileCard>

      <MobileCard title="Execution Score">
        {/* Suggested Score - Informational Only */}
        {validationResult && validationResult.suggestions.length > 0 && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300 mb-2">Suggestions based on your data:</p>
            <ul className="space-y-1">
              {validationResult.suggestions.map((suggestion, i) => (
                <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Score */}
        {validationResult && (
          <div className="mb-3 text-center">
            <span className="text-xs text-zinc-400">
              Suggested:{' '}
              <span className={`font-semibold ${findExecutionLevel(validationResult.suggestedScore).color}`}>
                {findExecutionLevel(validationResult.suggestedScore).label}
              </span>
            </span>
          </div>
        )}

        {/* Custom Stepped Slider - No Restrictions */}
        {validationResult && (
          <ExecutionSlider
            value={formData.executionScore}
            levels={EXECUTION_LEVELS}
            maxValue={100}
            isOverrideEnabled={false}
            onChange={(score) => {
              setFormData({ executionScore: score })
            }}
            onAttemptLocked={() => {
              // No restrictions - do nothing
            }}
          />
        )}

        {/* Criteria Display (Truth Check) */}
        <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <div className="mb-3">
            <div className={`font-bold ${selectedLevel.color}`}>
              {selectedLevel.label} ({selectedLevel.range})
            </div>
            <div className="text-xs text-zinc-400">{selectedLevel.description}</div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">Did you:</p>
            {selectedLevel.criteria.map((criterion, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span className="text-sm text-zinc-400">{criterion}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-700">
            <p className="text-xs italic text-zinc-400">"{selectedLevel.mindset}"</p>
          </div>
        </div>
      </MobileCard>

    </div>
  )
}
