import {
  getSpikeChartData,
  getLifeBalanceData,
  getDetailedCorrelations,
  getGrowthTrends,
} from '@/lib/actions/analytics'

export default async function AnalyticsPage() {
  const [spikeData, lifeBalance, correlations, growthTrends] = await Promise.all([
    getSpikeChartData(30),
    getLifeBalanceData(),
    getDetailedCorrelations(),
    getGrowthTrends(12),
  ])

  // Generate SVG points for spike chart lines
  const generatePoints = (
    data: typeof spikeData,
    getValue: (d: (typeof spikeData)[0]) => number | null
  ) => {
    const validData = data.filter(d => getValue(d) !== null)
    if (validData.length === 0) return ''

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100
      const value = getValue(d)
      // Invert Y because SVG origin is top-left
      const y = value !== null ? 100 - value : null
      return y !== null ? `${x},${y}` : null
    }).filter(Boolean)

    return points.join(' ')
  }

  const gymPoints = generatePoints(spikeData, d => d.gymNormalized > 0 ? d.gymNormalized : null)
  const studyPoints = generatePoints(spikeData, d => d.studyNormalized > 0 ? d.studyNormalized : null)
  const moodPoints = generatePoints(spikeData, d => d.moodNormalized)

  // Radar chart calculations
  const radarLabels = ['Finance', 'Gym', 'Career', 'Digital', 'Social', 'Health']
  const radarValues = lifeBalance
    ? [lifeBalance.finance, lifeBalance.gym, lifeBalance.career, lifeBalance.digital, lifeBalance.social, lifeBalance.health]
    : [50, 50, 50, 50, 50, 50]

  // Calculate radar polygon points (hexagon)
  const radarPolygonPoints = radarValues.map((value, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2 // Start from top
    const radius = (value / 100) * 45 // Max radius of 45 (out of 50)
    const x = 50 + radius * Math.cos(angle)
    const y = 50 + radius * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')

  // Net worth chart heights
  const maxNetWorth = Math.max(...(growthTrends?.netWorth.data.map(d => d.value) ?? [1]), 1)
  const netWorthHeights = growthTrends?.netWorth.data.map(d =>
    d.value > 0 ? Math.max(5, (d.value / maxNetWorth) * 100) : 0
  ) ?? []

  // Strength chart heights
  const maxStrength = Math.max(...(growthTrends?.strength.data.map(d => d.total) ?? [1]), 1)
  const strengthHeights = growthTrends?.strength.data.map(d =>
    d.total > 0 ? Math.max(5, (d.total / maxStrength) * 100) : 0
  ) ?? []

  const hasData = spikeData.some(d => d.gymVolume > 0 || d.studyMinutes > 0 || d.mood !== null)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-zinc-400">Cross-domain insights and correlations</p>
      </header>

      {/* Spike chart */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">The Spike Chart</h2>
        <p className="text-sm text-zinc-500 mb-4">Overlaying performance across domains (last 30 days)</p>

        {!hasData ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">
            <p>Log some workouts, study sessions, or daily reviews to see your trends!</p>
          </div>
        ) : (
          <div className="h-64 relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-zinc-500">
              <span>High</span>
              <span>Med</span>
              <span>Low</span>
            </div>
            {/* Chart area */}
            <div className="ml-12 h-56 border-l border-b border-zinc-700 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Gym line */}
                {gymPoints && (
                  <polyline
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                    points={gymPoints}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {/* Study line */}
                {studyPoints && (
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    points={studyPoints}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {/* Mood line */}
                {moodPoints && (
                  <polyline
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    points={moodPoints}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>
            </div>
            {/* X-axis labels */}
            <div className="ml-12 flex justify-between text-xs text-zinc-500 mt-1">
              <span>30d ago</span>
              <span>Today</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            <span className="text-sm">Gym Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-sm">Study Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span className="text-sm">Mood</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Life balance radar */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Life Balance</h2>
          <div className="aspect-square max-w-xs mx-auto relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Background circles */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="#3f3f46" strokeWidth="1" />
              <circle cx="50" cy="50" r="33.75" fill="none" stroke="#3f3f46" strokeWidth="1" />
              <circle cx="50" cy="50" r="22.5" fill="none" stroke="#3f3f46" strokeWidth="1" />
              <circle cx="50" cy="50" r="11.25" fill="none" stroke="#3f3f46" strokeWidth="1" />

              {/* Axis lines */}
              {[0, 1, 2, 3, 4, 5].map(i => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
                const x2 = 50 + 45 * Math.cos(angle)
                const y2 = 50 + 45 * Math.sin(angle)
                return (
                  <line
                    key={i}
                    x1="50"
                    y1="50"
                    x2={x2}
                    y2={y2}
                    stroke="#3f3f46"
                    strokeWidth="1"
                  />
                )
              })}

              {/* Data polygon */}
              {lifeBalance && (
                <polygon
                  points={radarPolygonPoints}
                  fill="rgba(139, 92, 246, 0.3)"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
              )}

              {/* Data points */}
              {lifeBalance && radarValues.map((value, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
                const radius = (value / 100) * 45
                const x = 50 + radius * Math.cos(angle)
                const y = 50 + radius * Math.sin(angle)
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#8b5cf6"
                  />
                )
              })}

              {/* Labels */}
              {radarLabels.map((label, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
                const x = 50 + 52 * Math.cos(angle)
                const y = 50 + 52 * Math.sin(angle)
                return (
                  <text
                    key={label}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-zinc-400 text-[4px]"
                  >
                    {label}
                  </text>
                )
              })}
            </svg>

            {/* Score display */}
            {lifeBalance && (
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                {radarLabels.map((label, i) => (
                  <div key={label} className="text-center">
                    <span className="text-zinc-500">{label}</span>
                    <p className="font-mono text-purple-400">{radarValues[i]}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Correlation insights */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Correlation Insights</h2>
          {correlations.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <p>Not enough data yet to calculate correlations.</p>
              <p className="text-sm mt-2">Keep logging daily reviews, workouts, and study sessions!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {correlations.map((item, i) => (
                <div key={i} className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-sm mb-2">{item.insight}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.strength === 'Strong'
                          ? 'bg-purple-900 text-purple-400'
                          : item.strength === 'Moderate'
                          ? 'bg-blue-900 text-blue-400'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {item.strength}
                    </span>
                    <span
                      className={`text-sm font-mono ${
                        item.correlation > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {item.correlation > 0 ? '+' : ''}
                      {item.correlation.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Growth trends */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Long-term Growth Trends</h2>
        <div className="grid grid-cols-2 gap-8">
          {/* Net Worth */}
          <div>
            <h3 className="text-sm text-zinc-400 mb-3">Net Worth (12 months)</h3>
            {growthTrends?.netWorth.current === 0 ? (
              <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">
                Add accounts to track net worth
              </div>
            ) : (
              <>
                <div className="h-32 flex items-end gap-1">
                  {netWorthHeights.map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-emerald-500 rounded-t transition-all duration-300"
                      style={{ height: `${height}%` }}
                      title={growthTrends?.netWorth.data[i]?.month}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-zinc-500">
                    {growthTrends?.netWorth.data[0]?.month}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      (growthTrends?.netWorth.change ?? 0) >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {(growthTrends?.netWorth.change ?? 0) >= 0 ? '+' : ''}
                    {growthTrends?.netWorth.change}% YoY
                  </span>
                  <span className="text-xs text-zinc-500">
                    {growthTrends?.netWorth.data[growthTrends.netWorth.data.length - 1]?.month}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Strength */}
          <div>
            <h3 className="text-sm text-zinc-400 mb-3">Strength (All Lifts)</h3>
            {growthTrends?.strength.current === 0 ? (
              <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">
                Log PRs to track strength progress
              </div>
            ) : (
              <>
                <div className="h-32 flex items-end gap-1">
                  {strengthHeights.map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-orange-500 rounded-t transition-all duration-300"
                      style={{ height: `${height}%` }}
                      title={growthTrends?.strength.data[i]?.month}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-zinc-500">
                    {growthTrends?.strength.data[0]?.month}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      (growthTrends?.strength.change ?? 0) >= 0
                        ? 'text-orange-400'
                        : 'text-red-400'
                    }`}
                  >
                    {(growthTrends?.strength.change ?? 0) >= 0 ? '+' : ''}
                    {growthTrends?.strength.change} lbs YoY
                  </span>
                  <span className="text-xs text-zinc-500">
                    {growthTrends?.strength.data[growthTrends.strength.data.length - 1]?.month}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
