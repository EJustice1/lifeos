'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/context/SessionContext'
import {
  startWorkout as startWorkoutAction,
  logLift as logLiftAction,
  endWorkout as endWorkoutAction,
  deleteWorkout as deleteWorkoutAction,
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
  endWorkout: () => Promise<{ saved: boolean }>
  isWorkoutActive: boolean
  getSessionDuration: () => number
  restoreFromDatabase: (dbWorkout: any) => void
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

  // Restore from database workout data (passed from parent)
  const restoreFromDatabase = useCallback((dbWorkout: any) => {
    if (!dbWorkout || localActiveWorkout) return

    const gymData: GymSessionData = {
      workoutId: dbWorkout.id,
      workoutType: dbWorkout.type || 'General',
      loggedSets: dbWorkout.lifts?.map((lift: any) => ({
        exercise: lift.exercise?.name || 'Unknown',
        exerciseId: lift.exercise_id,
        setNumber: lift.set_number,
        reps: lift.reps,
        weight: lift.weight,
        estimated1RM: calculate1RM(lift.weight, lift.reps),
      })) || [],
      startedAt: dbWorkout.started_at,
    }

    // Start session in context
    startSession('workout', {
      workoutType: dbWorkout.type || 'General',
      workoutId: dbWorkout.id,
      sessionData: gymData,
    })

    setLocalActiveWorkout(gymData)
  }, [localActiveWorkout, startSession])

  // Sync with SessionContext on mount and when activeSession changes
  useEffect(() => {
    // Check if there's an active workout in session context (from localStorage)
    if (activeSession?.type === 'workout' && activeSession.workoutId) {
      const gymData: GymSessionData = {
        workoutId: activeSession.workoutId,
        workoutType: activeSession.workoutType || 'General',
        loggedSets: activeSession.sessionData?.loggedSets || [],
        startedAt: activeSession.startedAt,
      }
      setLocalActiveWorkout(gymData)
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

  const endWorkout = useCallback(async (): Promise<{ saved: boolean }> => {
    // #region agent log
    console.log('[DEBUG useGymSession.ts:199] endWorkout called', {hasLocalActiveWorkout:!!localActiveWorkout,workoutId:localActiveWorkout?.workoutId});
    // #endregion
    
    if (!localActiveWorkout) {
      throw new Error('No active workout')
    }

    // Capture exact end time on client (before network delay)
    const endedAt = new Date().toISOString()

    // Don't save if no sets were logged - delete the empty workout entry
    if (!localActiveWorkout.loggedSets || localActiveWorkout.loggedSets.length === 0) {
      try {
        // First mark workout as ended (so it's not detected as active anymore)
        // Then delete the empty workout from database
        await endWorkoutAction(localActiveWorkout.workoutId, endedAt)
        await deleteWorkoutAction(localActiveWorkout.workoutId)
      } catch (error) {
        console.error('Failed to end/delete empty workout:', error)
        // Continue anyway to clear local state
      }
      
      // Clear session (no banner)
      endContextSession()
      setLocalActiveWorkout(null)
      return { saved: false } // Indicate no data was saved
    }

    try {
      // #region agent log
      console.log('[DEBUG useGymSession.ts:211] Before endWorkoutAction call', {workoutId:localActiveWorkout.workoutId,endedAt});
      // #endregion

      // End workout in database with client timestamp
      await endWorkoutAction(localActiveWorkout.workoutId, endedAt)

      // #region agent log
      console.log('[DEBUG useGymSession.ts:218] After endWorkoutAction success', {workoutId:localActiveWorkout.workoutId});
      // #endregion

      // Clear session
      endContextSession()
      
      // #region agent log
      console.log('[DEBUG useGymSession.ts:226] After endContextSession');
      // #endregion
      
      setLocalActiveWorkout(null)
      
      // #region agent log
      console.log('[DEBUG useGymSession.ts:233] After setLocalActiveWorkout(null)');
      // #endregion

      return { saved: true } // Indicate data was saved successfully
    } catch (error) {
      // #region agent log
      console.error('[DEBUG useGymSession.ts:239] endWorkout error caught', {error:error instanceof Error ? error.message : String(error),workoutId:localActiveWorkout.workoutId});
      // #endregion
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
    restoreFromDatabase,
  }
}
