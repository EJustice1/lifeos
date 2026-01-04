import {
  getGymStats,
  getRecentWorkoutsWithDetails,
  getPersonalRecords,
  getMuscleGroupStats,
} from '@/lib/actions/gym'
import { calculate1RM, MUSCLE_GROUPS } from '@/lib/gym-utils'

export default async function GymAnalyticsPage() {
  const [gymStats, recentWorkouts, personalRecords, muscleStats] = await Promise.all([
    getGymStats(),
    getRecentWorkoutsWithDetails(10),
    getPersonalRecords(),
    getMuscleGroupStats(),
  ])

  // Group PRs by exercise (get best for each) and calculate 1RM
  type PR = typeof personalRecords[0]
  const prsByExercise = personalRecords.reduce<Record<string, PR & { estimated1RM: number }>>((acc, pr) => {
    const exercise = pr.exercise as { name: string } | { name: string }[] | null
    const name = Array.isArray(exercise) ? exercise[0]?.name : exercise?.name ?? 'Unknown'
    const estimated1RM = calculate1RM(pr.weight, pr.reps)

    if (!acc[name] || estimated1RM > acc[name].estimated1RM) {
      acc[name] = { ...pr, estimated1RM }
    }
    return acc
  }, {})

  const topPRs = Object.values(prsByExercise).slice(0, 8)

  // Calculate radar chart polygon points
  const muscleGroupValues = muscleStats
    ? MUSCLE_GROUPS.map(mg => muscleStats[mg]?.score ?? 0)
    : MUSCLE_GROUPS.map(() => 0)

  const numPoints = MUSCLE_GROUPS.length
  const radarPolygonPoints = muscleGroupValues.map((value, i) => {
    const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2
    const radius = (value / 100) * 40
    const x = 50 + radius * Math.cos(angle)
    const y = 50 + radius * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')

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
          <p className="text-zinc-400 text-sm">PRs Tracked</p>
          <p className="text-3xl font-bold text-orange-400">
            {personalRecords.length}
          </p>
        </div>
      </div>

      {/* Exercise Library Summary */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Exercise Library</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm text-zinc-400 mb-2">By Category</h3>
            <div className="space-y-2">
              {['push', 'pull', 'legs', 'core', 'cardio', 'other'].map(category => {
                const count = personalRecords.filter(pr => {
                  const exercise = pr.exercise as { category?: string } | { category?: string }[] | null
                  const cat = Array.isArray(exercise) ? exercise[0]?.category : exercise?.category
                  return cat === category
                }).length
                return count > 0 ? (
                  <div key={category} className="flex items-center justify-between">
                    <span className="capitalize text-sm">{category}</span>
                    <span className="bg-orange-600 px-2 py-1 rounded text-xs font-medium">{count}</span>
                  </div>
                ) : null
              })}
            </div>
          </div>
          <div>
            <h3 className="text-sm text-zinc-400 mb-2">By Muscle Group</h3>
            <div className="space-y-2">
              {MUSCLE_GROUPS.map(mg => {
                const count = personalRecords.filter(pr => {
                  const exercise = pr.exercise as { primary_muscles?: string[]; secondary_muscles?: string[] } | { primary_muscles?: string[]; secondary_muscles?: string[] }[] | null
                  const primaryMuscles = Array.isArray(exercise) ? exercise[0]?.primary_muscles : exercise?.primary_muscles
                  const secondaryMuscles = Array.isArray(exercise) ? exercise[0]?.secondary_muscles : exercise?.secondary_muscles
                  return primaryMuscles?.includes(mg) || secondaryMuscles?.includes(mg)
                }).length
                return count > 0 ? (
                  <div key={mg} className="flex items-center justify-between">
                    <span className="capitalize text-sm">{mg}</span>
                    <span className="bg-purple-600 px-2 py-1 rounded text-xs font-medium">{count}</span>
                  </div>
                ) : null
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Muscle Group Radar Chart */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Muscle Group Balance</h2>
          {!muscleStats ? (
            <div className="text-center py-8 text-zinc-500">
              <p>Log some PRs to see your muscle balance!</p>
            </div>
          ) : (
            <div className="relative">
              <svg viewBox="0 0 100 100" className="w-full max-w-xs mx-auto">
                {/* Background circles */}
                {[1, 2, 3, 4].map(i => (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r={i * 10}
                    fill="none"
                    stroke="#3f3f46"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Axis lines and labels */}
                {MUSCLE_GROUPS.map((mg, i) => {
                  const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2
                  const x2 = 50 + 45 * Math.cos(angle)
                  const y2 = 50 + 45 * Math.sin(angle)
                  const labelX = 50 + 48 * Math.cos(angle)
                  const labelY = 50 + 48 * Math.sin(angle)

                  return (
                    <g key={mg}>
                      <line
                        x1="50"
                        y1="50"
                        x2={x2}
                        y2={y2}
                        stroke="#3f3f46"
                        strokeWidth="0.5"
                      />
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-zinc-500 text-[3px] capitalize"
                      >
                        {mg}
                      </text>
                    </g>
                  )
                })}

                {/* Data polygon */}
                <polygon
                  points={radarPolygonPoints}
                  fill="rgba(249, 115, 22, 0.3)"
                  stroke="#f97316"
                  strokeWidth="1"
                />

                {/* Data points */}
                {muscleGroupValues.map((value, i) => {
                  const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2
                  const radius = (value / 100) * 40
                  const x = 50 + radius * Math.cos(angle)
                  const y = 50 + radius * Math.sin(angle)
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="1.5"
                      fill="#f97316"
                    />
                  )
                })}
              </svg>

              {/* Muscle group stats grid */}
              <div className="grid grid-cols-5 gap-2 mt-4 text-xs">
                {MUSCLE_GROUPS.map(mg => {
                  const stats = muscleStats[mg]
                  return (
                    <div key={mg} className="text-center">
                      <p className="text-zinc-500 capitalize truncate">{mg}</p>
                      <p className="font-bold text-orange-400">{stats?.score ?? 0}%</p>
                      {stats?.avg1RM > 0 && (
                        <p className="text-zinc-600 text-[10px]">{stats.avg1RM}lb</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* PR Tracker */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Personal Records (Est. 1RM)</h2>
          {topPRs.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {topPRs.map((pr) => {
                const exercise = pr.exercise as { name: string; primary_muscles?: string[]; secondary_muscles?: string[]; is_compound?: boolean } | { name: string; primary_muscles?: string[]; secondary_muscles?: string[]; is_compound?: boolean }[] | null
                const name = Array.isArray(exercise) ? exercise[0]?.name : exercise?.name ?? 'Unknown'
                const muscleGroups = Array.isArray(exercise) ? [...(exercise[0]?.primary_muscles ?? []), ...(exercise[0]?.secondary_muscles ?? [])] : [...(exercise?.primary_muscles ?? []), ...(exercise?.secondary_muscles ?? [])]
                const isCompound = Array.isArray(exercise) ? exercise[0]?.is_compound ?? false : exercise?.is_compound ?? false
                return (
                  <div key={pr.id} className="bg-zinc-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-zinc-400 truncate">{name}</p>
                      {isCompound && <span className="text-xs bg-emerald-600 px-1 rounded">🏋️</span>}
                    </div>
                    <p className="text-xl font-bold text-orange-400 mt-1">
                      {pr.estimated1RM} lbs
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {pr.reps}×{pr.weight} • {pr.date}
                    </p>
                    {muscleGroups.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {muscleGroups.slice(0, 2).map((mg: string) => (
                          <span key={mg} className="px-1 py-0.5 bg-purple-900/30 text-purple-400 text-[10px] rounded capitalize">
                            {mg}
                          </span>
                        ))}
                        {muscleGroups.length > 2 && (
                          <span className="px-1 py-0.5 bg-purple-900/30 text-purple-400 text-[10px] rounded">
                            +{muscleGroups.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-500">
              No personal records yet. Start logging your lifts!
            </div>
          )}
        </div>
      </div>

      {/* Recent workouts with detailed sets */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Recent Workouts</h2>
        {recentWorkouts.length > 0 ? (
          <div className="space-y-4">
            {recentWorkouts.map((workout) => {
              // Group lifts by exercise
              const lifts = workout.lifts ?? []
              const exerciseGroups = lifts.reduce((acc: Record<string, { sets: Array<{ reps: number; weight: number }>; muscleGroups: string[] }>, lift: { exercise: { name?: string; primary_muscles?: string[]; secondary_muscles?: string[] }; reps: number; weight: number }) => {
                const exercise = lift.exercise
                const name = exercise?.name ?? 'Unknown'
                if (!acc[name]) {
                  acc[name] = {
                    sets: [],
                    muscleGroups: [...(exercise?.primary_muscles ?? []), ...(exercise?.secondary_muscles ?? [])]
                  }
                }
                acc[name].sets.push({ reps: lift.reps, weight: lift.weight })
                return acc
              }, {} as Record<string, { sets: Array<{ reps: number; weight: number }>; muscleGroups: string[] }>)

              return (
                <div key={workout.id} className="border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400">{workout.date}</span>
                      <span className="bg-orange-600 px-2 py-1 rounded text-sm font-medium">
                        {workout.type ?? 'Workout'}
                      </span>
                    </div>
                    <span className="text-orange-400 font-bold">
                      {workout.total_volume?.toLocaleString() ?? 0} lbs
                    </span>
                  </div>

                  {/* Exercise breakdown */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(exerciseGroups as Record<string, { sets: Array<{ reps: number; weight: number }>; muscleGroups: string[] }>).map(([exerciseName, data]) => {
                      const bestSet = data.sets.reduce((best, set) =>
                        set.weight > best.weight ? set : best
                      , data.sets[0])
                      const totalVolume = data.sets.reduce((sum, set) => sum + set.reps * set.weight, 0)

                      return (
                        <div key={exerciseName} className="bg-zinc-800/50 rounded-lg p-2">
                          <p className="text-sm font-medium truncate">{exerciseName}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-zinc-500">
                              {data.sets.length} sets • Best: {bestSet.reps}×{bestSet.weight}
                            </span>
                            <span className="text-xs text-emerald-400 font-medium">
                              {totalVolume.toLocaleString()} lbs
                            </span>
                          </div>
                          {data.muscleGroups.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {data.muscleGroups.slice(0, 3).map((mg: string) => (
                                <span key={mg} className="px-1 py-0.5 bg-purple-900/30 text-purple-400 text-[10px] rounded capitalize">
                                  {mg}
                                </span>
                              ))}
                              {data.muscleGroups.length > 3 && (
                                <span className="px-1 py-0.5 bg-purple-900/30 text-purple-400 text-[10px] rounded">
                                  +{data.muscleGroups.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
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
