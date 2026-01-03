export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-zinc-400">Cross-domain insights and correlations</p>
      </header>

      {/* Spike chart */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">The Spike Chart</h2>
        <p className="text-sm text-zinc-500 mb-4">Overlaying performance across domains</p>
        <div className="h-64 relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-zinc-500">
            <span>High</span>
            <span>Med</span>
            <span>Low</span>
          </div>
          {/* Chart area */}
          <div className="ml-12 h-56 border-l border-b border-zinc-700 relative">
            {/* Placeholder lines */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Gym line */}
              <polyline
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                points="0,60 10,55 20,40 30,45 40,35 50,30 60,25 70,30 80,20 90,25 100,15"
              />
              {/* Study line */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points="0,70 10,65 20,60 30,50 40,55 50,45 60,40 70,35 80,40 90,30 100,25"
              />
              {/* Mood line */}
              <polyline
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                points="0,50 10,55 20,45 30,40 40,50 50,35 60,30 70,35 80,25 90,30 100,20"
              />
            </svg>
          </div>
        </div>
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
            {/* Radar placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full border-2 border-zinc-700 rounded-full" />
              <div className="absolute w-3/4 h-3/4 border-2 border-zinc-700 rounded-full" />
              <div className="absolute w-1/2 h-1/2 border-2 border-zinc-700 rounded-full" />
              <div className="absolute w-1/4 h-1/4 border-2 border-zinc-700 rounded-full" />
            </div>
            {/* Labels */}
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-xs">Finance</span>
            <span className="absolute top-1/4 right-0 translate-x-2 text-xs">Gym</span>
            <span className="absolute bottom-1/4 right-0 translate-x-2 text-xs">Career</span>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-xs">Digital</span>
            <span className="absolute bottom-1/4 left-0 -translate-x-2 text-xs">Social</span>
            <span className="absolute top-1/4 left-0 -translate-x-2 text-xs">Health</span>
          </div>
        </div>

        {/* Correlation insights */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Correlation Insights</h2>
          <div className="space-y-4">
            {[
              {
                insight: 'High phone usage correlates with lower study hours',
                strength: 'Strong',
                correlation: -0.72,
              },
              {
                insight: 'Gym days correlate with higher mood scores',
                strength: 'Moderate',
                correlation: 0.58,
              },
              {
                insight: 'Good sleep correlates with productive screen time',
                strength: 'Moderate',
                correlation: 0.51,
              },
              {
                insight: 'Study hours correlate with perceived success',
                strength: 'Strong',
                correlation: 0.68,
              },
            ].map((item, i) => (
              <div key={i} className="bg-zinc-800 rounded-lg p-4">
                <p className="text-sm mb-2">{item.insight}</p>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      item.strength === 'Strong'
                        ? 'bg-purple-900 text-purple-400'
                        : 'bg-blue-900 text-blue-400'
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
        </div>
      </div>

      {/* Growth trends */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Long-term Growth Trends</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm text-zinc-400 mb-3">Net Worth (12 months)</h3>
            <div className="h-32 flex items-end gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-emerald-500 rounded-t"
                  style={{ height: `${30 + i * 5}%` }}
                />
              ))}
            </div>
            <p className="text-emerald-400 text-lg font-bold mt-2">+47% YoY</p>
          </div>
          <div>
            <h3 className="text-sm text-zinc-400 mb-3">Strength (Big 3 Total)</h3>
            <div className="h-32 flex items-end gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-orange-500 rounded-t"
                  style={{ height: `${40 + i * 4}%` }}
                />
              ))}
            </div>
            <p className="text-orange-400 text-lg font-bold mt-2">+85 lbs YoY</p>
          </div>
        </div>
      </div>
    </div>
  )
}
