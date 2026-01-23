'use client'

import { useCallback } from 'react'
import { useUnifiedSession, type BaseSessionData } from './useUnifiedSession'
import {
  startWorkout as startWorkoutAction,
  logLift as logLiftAction,
  endWorkout as endWorkoutAction,
  deleteWorkout as deleteWorkoutAction,
  getActiveWorkout,
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

export interface GymSessionData extends BaseSessionData {
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
  /** Session status for UI feedback */
  status: 'idle' | 'starting' | 'active' | 'ending' | 'recovering'
  /** Sync with database (useful after potential stale state) */
  syncWithDatabase: () => Promise<void>
}

/**
 * Transform database workout to local session format
 */
function transformDbWorkout(dbWorkout: any): GymSessionData {
  return {
    id: dbWorkout.id,
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
}

export function useGymSession(): UseGymSessionReturn {
  const {
    session: activeWorkout,
    status,
    startSession,
    endSession,
    updateSession,
    getSessionDuration,
    restoreFromDatabase: unifiedRestore,
    isActive,
    syncWithDatabase,
  } = useUnifiedSession<GymSessionData, string>({
    type: 'workout',
    
    // Check database for active workout
    checkActiveSession: async () => {
      const dbWorkout = await getActiveWorkout()
      return dbWorkout
    },
    
    // Start a new workout in the database
    onStart: async (workoutType: string) => {
      const workout = await startWorkoutAction(workoutType || undefined)
      return workout
    },
    
    // End workout in database
    onEnd: async (workoutId: string, endedAt: string) => {
      await endWorkoutAction(workoutId, endedAt)
    },
    
    // Delete empty workout
    onDelete: async (workoutId: string) => {
      await deleteWorkoutAction(workoutId)
    },
    
    // Transform DB format to local format
    transformFromDb: transformDbWorkout,
    
    // Extract metadata for localStorage
    getMetadata: (session) => ({
      workoutId: session.workoutId,
      workoutType: session.workoutType,
    }),
    
    // Only save if there are logged sets
    shouldSaveSession: (session) => {
      return session.loggedSets && session.loggedSets.length > 0
    },
  })

  /**
   * Start a new workout
   */
  const startWorkout = useCallback(async (type: string) => {
    await startSession(type)
  }, [startSession])

  /**
   * Log a set with optimistic update
   */
  const logSet = useCallback(
    async (
      exerciseId: number,
      weight: number,
      reps: number,
      exerciseName: string,
      rpe?: number
    ): Promise<{ isNewPR: boolean }> => {
      if (!activeWorkout) {
        throw new Error('No active workout')
      }

      const currentExerciseSets = activeWorkout.loggedSets.filter(
        (s) => s.exerciseId === exerciseId
      )
      const setNumber = currentExerciseSets.length + 1

      // Create new set
      const newSet: LoggedSet = {
        exercise: exerciseName,
        exerciseId,
        setNumber,
        reps,
        weight,
        estimated1RM: calculate1RM(weight, reps),
        isNewPR: false,
      }

      // Optimistically update local state
      updateSession((prev) => ({
        ...prev,
        loggedSets: [...prev.loggedSets, newSet],
      }))

      try {
        // Save to database
        const result = await logLiftAction(activeWorkout.workoutId, exerciseId, weight, reps, rpe)

        // Update with actual PR status if it's a new PR
        if (result.isNewPR) {
          updateSession((prev) => ({
            ...prev,
            loggedSets: prev.loggedSets.map((s, i) =>
              i === prev.loggedSets.length - 1 ? { ...s, isNewPR: true } : s
            ),
          }))
        }

        return { isNewPR: result.isNewPR }
      } catch (error) {
        // Rollback on error - remove the optimistically added set
        updateSession((prev) => ({
          ...prev,
          loggedSets: prev.loggedSets.slice(0, -1),
        }))
        console.error('Failed to log set:', error)
        throw error
      }
    },
    [activeWorkout, updateSession]
  )

  /**
   * End the current workout
   * Uses atomic operations from useUnifiedSession to prevent race conditions
   */
  const endWorkout = useCallback(async (): Promise<{ saved: boolean }> => {
    return endSession()
  }, [endSession])

  /**
   * Restore session from database data (for page load recovery)
   */
  const restoreFromDatabase = useCallback((dbWorkout: any) => {
    unifiedRestore(dbWorkout)
  }, [unifiedRestore])

  return {
    activeWorkout,
    startWorkout,
    logSet,
    endWorkout,
    isWorkoutActive: isActive,
    getSessionDuration,
    restoreFromDatabase,
    status,
    syncWithDatabase,
  }
}
