'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  startWorkout,
  logLift,
  endWorkout,
} from '@/lib/actions/gym'
import { calculate1RM, MUSCLE_GROUPS } from '@/lib/gym-utils'

interface Exercise {
  readonly id: number
  readonly name: string
  readonly category: string
  readonly primary_muscles?: readonly string[]
  readonly secondary_muscles?: readonly string[]
  readonly is_compound: boolean
  readonly equipment?: string
}

interface LoggedSet {
  exercise: string
  exerciseId: number
  setNumber: number
  reps: number
  weight: number
  estimated1RM: number
  isNewPR?: boolean
}

export function GymLogger({
  exercises,
}: {
  exercises: readonly Exercise[]
}) {
  const [isPending, startTransition] = useTransition()
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<number | null>(exercises.length > 0 ? exercises[0].id : null)
  const [reps, setReps] = useState(8)
  const [weight, setWeight] = useState(135)
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([])
  const [prCelebration, setPrCelebration] = useState<string | null>(null)
  const [workoutType, setWorkoutType] = useState<string>('')

  // Calculate estimated 1RM for current input
  const estimated1RM = calculate1RM(weight, reps)

  // Calculate total volume for current workout
  const totalVolume = loggedSets.reduce((sum, s) => sum + s.reps * s.weight, 0)

  // Get sets for current exercise
  const currentExerciseSets = selectedExercise ? loggedSets.filter(s => s.exerciseId === selectedExercise) : []
  const currentSetNumber = currentExerciseSets.length + 1

  // Get current exercise details
  const currentExerciseDetails = exercises.find(e => e.id === selectedExercise)


  // Clear PR celebration after delay
  useEffect(() => {
    if (prCelebration) {
      const timer = setTimeout(() => setPrCelebration(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [prCelebration])

  const adjustWeight = (delta: number) => {
    setWeight(prev => Math.max(0, prev + delta))
  }

  const adjustReps = (delta: number) => {
    setReps(prev => Math.max(1, prev + delta))
  }



  async function handleStartWorkout() {
    startTransition(async () => {
      const workout = await startWorkout(workoutType || undefined)
      setActiveWorkout(workout.id)
    })
  }

  async function handleLogSet() {
    if (!activeWorkout || !selectedExercise) return

    startTransition(async () => {
      // Use the new logLift function which handles PR detection internally
      const result = await logLift(activeWorkout, selectedExercise, weight, reps)
      const exerciseName = exercises.find(e => e.id === selectedExercise)?.name ?? ''

      if (result.isNewPR) {
        setPrCelebration(`New PR on ${exerciseName}!`)
      }

      setLoggedSets(prev => [...prev, {
        exercise: exerciseName,
        exerciseId: selectedExercise,
        setNumber: currentSetNumber,
        reps,
        weight,
        estimated1RM: calculate1RM(weight, reps),
        isNewPR: result.isNewPR,
      }])
    })
  }

  async function handleEndWorkout() {
    if (!activeWorkout) return

    startTransition(async () => {
      await endWorkout(activeWorkout)
      setActiveWorkout(null)
      setLoggedSets([])
      setWorkoutType('')
    })
  }



  // Group logged sets by exercise for summary
  const exerciseSummary = loggedSets.reduce((acc, set) => {
    if (!acc[set.exercise]) {
      acc[set.exercise] = { sets: 0, totalVolume: 0, bestSet: set, best1RM: set.estimated1RM }
    }
    acc[set.exercise].sets++
    acc[set.exercise].totalVolume += set.reps * set.weight
    if (set.estimated1RM > acc[set.exercise].best1RM) {
      acc[set.exercise].bestSet = set
      acc[set.exercise].best1RM = set.estimated1RM
    }
    return acc
  }, {} as Record<string, { sets: number; totalVolume: number; bestSet: LoggedSet; best1RM: number }>)



  return (
    <section className="space-y-4">
      {/* PR Celebration Toast */}
      {prCelebration && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-center animate-bounce shadow-lg">
          <span className="text-2xl mr-2">🏆</span>
          <span className="font-bold text-lg">{prCelebration}</span>
        </div>
      )}

      {!activeWorkout ? (
        /* Pre-workout screen */
        <div className="space-y-4">
          {/* Workout type selector */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-sm text-zinc-400 block mb-2">Workout Type (optional)</label>
            <div className="grid grid-cols-3 gap-2">
              {['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full'].map(type => (
                <button
                  key={type}
                  onClick={() => setWorkoutType(workoutType === type ? '' : type)}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    workoutType === type
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartWorkout}
            disabled={isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 rounded-xl p-5 text-xl font-bold transition-colors"
          >
            {isPending ? 'Starting...' : 'Start Workout'}
          </button>

          {/* Quick stats */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <p className="text-sm text-zinc-400">{exercises.length} exercises available</p>
          </div>
        </div>
      ) : (
        /* Active workout screen */
        <>
          {/* Workout header */}
          <div className="bg-zinc-900 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Active Workout</p>
              <p className="font-semibold text-lg">
                {workoutType || 'General'} • {loggedSets.length} sets
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400">Volume</p>
              <p className="font-bold text-emerald-400 text-lg">
                {totalVolume.toLocaleString()} lbs
              </p>
            </div>
          </div>

          {/* Quick muscle group navigation */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-sm text-zinc-400 block mb-2">Browse by Muscle Group</label>
            <div className="grid grid-cols-3 gap-2">
              {MUSCLE_GROUPS.map(mg => {
                const exercisesForGroup = exercises.filter(ex =>
                  (ex.primary_muscles?.includes(mg) || ex.secondary_muscles?.includes(mg))
                )
                return (
                  <button
                    key={mg}
                    onClick={() => {
                      const firstExercise = exercisesForGroup[0]
                      if (firstExercise) setSelectedExercise(firstExercise.id)
                    }}
                    disabled={exercisesForGroup.length === 0}
                    className={`p-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                      exercisesForGroup.length === 0
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {mg} ({exercisesForGroup.length})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Exercise selector with add button */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-zinc-400">Exercise</label>
            </div>
            <select
              value={selectedExercise || ''}
              onChange={(e) => setSelectedExercise(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full bg-zinc-800 rounded-lg p-4 text-lg font-medium"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} {ex.is_compound ? '🏋️' : ''}
                </option>
              ))}
            </select>
            {/* Muscle groups and exercise info display */}
            {currentExerciseDetails && (currentExerciseDetails.primary_muscles || currentExerciseDetails.secondary_muscles) && (
              <div className="flex flex-wrap gap-1 mt-2 items-center">
                {currentExerciseDetails.primary_muscles?.map((mg: string) => (
                  <span key={mg} className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded capitalize">
                    {mg}
                  </span>
                ))}
                {currentExerciseDetails.secondary_muscles?.map((mg: string) => (
                  <span key={mg} className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded capitalize">
                    {mg} (sec)
                  </span>
                ))}
                {currentExerciseDetails.is_compound && (
                  <span className="px-2 py-1 bg-emerald-900/50 text-emerald-300 text-xs rounded">
                    Compound
                  </span>
                )}
              </div>
            )}
          </div>


          {/* Set counter */}
          <div className="bg-orange-900/30 rounded-lg p-3 text-center">
            <span className="text-orange-400 font-bold">Set #{currentSetNumber}</span>
            {currentExerciseSets.length > 0 && (
              <span className="text-zinc-400 ml-2">
                (Previous: {currentExerciseSets[currentExerciseSets.length - 1].reps} × {currentExerciseSets[currentExerciseSets.length - 1].weight} lbs)
              </span>
            )}
          </div>

          {/* Reps input with +/- buttons */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-sm text-zinc-400 block mb-3 text-center">Reps</label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => adjustReps(-1)}
                className="w-16 h-16 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-xl text-2xl font-bold transition-colors"
              >
                −
              </button>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(Math.max(1, Number(e.target.value)))}
                className="w-24 bg-transparent text-5xl font-bold text-center"
              />
              <button
                onClick={() => adjustReps(1)}
                className="w-16 h-16 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-xl text-2xl font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Weight input with +/- buttons */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-sm text-zinc-400 block mb-3 text-center">Weight (lbs)</label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => adjustWeight(-5)}
                className="w-16 h-16 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-xl text-xl font-bold transition-colors"
              >
                −5
              </button>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
                className="w-28 bg-transparent text-5xl font-bold text-center"
              />
              <button
                onClick={() => adjustWeight(5)}
                className="w-16 h-16 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-xl text-xl font-bold transition-colors"
              >
                +5
              </button>
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
          </div>

          {/* Volume and 1RM preview */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
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
            <p className="text-center text-xs text-zinc-600 mt-2">
              1RM = {weight} × (36 ÷ (37 − {reps})) = {estimated1RM} lbs
            </p>
          </div>

          {/* Log Set button */}
          <button
            onClick={handleLogSet}
            disabled={isPending || !selectedExercise}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 rounded-xl p-5 text-xl font-bold transition-colors"
          >
            {isPending ? 'Logging...' : 'Log Set'}
          </button>

          {/* Logged sets summary */}
          {Object.keys(exerciseSummary).length > 0 && (
            <div className="bg-zinc-900 rounded-xl p-4">
              <h3 className="text-sm text-zinc-400 mb-3 font-medium">This Workout</h3>
              <div className="space-y-3">
                {Object.entries(exerciseSummary).map(([exercise, data]) => (
                  <div key={exercise} className="bg-zinc-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{exercise}</span>
                      <span className="text-emerald-400 font-bold">
                        {data.totalVolume.toLocaleString()} lbs
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">
                        {data.sets} sets • Best: {data.bestSet.reps}×{data.bestSet.weight}
                        {data.bestSet.isNewPR && <span className="text-yellow-400 ml-1">🏆</span>}
                      </span>
                      <span className="text-purple-400 font-medium">
                        1RM: {data.best1RM} lbs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* End Workout button */}
          <button
            onClick={handleEndWorkout}
            disabled={isPending}
            className="w-full bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 disabled:opacity-50 rounded-xl p-4 text-lg font-semibold transition-colors"
          >
            End Workout
          </button>
        </>
      )}


      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </section>
  )
}
