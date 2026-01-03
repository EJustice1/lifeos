'use client'

import { useState, useTransition } from 'react'
import { startWorkout, logSet, endWorkout } from '@/lib/actions/gym'

interface Exercise {
  id: string
  name: string
  category: string
}

interface WorkoutSet {
  reps: number
  weight: number
  exercise: { name: string } | null
}

interface Workout {
  id: string
  date: string
  type: string | null
  total_volume: number
  workout_sets: WorkoutSet[]
}

export function GymLogger({
  exercises,
  lastWorkout,
}: {
  exercises: Exercise[]
  lastWorkout?: Workout
}) {
  const [isPending, startTransition] = useTransition()
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState(exercises[0]?.id ?? '')
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(8)
  const [weight, setWeight] = useState(135)
  const [loggedSets, setLoggedSets] = useState<{ exercise: string; sets: number; reps: number; weight: number }[]>([])

  const volume = sets * reps * weight

  const lastSet = lastWorkout?.workout_sets?.[0]
  const lastReference = lastSet
    ? `${lastSet.reps} reps @ ${lastSet.weight} lbs`
    : 'No previous data'

  async function handleStartWorkout() {
    startTransition(async () => {
      const workout = await startWorkout()
      setActiveWorkout(workout.id)
    })
  }

  async function handleLogSet() {
    if (!activeWorkout || !selectedExercise) return

    startTransition(async () => {
      await logSet(activeWorkout, selectedExercise, loggedSets.length + 1, reps, weight)
      const exerciseName = exercises.find(e => e.id === selectedExercise)?.name ?? ''
      setLoggedSets(prev => [...prev, { exercise: exerciseName, sets, reps, weight }])
    })
  }

  async function handleEndWorkout() {
    if (!activeWorkout) return

    startTransition(async () => {
      await endWorkout(activeWorkout)
      setActiveWorkout(null)
      setLoggedSets([])
    })
  }

  if (exercises.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 text-center">
        <p className="text-zinc-400">No exercises found. Run the database migration first.</p>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      {!activeWorkout ? (
        <button
          onClick={handleStartWorkout}
          disabled={isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl p-4 text-lg font-semibold transition-colors"
        >
          {isPending ? 'Starting...' : 'Start Workout'}
        </button>
      ) : (
        <>
          {/* Exercise selector */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-sm text-zinc-400 block mb-2">Exercise</label>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg p-3 text-lg"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          {/* Last time reference */}
          <div className="bg-zinc-800/50 rounded-lg p-3 text-sm">
            <span className="text-zinc-500">Last time:</span>{' '}
            <span className="text-zinc-300">{lastReference}</span>
          </div>

          {/* Input grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900 rounded-xl p-4 text-center">
              <label className="text-xs text-zinc-400 block mb-2">Sets</label>
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(Number(e.target.value))}
                className="w-full bg-transparent text-3xl font-bold text-center"
              />
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 text-center">
              <label className="text-xs text-zinc-400 block mb-2">Reps</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(Number(e.target.value))}
                className="w-full bg-transparent text-3xl font-bold text-center"
              />
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 text-center">
              <label className="text-xs text-zinc-400 block mb-2">Weight</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-transparent text-3xl font-bold text-center"
              />
            </div>
          </div>

          {/* Volume display */}
          <div className="bg-zinc-900 rounded-xl p-4 text-center">
            <span className="text-zinc-400 text-sm">Volume</span>
            <p className="text-2xl font-bold text-emerald-400">
              {volume.toLocaleString()} lbs
            </p>
          </div>

          {/* Logged sets */}
          {loggedSets.length > 0 && (
            <div className="bg-zinc-900 rounded-xl p-4">
              <h3 className="text-sm text-zinc-400 mb-2">Logged</h3>
              <div className="space-y-1 text-sm">
                {loggedSets.map((s, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{s.exercise}</span>
                    <span className="text-emerald-400">
                      {s.sets}×{s.reps} @ {s.weight} lbs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <button
            onClick={handleLogSet}
            disabled={isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl p-4 text-lg font-semibold transition-colors"
          >
            {isPending ? 'Logging...' : 'Log Set'}
          </button>

          <button
            onClick={handleEndWorkout}
            disabled={isPending}
            className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded-xl p-4 text-lg font-semibold transition-colors"
          >
            End Workout
          </button>
        </>
      )}
    </section>
  )
}
