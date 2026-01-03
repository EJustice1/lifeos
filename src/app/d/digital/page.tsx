import { getDigitalStats, getWeeklyScreenTime, getTopApps } from '@/lib/actions/digital'

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default async function DigitalWellbeingPage() {
  const [stats, weeklyData, topApps] = await Promise.all([
    getDigitalStats(7),
    getWeeklyScreenTime(),
    getTopApps(7, 10),
  ])

  const productiveApps = topApps.filter(a => a.category === 'productive')
  const distractedApps = topApps.filter(a => a.category === 'distracted')

  // Calculate platform split
  const totalPlatform = (stats?.mobileMinutes ?? 0) + (stats?.desktopMinutes ?? 0)
  const desktopPercent = totalPlatform > 0 ? Math.round((stats?.desktopMinutes ?? 0) / totalPlatform * 100) : 50
  const mobilePercent = 100 - desktopPercent

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Digital Wellbeing</h1>
        <p className="text-zinc-400">Conscious technology usage</p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Total This Week</p>
          <p className="text-3xl font-bold text-white">
            {stats ? formatMinutes(stats.totalMinutes) : '—'}
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Productive</p>
          <p className="text-3xl font-bold text-emerald-400">
            {stats ? formatMinutes(stats.productiveMinutes) : '—'}
          </p>
          <p className="text-sm text-zinc-500 mt-1">{stats?.productivityRate ?? 0}%</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Distracted</p>
          <p className="text-3xl font-bold text-red-400">
            {stats ? formatMinutes(stats.distractedMinutes) : '—'}
          </p>
          <p className="text-sm text-zinc-500 mt-1">{100 - (stats?.productivityRate ?? 0)}%</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Daily Average</p>
          <p className="text-3xl font-bold text-purple-400">
            {stats ? formatMinutes(stats.avgDailyTotal) : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Daily breakdown */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">This Week</h2>
          {weeklyData.length > 0 ? (
            <div className="space-y-3">
              {weeklyData.map((day) => {
                const total = day.productive_minutes + day.distracted_minutes
                const productivePercent = total > 0 ? Math.round((day.productive_minutes / total) * 100) : 0
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-zinc-500">{day.date}</span>
                    <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${productivePercent}%` }}
                      />
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${100 - productivePercent}%` }}
                      />
                    </div>
                    <span className="text-sm w-10 text-right">{productivePercent}%</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-500">
              No screen time data yet
            </div>
          )}
        </div>

        {/* Platform breakdown */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Platform Split</h2>
          {totalPlatform > 0 ? (
            <>
              <div className="flex gap-8 mb-6">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full border-8 border-blue-500 flex items-center justify-center mb-2">
                    <span className="text-xl font-bold">{desktopPercent}%</span>
                  </div>
                  <p className="text-sm text-zinc-400">Desktop</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full border-8 border-purple-500 flex items-center justify-center mb-2">
                    <span className="text-xl font-bold">{mobilePercent}%</span>
                  </div>
                  <p className="text-sm text-zinc-400">Mobile</p>
                </div>
              </div>
              <p className="text-sm text-zinc-500">
                Desktop: {formatMinutes(stats?.desktopMinutes ?? 0)} • Mobile: {formatMinutes(stats?.mobileMinutes ?? 0)}
              </p>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-500">
              No platform data yet
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Top Apps</h2>
        {topApps.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-emerald-400 mb-3">Productive</h3>
              <div className="space-y-2">
                {productiveApps.length > 0 ? productiveApps.map((app) => (
                  <div key={app.name} className="flex items-center gap-3 py-2">
                    <span className="flex-1">{app.name}</span>
                    <span className="text-emerald-400">{formatMinutes(app.minutes)}</span>
                  </div>
                )) : (
                  <p className="text-zinc-500 text-sm">No productive apps logged</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-red-400 mb-3">Distracted</h3>
              <div className="space-y-2">
                {distractedApps.length > 0 ? distractedApps.map((app) => (
                  <div key={app.name} className="flex items-center gap-3 py-2">
                    <span className="flex-1">{app.name}</span>
                    <span className="text-red-400">{formatMinutes(app.minutes)}</span>
                  </div>
                )) : (
                  <p className="text-zinc-500 text-sm">No distracted apps logged</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500">
            No app usage data yet
          </div>
        )}
      </div>

      {/* Sync status */}
      <div className="bg-zinc-800/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-zinc-500 rounded-full" />
          <span className="text-sm text-zinc-400">Manual tracking mode</span>
        </div>
        <span className="text-xs text-zinc-500">
          {stats?.daysTracked ?? 0} days tracked this week
        </span>
      </div>
    </div>
  )
}
