import { getBuckets, getWeeklyStats, getStudyHeatmap } from '@/lib/actions/study'

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default async function CareerAnalyticsPage() {
  const [buckets, weeklyStats, heatmap] = await Promise.all([
    getBuckets(),
    getWeeklyStats(),
    getStudyHeatmap(13),
  ])

  // Create heatmap grid (91 days = 13 weeks)
  const heatmapByDate = new Map(heatmap.map(h => [h.date, h.level]))
  const today = new Date()
  const heatmapGrid = Array.from({ length: 91 }).map((_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (90 - i))
    const dateStr = date.toISOString().split('T')[0]
    return heatmapByDate.get(dateStr) ?? 0
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Career & Study</h1>
        <p className="text-zinc-400">Academic and professional progress</p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">This Week</p>
          <p className="text-3xl font-bold text-blue-400">
            {weeklyStats?.totalHours ?? 0}h
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Daily Average</p>
          <p className="text-3xl font-bold text-white">
            {weeklyStats ? formatMinutes(weeklyStats.dailyAverage) : '0m'}
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Active Buckets</p>
          <p className="text-3xl font-bold text-purple-400">{buckets.length}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Total Minutes</p>
          <p className="text-3xl font-bold text-emerald-400">
            {weeklyStats?.totalMinutes ?? 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Consistency heatmap */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Activity Heatmap</h2>
          <div className="grid grid-cols-7 gap-1">
            {heatmapGrid.map((level, i) => (
              <div
                key={i}
                className={`aspect-square rounded-sm ${
                  level >= 4 ? 'bg-blue-300' :
                  level === 3 ? 'bg-blue-400' :
                  level === 2 ? 'bg-blue-500' :
                  level === 1 ? 'bg-blue-700' :
                  'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-2">
            <span>13 weeks ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Time distribution */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Time by Bucket (This Week)</h2>
          {weeklyStats?.byBucket && Object.keys(weeklyStats.byBucket).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(weeklyStats.byBucket).map(([name, data]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{name}</span>
                    <span className="text-zinc-400">{formatMinutes(data.minutes)}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((data.minutes / weeklyStats.totalMinutes) * 100, 100)}%`,
                        backgroundColor: data.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-500">
              No sessions this week
            </div>
          )}
        </div>
      </div>

      {/* Active buckets */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Active Buckets</h2>
        </div>
        {buckets.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {buckets.map((bucket) => {
              const bucketStats = weeklyStats?.byBucket?.[bucket.name]
              return (
                <div key={bucket.id} className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{bucket.name}</p>
                      <p className="text-sm text-zinc-500 capitalize">{bucket.type}</p>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: bucket.color }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-blue-400 mt-3">
                    {bucketStats ? formatMinutes(bucketStats.minutes) : '0m'}
                  </p>
                  <p className="text-xs text-zinc-500">this week</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500">
            No buckets created yet. Add one to start tracking!
          </div>
        )}
      </div>
    </div>
  )
}
