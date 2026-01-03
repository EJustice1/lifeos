import { getExercises, getRecentWorkouts } from '@/lib/actions/gym'
import { GymLogger } from './gym-logger'

export default async function GymPage() {
  const [exercises, recentWorkouts] = await Promise.all([
    getExercises(),
    getRecentWorkouts(5),
  ])

  const lastWorkout = recentWorkouts[0]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Workout Logger</h1>
        <p className="text-zinc-400 text-sm">Log sets, reps, and weight</p>
      </header>

      <GymLogger exercises={exercises} lastWorkout={lastWorkout} />
    </div>
  )
}
