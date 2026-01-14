"use client";

import { getPredefinedExercises, getActiveWorkout, getRecentWorkoutsWithDetails } from '@/lib/actions/gym'
import { GymLogger } from './gym-logger'
import { useState, useEffect } from 'react'
import { calculate1RM } from '@/lib/gym-utils'

export default function GymPage() {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch predefined exercises
        const exercisesData = await getPredefinedExercises()
        setExercises([...exercisesData])

        // Check for any active workout in the database
        const activeWorkout = await getActiveWorkout()
        if (activeWorkout) {
          console.log('Found active workout in database:', activeWorkout)
          // The active workout will be handled by the useGymSession hook
        }

        // Load workout history from database
        const dbWorkoutHistory = await getRecentWorkoutsWithDetails(20)
        console.log('Loaded workout history:', dbWorkoutHistory.length, 'workouts')

        // Transform database workout history to match expected format
        const transformedHistory = dbWorkoutHistory.map(workout => {
          // Group lifts by exercise
          const exercisesMap = new Map<string, {
            totalSets: number;
            totalReps: number;
            totalVolume: number;
            sets: Array<{
              setNumber: number;
              reps: number;
              weight: number;
              volume: number;
              estimated1RM: number;
            }>;
          }>()

          workout.lifts.forEach((lift: any) => {
            const exerciseName = lift.exercise?.name || 'Unknown Exercise'
            const setVolume = lift.weight * lift.reps
            const estimated1RM = calculate1RM(lift.weight, lift.reps)

            if (!exercisesMap.has(exerciseName)) {
              exercisesMap.set(exerciseName, {
                totalSets: 0,
                totalReps: 0,
                totalVolume: 0,
                sets: []
              })
            }

            const exerciseData = exercisesMap.get(exerciseName)
            if (exerciseData) {
              exerciseData.totalSets += 1
              exerciseData.totalReps += lift.reps
              exerciseData.totalVolume += setVolume

              exerciseData.sets.push({
                setNumber: lift.set_number,
                reps: lift.reps,
                weight: lift.weight,
                volume: setVolume,
                estimated1RM: estimated1RM
              })
            }
          })

          // Calculate workout duration in minutes
          const workoutDuration = workout.ended_at && workout.started_at ?
            Math.round((new Date(workout.ended_at).getTime() - new Date(workout.started_at).getTime()) / (1000 * 60)) :
            0

          return {
            id: workout.id,
            date: workout.date || workout.started_at.split('T')[0],
            type: workout.type || 'General',
            duration: workoutDuration,
            totalVolume: workout.total_volume || Array.from(exercisesMap.values()).reduce((sum, ex) => sum + ex.totalVolume, 0),
            exercises: Array.from(exercisesMap.entries()).map(([name, data]) => ({
              name,
              totalSets: data.totalSets,
              totalReps: data.totalReps,
              totalVolume: data.totalVolume,
              sets: data.sets
            }))
          }
        })

        setWorkoutHistory(transformedHistory)

      } catch (error) {
        console.error('Failed to fetch gym data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const [workoutHistory, setWorkoutHistory] = useState<any[]>([])

  return (
    <div className="min-h-screen bg-[var(--mobile-bg)] text-white">
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--mobile-accent)]"></div>
        </div>
      ) : (
        <GymLogger exercises={exercises} initialWorkoutHistory={workoutHistory} />
      )}
    </div>
  )
}
