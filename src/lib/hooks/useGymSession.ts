'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/context/SessionContext'
import {
  startWorkout as startWorkoutAction,
  logLift as logLiftAction,
  endWorkout as endWorkoutAction,
} from '@/lib/actions/gym'
import { calculate1RM } from '@/lib/gym-utils'

export interface LoggedSet {
  exercise: string
  exerciseId: number
  setNumber: number
  reps: number
  weight: number
  estimated1RM: number
  isNewPR?: boolean
}

export interface GymSessionData {
  workoutId: string
  workoutType: string
  loggedSets: LoggedSet[]
  startedAt: string
}

export interface UseGymSessionReturn {
  activeWorkout: GymSessionData | null
  startWorkout: (type: string) => Promise<void>
  logSet: (
    exerciseId: number,
    weight: number,
    reps: number,
    exerciseName: string,
    rpe?: number
  ) => Promise<{ isNewPR: boolean }>
  endWorkout: () => Promise<void>
  isWorkoutActive: boolean
  getSessionDuration: () => number
}

export function useGymSession(): UseGymSessionReturn {
  const {
    activeSession,
    startSession,
    endSession: endContextSession,
    updateSessionData,
    getSessionDuration,
  } = useSession()

  const [localActiveWorkout, setLocalActiveWorkout] = useState<GymSessionData | null>(null)

  // Sync with SessionContext on mount and when activeSession changes
  useEffect(() => {
    if (activeSession?.type === 'workout' && activeSession.workoutId) {
      const gymData: GymSessionData = {
        workoutId: activeSession.workoutId,
        workoutType: activeSession.workoutType || 'General',
        loggedSets: activeSession.sessionData?.loggedSets || [],
        startedAt: activeSession.startedAt,
      }
      setLocalActiveWorkout(gymData)
    } else {
      setLocalActiveWorkout(null)
    }
  }, [activeSession])

  const startWorkout = useCallback(
    async (type: string) => {
      try {
        // Create workout in database
        const workout = await startWorkoutAction(type || undefined)

        // Initialize session data
        const initialData: GymSessionData = {
          workoutId: workout.id,
          workoutType: type || 'General',
          loggedSets: [],
          startedAt: new Date().toISOString(),
        }

        // Start session in context with initial data
        startSession('workout', {
          workoutType: type || 'General',
          workoutId: workout.id,
          sessionData: initialData,
        })

        setLocalActiveWorkout(initialData)
      } catch (error) {
        console.error('Failed to start workout:', error)
        throw error
      }
    },
    [startSession]
  )

  const logSet = useCallback(
    async (
      exerciseId: number,
      weight: number,
      reps: number,
      exerciseName: string,
      rpe?: number
    ): Promise<{ isNewPR: boolean }> => {
      if (!localActiveWorkout) {
        throw new Error('No active workout')
      }

      const currentExerciseSets = localActiveWorkout.loggedSets.filter(
        (s) => s.exerciseId === exerciseId
      )
      const setNumber = currentExerciseSets.length + 1

      // Optimistically update local state
      const newSet: LoggedSet = {
        exercise: exerciseName,
        exerciseId,
        setNumber,
        reps,
        weight,
        estimated1RM: calculate1RM(weight, reps),
        isNewPR: false,
      }

      const updatedSets = [...localActiveWorkout.loggedSets, newSet]
      const updatedWorkout: GymSessionData = {
        ...localActiveWorkout,
        loggedSets: updatedSets,
      }

      // Update local state immediately (optimistic)
      setLocalActiveWorkout(updatedWorkout)

      try {
        // Save to database
        const result = await logLiftAction(localActiveWorkout.workoutId, exerciseId, weight, reps, rpe)

        // Update with actual PR status
        if (result.isNewPR) {
          newSet.isNewPR = true
          const finalSets = updatedSets.map((s) =>
            s === newSet ? { ...s, isNewPR: true } : s
          )
          const finalWorkout: GymSessionData = {
            ...localActiveWorkout,
            loggedSets: finalSets,
          }
          setLocalActiveWorkout(finalWorkout)

          // Update session data in localStorage
          updateSessionData(finalWorkout)
        } else {
          // Update session data in localStorage
          updateSessionData(updatedWorkout)
        }

        return { isNewPR: result.isNewPR }
      } catch (error) {
        // Rollback on error
        setLocalActiveWorkout(localActiveWorkout)
        console.error('Failed to log set:', error)
        throw error
      }
    },
    [localActiveWorkout, updateSessionData]
  )

  const endWorkout = useCallback(async () => {
    if (!localActiveWorkout) {
      throw new Error('No active workout')
    }

    try {
      // End workout in database
      await endWorkoutAction(localActiveWorkout.workoutId)

      // Clear session
      endContextSession()
      setLocalActiveWorkout(null)
    } catch (error) {
      console.error('Failed to end workout:', error)
      throw error
    }
  }, [localActiveWorkout, endContextSession])

  return {
    activeWorkout: localActiveWorkout,
    startWorkout,
    logSet,
    endWorkout,
    isWorkoutActive: localActiveWorkout !== null,
    getSessionDuration,
  }
}
