import { getGymStats, getRecentWorkouts, getPersonalRecords } from '@/lib/actions/gym'

export default async function GymAnalyticsPage() {
  const [gymStats, recentWorkouts, personalRecords] = await Promise.all([
    getGymStats(),
    getRecentWorkouts(10),
    getPersonalRecords(),
  ])

  // Group PRs by exercise (get best for each)
  const prsByExercise = personalRecords.reduce((acc, pr) => {
    const name = pr.exercise?.name ?? 'Unknown'
    if (!acc[name] || pr.weight > acc[name].weight) {
      acc[name] = pr
    }
    return acc
  }, {} as Record<string, typeof personalRecords[0]>)

  const topPRs = Object.values(prsByExercise).slice(0, 4)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Gym & Physical Health</h1>
        <p className="text-zinc-400">Consistency and progressive overload</p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">This Week</p>
          <p className="text-3xl font-bold text-white">
            {gymStats?.workoutsThisWeek ?? 0} workouts
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Weekly Volume</p>
          <p className="text-3xl font-bold text-emerald-400">
            {gymStats?.weeklyVolume?.toLocaleString() ?? 0} lbs
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">vs Last Week</p>
          <p className={`text-3xl font-bold ${(gymStats?.volumeChange ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {gymStats?.volumeChange ? `${gymStats.volumeChange > 0 ? '+' : ''}${gymStats.volumeChange}%` : '—'}
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Total Workouts</p>
          <p className="text-3xl font-bold text-orange-400">
            {recentWorkouts.length}
          </p>
        </div>
      </div>

      {/* PR Tracker */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Personal Records</h2>
        {topPRs.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {topPRs.map((pr) => (
              <div key={pr.id} className="bg-zinc-800 rounded-lg p-4 text-center">
                <p className="text-sm text-zinc-400">{pr.exercise?.name}</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">{pr.weight} lbs</p>
                <p className="text-xs text-zinc-500 mt-1">{pr.reps} reps • {pr.date}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500">
            No personal records yet. Start logging your lifts!
          </div>
        )}
      </div>

      {/* Recent workouts */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Recent Workouts</h2>
        {recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => {
              const exerciseNames = [...new Set(
                workout.workout_sets?.map(s => s.exercise?.name).filter(Boolean) ?? []
              )].slice(0, 3)

              return (
                <div key={workout.id} className="flex items-center gap-4 py-3 border-b border-zinc-800 last:border-0">
                  <span className="text-zinc-500 w-24">{workout.date}</span>
                  <span className="bg-orange-600 px-2 py-1 rounded text-sm">
                    {workout.type ?? 'Workout'}
                  </span>
                  <span className="flex-1 text-zinc-400 truncate">
                    {exerciseNames.length > 0 ? exerciseNames.join(', ') : `${workout.workout_sets?.length ?? 0} sets`}
                  </span>
                  <span className="text-orange-400 font-semibold">
                    {workout.total_volume?.toLocaleString() ?? 0} lbs
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500">
            No workouts logged yet. Head to the mobile gym page to start!
          </div>
        )}
      </div>
    </div>
  )
}
