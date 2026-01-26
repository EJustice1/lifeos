'use client'

import { useState } from 'react'
import { useTasks } from '@/contexts/TaskContext'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

interface PromoteToTodayButtonProps {
  taskId: string
  compact?: boolean
}

export function PromoteToTodayButton({ taskId, compact = false }: PromoteToTodayButtonProps) {
  const { promoteTaskToToday } = useTasks()
  const [loading, setLoading] = useState(false)

  const handlePromote = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      setLoading(true)
      triggerHapticFeedback(HapticPatterns.MEDIUM)
      await promoteTaskToToday(taskId)
      triggerHapticFeedback(HapticPatterns.SUCCESS)
    } catch (error) {
      console.error('Failed to promote task:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <button
        onClick={handlePromote}
        disabled={loading}
        className="p-2 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
        aria-label="Promote to today"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={handlePromote}
      disabled={loading}
      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Promoting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          Promote to Today
        </>
      )}
    </button>
  )
}
