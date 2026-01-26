'use client'

import { findExecutionLevel } from '@/lib/execution-validator'

interface OverrideConfirmationModalProps {
  currentScore: number
  maxAllowed: number
  onConfirm: () => void
  onCancel: () => void
}

export function OverrideConfirmationModal({
  currentScore,
  maxAllowed,
  onConfirm,
  onCancel,
}: OverrideConfirmationModalProps) {
  const attemptedLevel = findExecutionLevel(currentScore)
  const maxAllowedLevel = findExecutionLevel(maxAllowed)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-display-lg mb-3">⚠️</div>
          <h2 className="text-title-lg font-bold text-white mb-2">Override Score Cap?</h2>
          <p className="text-body-sm text-zinc-400">
            Your behavioral data suggests a different score
          </p>
        </div>

        {/* Score Comparison */}
        <div className="space-y-4 mb-6">
          {/* Attempted Score */}
          <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-headline-lg">{attemptedLevel.emoji}</div>
              <div className="flex-1">
                <div className="text-body-sm text-zinc-400">You selected:</div>
                <div className={`text-title-md font-bold ${attemptedLevel.color}`}>
                  {attemptedLevel.label} ({currentScore})
                </div>
              </div>
            </div>
            <p className="text-label-sm text-zinc-400">{attemptedLevel.description}</p>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <svg
              className="w-6 h-6 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Max Allowed Score */}
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-headline-lg">{maxAllowedLevel.emoji}</div>
              <div className="flex-1">
                <div className="text-body-sm text-zinc-400">Data suggests max:</div>
                <div className={`text-title-md font-bold ${maxAllowedLevel.color}`}>
                  {maxAllowedLevel.label} ({maxAllowed})
                </div>
              </div>
            </div>
            <p className="text-label-sm text-zinc-400">{maxAllowedLevel.description}</p>
          </div>
        </div>

        {/* Warning Message */}
        <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg mb-6">
          <p className="text-label-sm text-zinc-400 leading-relaxed">
            <span className="font-semibold text-yellow-400">Warning:</span> Overriding this cap
            will be recorded. Consistent overrides may indicate misaligned self-assessment and
            could skew your long-term trends.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-red-600 border border-red-500 rounded-lg text-white font-medium hover:bg-red-700 transition-colors"
          >
            Override Anyway
          </button>
        </div>

        {/* Tip */}
        <p className="text-center text-label-sm text-zinc-500 mt-4">
          Tip: Adjust your score to match the data for accurate insights
        </p>
      </div>
    </div>
  )
}
