'use client'

import { useState, useTransition, useEffect, memo, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useGymSession, type LoggedSet } from '@/lib/hooks/useGymSession'
import { calculate1RM, PREDEFINED_EXERCISES, WORKOUT_TYPES, getExercisesForWorkoutType, type WorkoutType, type PredefinedExercise } from '@/lib/gym-utils'
import { getRecentWorkoutsTransformed } from '@/lib/actions/gym'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { MobileSelect } from '@/components/mobile/inputs/MobileSelect'
import { AdjustButton } from '@/components/mobile/buttons/AdjustButton'
import { useToast } from '@/components/mobile/feedback/ToastProvider'
import { ClientCache, CACHE_KEYS, CACHE_DURATIONS } from '@/lib/cache-utils'
import { useRouter } from 'next/navigation'

interface WorkoutHistory {
  id: string
  date: string
  type: string
  duration: number // in minutes
  totalVolume: number // in lbs
  exercises: Array<{
    name: string
    totalSets: number
    totalReps: number
    totalVolume: number
    sets: Array<{
      setNumber: number
      reps: number
      weight: number
      volume: number
      estimated1RM: number
    }>
  }>
}

// Workout History Card Component - Memoized
const WorkoutHistoryCard = memo(({ workout, onExerciseClick }: {
  workout: WorkoutHistory
  onExerciseClick: (exerciseName: string) => void
}) => {
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)

  return (
    <div className="border-b border-zinc-800 pb-4">
      {/* Workout Header - Clickable */}
      <button
        onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
        className="w-full text-left mb-3 flex items-center justify-between"
      >
        <div>
          <p className="font-semibold">{workout.type} Workout</p>
          <p className="text-sm text-zinc-400">{new Date(workout.date).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-emerald-400 font-bold">{workout.totalVolume.toLocaleString()} lbs</p>
            <p className="text-sm text-zinc-400">{workout.duration} min</p>
          </div>
          <svg
            className={`w-5 h-5 transform transition-transform ${expandedWorkout === workout.id ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Exercise List - Only show when workout is expanded */}
      {expandedWorkout === workout.id && (
        <div className="space-y-2 ml-4">
          {workout.exercises.map((exercise) => (
            <div key={exercise.name} className="border-l-2 border-zinc-700 pl-3">
              {/* Exercise Header - Clickable */}
              <button
                onClick={() => setExpandedExercise(expandedExercise === exercise.name ? null : exercise.name)}
                className="w-full text-left py-2 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium">{exercise.name}</span>
                  <span className="text-zinc-400 ml-2 text-sm">
                    {exercise.totalSets} sets • {exercise.totalReps} reps • {exercise.totalVolume} lbs
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 transform transition-transform ${expandedExercise === exercise.name ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Expanded Set Details - More Compact */}
              {expandedExercise === exercise.name && (
                <div className="ml-4 mt-2 space-y-1">
                  {exercise.sets.map((set, index) => (
                    <div key={index} className="bg-zinc-900/50 rounded p-1.5 flex items-center justify-between text-xs">
                      <span className="text-zinc-300">Set {set.setNumber}</span>
                      <span className="text-emerald-400 font-semibold">
                        {set.weight} × {set.reps} = {set.volume} lbs
                      </span>
                      <span className="text-purple-400 ml-2">1RM: {set.estimated1RM}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
})

WorkoutHistoryCard.displayName = 'WorkoutHistoryCard'

interface GymLoggerProps {
  initialActiveWorkout?: any
}

export function GymLogger({ initialActiveWorkout }: GymLoggerProps) {
  const [isPending, startTransition] = useTransition()
  const [reps, setReps] = useState(8)
  const [weight, setWeight] = useState(135)
  const [workoutType, setWorkoutType] = useState<WorkoutType | ''>('')
  const [activeSection, setActiveSection] = useState<'workout' | 'history'>('workout')
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const router = useRouter()

  // Get exercises filtered by workout type (memoized for performance)
  const exercises = useMemo(() => {
    if (!workoutType) return PREDEFINED_EXERCISES;
    return getExercisesForWorkoutType(workoutType);
  }, [workoutType]);

  const [selectedExercise, setSelectedExercise] = useState<number | null>(null)

  // Update selected exercise when workout type changes
  useEffect(() => {
    if (exercises.length > 0 && (!selectedExercise || !exercises.find(e => e.id === selectedExercise))) {
      setSelectedExercise(exercises[0].id)
    }
  }, [exercises, selectedExercise])

  // Function to load workout history from database (lazy loaded, server-side transformed, cached)
  const loadWorkoutHistory = async () => {
    if (historyLoaded) return; // Already loaded
    
    setHistoryLoading(true)
    try {
      // Try to get from cache first
      const cachedHistory = ClientCache.get<WorkoutHistory[]>(CACHE_KEYS.WORKOUT_HISTORY_TRANSFORMED(5))
      
      if (cachedHistory) {
        setWorkoutHistory(cachedHistory)
        setHistoryLoaded(true)
        setHistoryLoading(false)
      }

      // Fetch fresh data in background
      const transformedHistory = await getRecentWorkoutsTransformed(5)
      setWorkoutHistory(transformedHistory)
      setHistoryLoaded(true)
      
      // Cache for 5 minutes
      ClientCache.set(CACHE_KEYS.WORKOUT_HISTORY_TRANSFORMED(5), transformedHistory, CACHE_DURATIONS.MEDIUM)
    } catch (error) {
      console.error('Failed to load workout history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Load history when history section is opened
  useEffect(() => {
    if (activeSection === 'history' && !historyLoaded) {
      loadWorkoutHistory()
    }
  }, [activeSection, historyLoaded])
  const {
    activeWorkout,
    startWorkout,
    logSet,
    endWorkout,
    isWorkoutActive,
    getSessionDuration,
    restoreFromDatabase,
  } = useGymSession()

  // Restore active workout from database if found
  useEffect(() => {
    if (initialActiveWorkout && !isWorkoutActive) {
      restoreFromDatabase(initialActiveWorkout)
      setWorkoutType((initialActiveWorkout.type || '') as WorkoutType | '')
    }
  }, [initialActiveWorkout, isWorkoutActive, restoreFromDatabase])

  // Get logged sets from active workout
  const loggedSets = activeWorkout?.loggedSets || []

  // Sync workout duration
  const [workoutDuration, setWorkoutDuration] = useState<number>(getSessionDuration())

  // Calculate estimated 1RM for current input
  const estimated1RM = calculate1RM(weight, reps)


  // Update timer display every second when workout is active
  useEffect(() => {
    if (isWorkoutActive) {
      const interval = setInterval(() => {
        setWorkoutDuration(getSessionDuration())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isWorkoutActive, getSessionDuration])

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate total volume for current workout
  const totalVolume = loggedSets.reduce((sum, s) => sum + s.reps * s.weight, 0)

  // Get sets for current exercise
  const currentExerciseSets = selectedExercise ? loggedSets.filter(s => s.exerciseId === selectedExercise) : []
  const currentSetNumber = currentExerciseSets.length + 1

  // Get current exercise details
  const currentExerciseDetails = exercises.find(e => e.id === selectedExercise)

  const adjustWeight = useCallback((delta: number) => {
    setWeight(prev => Math.max(0, prev + delta))
  }, [])

  const adjustReps = useCallback((delta: number) => {
    setReps(prev => Math.max(1, prev + delta))
  }, [])

  const { showToast } = useToast()

  const handleStartWorkout = useCallback(async (type: WorkoutType) => {
    setWorkoutType(type)
    startTransition(async () => {
      try {
        await startWorkout(type)
      } catch (error) {
        showToast('Failed to start workout', 'error')
      }
    })
  }, [startWorkout, showToast])

  const handleLogSet = useCallback(async () => {
    if (!isWorkoutActive || !selectedExercise) return

    startTransition(async () => {
      try {
        const exerciseName = exercises.find(e => e.id === selectedExercise)?.name ?? ''
        const result = await logSet(selectedExercise, weight, reps, exerciseName)

        if (result.isNewPR) {
          showToast(`🏆 New PR on ${exerciseName}!`, 'success')
        }
      } catch (error) {
        showToast('Failed to log set', 'error')
      }
    })
  }, [isWorkoutActive, selectedExercise, weight, reps, exercises, logSet, activeWorkout, showToast])

  const handleEndWorkout = useCallback(async () => {
    if (!activeWorkout) return

    // Capture workout ID and check if any sets were logged
    const workoutId = activeWorkout.workoutId
    const hasLoggedSets = loggedSets.length > 0

    startTransition(async () => {
      try {
        // End workout (will handle empty workouts internally)
        const result = await endWorkout()

        // Mark history as not loaded so it refreshes next time
        setHistoryLoaded(false)
        
        // Invalidate workout history cache
        ClientCache.remove(CACHE_KEYS.WORKOUT_HISTORY_TRANSFORMED(5))

        // Only navigate to review if workout has sets logged
        if (result.saved && workoutId && hasLoggedSets) {
          router.push(`/review/gym?sessionId=${workoutId}`)
        } else {
          // Empty workout or not saved, just reset state
          setWorkoutType('')
          setActiveSection('workout')
          // Refresh to show any updated history
          router.refresh()
        }
      } catch (error) {
        showToast('Failed to end workout', 'error')
        // Reset state on error
        setWorkoutType('')
        setActiveSection('workout')
      }
    })
  }, [activeWorkout, endWorkout, loggedSets, showToast, setActiveSection, setHistoryLoaded, setWorkoutType, router])



  // Group logged sets by exercise for summary
  const exerciseSummary = loggedSets.reduce((acc, set) => {
    if (!acc[set.exercise]) {
      acc[set.exercise] = { sets: 0, totalReps: 0, totalVolume: 0, bestSet: set, best1RM: set.estimated1RM }
    }
    acc[set.exercise].sets++
    acc[set.exercise].totalReps += set.reps
    acc[set.exercise].totalVolume += set.reps * set.weight
    if (set.estimated1RM > acc[set.exercise].best1RM) {
      acc[set.exercise].bestSet = set
      acc[set.exercise].best1RM = set.estimated1RM
    }
    return acc
  }, {} as Record<string, { sets: number; totalReps: number; totalVolume: number; bestSet: LoggedSet; best1RM: number }>)



  return (
    <div className="min-h-screen bg-[var(--mobile-bg)] pb-24">
      <section className="space-y-4">
      {activeSection === 'workout' && !isWorkoutActive ? (
          /* New front screen design - 2-column grid with big buttons */
          <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
            <div className="grid grid-cols-2 gap-4 flex-1 content-start">
              {/* Workout Type Buttons - 2 columns */}
              {WORKOUT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleStartWorkout(type)}
                  disabled={isPending}
                  className={`p-6 rounded-xl text-lg font-semibold transition-all ${
                    isPending
                      ? 'bg-[var(--mobile-card-bg)] text-white opacity-50'
                      : 'bg-[var(--mobile-card-bg)] text-white hover:bg-zinc-800 active:bg-[var(--mobile-accent)]'
                  }`}
                >
                  {type}
                </button>
              ))}

              {/* See History Button */}
              <button
                onClick={() => setActiveSection('history')}
                disabled={historyLoading}
                className="p-6 rounded-xl text-lg font-semibold bg-zinc-800 text-white hover:bg-zinc-700 transition-all col-span-2 disabled:opacity-50"
              >
                {historyLoading ? 'Loading...' : 'See History'}
              </button>

              {/* Progress Button */}
              <Link
                href="/m/gym/progress"
                className="p-6 rounded-xl text-lg font-semibold bg-purple-900/50 text-purple-300 hover:bg-purple-900/70 transition-all col-span-2 text-center"
              >
                Progress & Strength
              </Link>
            </div>

          </div>
        ) : activeSection === 'workout' && isWorkoutActive ? (
        /* Active workout screen */
        <>
          <MobileCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active Workout</p>
                <p className="font-semibold text-lg">
                  {activeWorkout?.workoutType || 'General'} • {loggedSets.length} sets
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Timer</p>
                <p className="font-bold text-yellow-400 text-lg">
                  {formatDuration(workoutDuration)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Volume</p>
                <p className="font-bold text-emerald-400 text-lg">
                  {totalVolume.toLocaleString()} lbs
                </p>
              </div>
            </div>
          </MobileCard>


          <MobileCard>
            <div className="text-sm text-zinc-400 mb-2">Exercise</div>
            <MobileSelect
              options={exercises.map((ex) => ({
                value: ex.id.toString(),
                label: `${ex.name} ${ex.is_compound ? '🏋️' : ''}`,
              }))}
              value={selectedExercise?.toString() || ''}
              onChange={(e) => setSelectedExercise(e.target.value ? parseInt(e.target.value) : null)}
            />
          </MobileCard>

          {/* Set counter */}
          <div className="bg-orange-900/30 rounded-lg p-3 text-center">
            <span className="text-orange-400 font-bold">Set #{currentSetNumber}</span>
            {currentExerciseSets.length > 0 && (
              <span className="text-zinc-400 ml-2">
                (Previous: {currentExerciseSets[currentExerciseSets.length - 1].reps} × {currentExerciseSets[currentExerciseSets.length - 1].weight} lbs)
              </span>
            )}
          </div>

          {/* Show rep and 1RM counter above reps, always show volume */}
          <MobileCard>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-zinc-500 text-sm block">Set Volume</span>
                <span className="text-emerald-400 font-bold text-xl">
                  {(reps * weight).toLocaleString()} lbs
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-sm block">Est. 1RM</span>
                <span className="text-purple-400 font-bold text-xl">
                  {estimated1RM} lbs
                </span>
              </div>
            </div>
          </MobileCard>

          <MobileCard>
            <div className="text-sm text-zinc-400 mb-3 text-center">Reps</div>
            <div className="flex items-center justify-center gap-4">
              <AdjustButton onClick={() => adjustReps(-1)}>−</AdjustButton>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(Math.max(1, Number(e.target.value)))}
                className="w-24 bg-transparent text-5xl font-bold text-center"
              />
              <AdjustButton onClick={() => adjustReps(1)}>+</AdjustButton>
            </div>
          </MobileCard>

          <MobileCard>
            <div className="text-sm text-zinc-400 block mb-3 text-center">Weight (lbs)</div>
            <div className="flex items-center justify-center gap-4">
              <AdjustButton onClick={() => adjustWeight(-5)}>-5</AdjustButton>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
                className="w-28 bg-transparent text-5xl font-bold text-center"
              />
              <AdjustButton onClick={() => adjustWeight(5)}>+5</AdjustButton>
            </div>
            {/* Quick weight adjustments */}
            <div className="flex justify-center gap-2 mt-3">
              {[-10, -2.5, 2.5, 10].map(delta => (
                <button
                  key={delta}
                  onClick={() => adjustWeight(delta)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-400"
                >
                  {delta > 0 ? '+' : ''}{delta}
                </button>
              ))}
            </div>
          </MobileCard>

          {/* Side-by-side buttons moved above workout summary */}
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton
              variant="primary"
              size="lg"
              onClick={handleLogSet}
              disabled={isPending || !selectedExercise}
              loading={isPending}
              className="w-full"
            >
              {isPending ? 'Logging...' : 'Log Set'}
            </PrimaryButton>

            <PrimaryButton
              variant="secondary"
              size="lg"
              onClick={handleEndWorkout}
              disabled={isPending}
              className="w-full"
            >
              End Workout
            </PrimaryButton>
          </div>


          {/* Logged sets summary - Compact display like history */}
          {Object.keys(exerciseSummary).length > 0 && (
            <MobileCard>
              <h3 className="text-sm text-zinc-400 mb-3 font-medium">This Workout</h3>
              <div className="space-y-2 ml-2">
                {Object.entries(exerciseSummary).map(([exerciseName, data]) => (
                  <div key={exerciseName} className="border-l-2 border-zinc-700 pl-3">
                    <div className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{exerciseName}</span>
                        <span className="text-zinc-400 ml-2 text-sm">
                          {data.sets} sets • {data.totalReps} reps • {data.totalVolume} lbs
                        </span>
                      </div>
                      <span className="text-emerald-400 font-semibold">
                        Best: {data.bestSet.reps}×{data.bestSet.weight}
                        {data.bestSet.isNewPR && <span className="text-yellow-400 ml-1">🏆</span>}
                      </span>
                    </div>

                    {/* Show all sets for this exercise - compact format */}
                    <div className="ml-4 mt-1 space-y-1">
                      {loggedSets
                        .filter(set => set.exercise === exerciseName)
                        .map((set, index) => (
                          <div key={index} className="bg-zinc-900/50 rounded p-1.5 flex items-center justify-between text-xs">
                            <span className="text-zinc-300">Set {set.setNumber}</span>
                            <span className="text-emerald-400 font-semibold">
                              {set.weight} × {set.reps} = {set.weight * set.reps} lbs
                            </span>
                            <span className="text-purple-400 ml-2">1RM: {set.estimated1RM}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </MobileCard>
          )}
        </>
      ) : activeSection === 'history' ? (
        /* Enhanced History Section */
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4">

          <MobileCard className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Workout History</h2>
              <button
                onClick={() => setActiveSection('workout')}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {historyLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--mobile-accent)] mx-auto mb-4"></div>
                <p className="text-zinc-400">Loading history...</p>
              </div>
            ) : workoutHistory.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">No workout history yet. Complete a workout to see your history here.</p>
            ) : (
              <div className="space-y-4">
                {workoutHistory.map(workout => (
                  <WorkoutHistoryCard
                    key={workout.id}
                    workout={workout}
                    onExerciseClick={(exerciseName) => {
                      // Handle exercise click - could show detailed view
                      console.log('Exercise clicked:', exerciseName)
                    }}
                  />
                ))}
              </div>
            )}
          </MobileCard>
        </div>
      ) : null}
      </section>
    </div>
  )
}
