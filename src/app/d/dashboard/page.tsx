import { getNetWorth } from '@/lib/actions/finance'
import { getGymStats, getRecentWorkouts } from '@/lib/actions/gym'
import { getWeeklyStats } from '@/lib/actions/study'
import { getDigitalStats } from '@/lib/actions/digital'
import { getRecentReviews } from '@/lib/actions/daily-review'

export default async function DashboardPage() {
  const [netWorth, gymStats, studyStats, digitalStats, recentReviews, recentWorkouts] = await Promise.all([
    getNetWorth(),
    getGymStats(),
    getWeeklyStats(),
    getDigitalStats(7),
    getRecentReviews(3),
    getRecentWorkouts(3),
  ])

  const formatCurrency = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Mission Control</h1>
        <p className="text-zinc-400">Your life at a glance</p>
      </header>

      {/* Quick stats grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Net Worth</p>
          <p className="text-2xl font-bold text-emerald-400">
            {netWorth ? formatCurrency(netWorth.total) : '—'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {netWorth ? `${Math.round((netWorth.investments / netWorth.total) * 100)}% invested` : 'No data'}
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Workouts This Week</p>
          <p className="text-2xl font-bold text-orange-400">
            {gymStats?.workoutsThisWeek ?? 0}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {gymStats?.volumeChange
              ? `${gymStats.volumeChange > 0 ? '+' : ''}${gymStats.volumeChange}% volume`
              : 'No previous data'}
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Study Hours</p>
          <p className="text-2xl font-bold text-blue-400">
            {studyStats?.totalHours ?? 0}h
          </p>
          <p className="text-xs text-zinc-500 mt-1">This week</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Productive Time</p>
          <p className="text-2xl font-bold text-purple-400">
            {digitalStats?.productivityRate ?? 0}%
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {digitalStats?.daysTracked ?? 0} days tracked
          </p>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Study by bucket */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Study This Week</h2>
          {studyStats?.byBucket && Object.keys(studyStats.byBucket).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(studyStats.byBucket).map(([name, data]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{name}</span>
                    <span className="text-zinc-400">
                      {Math.round(data.minutes / 60 * 10) / 10}h
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((data.minutes / studyStats.totalMinutes) * 100, 100)}%`,
                        backgroundColor: data.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-500">
              No study sessions this week
            </div>
          )}
        </div>

        {/* Recent mood scores */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Recent Reviews</h2>
          {recentReviews.length > 0 ? (
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-sm text-zinc-400">{review.date}</span>
                  <div className="flex gap-4">
                    <span className="text-emerald-400">😊 {review.mood}</span>
                    <span className="text-blue-400">⚡ {review.energy}</span>
                    <span className="text-purple-400">🎯 {review.perceived_success}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-500">
              No reviews yet
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Recent Workouts</h2>
        {recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="flex items-center gap-4 py-2 border-b border-zinc-800 last:border-0">
                <span className="text-xs text-zinc-500 w-20">{workout.date}</span>
                <span className="bg-orange-600 px-2 py-1 rounded text-xs">
                  {workout.type ?? 'Workout'}
                </span>
                <span className="text-zinc-400">
                  {workout.workout_sets?.length ?? 0} sets
                </span>
                <span className="text-orange-400 font-semibold ml-auto">
                  {workout.total_volume?.toLocaleString() ?? 0} lbs
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500">
            No workouts logged yet
          </div>
        )}
      </div>
    </div>
  )
}
