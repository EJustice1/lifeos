'use client'

import { useState, useEffect } from 'react'
import { getExercisePR } from '@/lib/actions/gym'
import { calculate1RM } from '@/lib/gym-utils'

interface ExercisePRDisplayProps {
  exerciseId: number
  currentWeight: number
  currentReps: number
}

export function ExercisePRDisplay({ exerciseId, currentWeight, currentReps }: ExercisePRDisplayProps) {
  const [pr, setPR] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isNewPR, setIsNewPR] = useState(false)

  useEffect(() => {
    async function loadPR() {
      setLoading(true)
      const prData = await getExercisePR(exerciseId)
      setPR(prData)
      setLoading(false)

      // Check if current set matches or beats PR
      if (prData && currentWeight > 0 && currentReps > 0) {
        const currentEst1RM = calculate1RM(currentWeight, currentReps)
        const prEst1RM = prData.estimated_1rm

        if (currentEst1RM >= prEst1RM + 2.5 ||
            (currentWeight > prData.weight && currentReps >= prData.reps)) {
          setIsNewPR(true)
        } else {
          setIsNewPR(false)
        }
      }
    }

    loadPR()
  }, [exerciseId, currentWeight, currentReps])

  if (loading) return null
  if (!pr) return null

  return (
    <div className="flex items-center gap-2">
      {isNewPR && (
        <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full animate-pulse">
          NEW PR!
        </span>
      )}
      <span className="text-xs text-zinc-400">
        Current PR: {pr.weight} lbs × {pr.reps} (Est. 1RM: {pr.estimated_1rm})
      </span>
    </div>
  )
}
