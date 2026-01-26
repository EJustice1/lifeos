interface DataGridMetric {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  color?: 'emerald' | 'blue' | 'purple' | 'yellow' | 'red' | 'default'
}

interface DataGridProps {
  metrics: DataGridMetric[]
  columns?: 1 | 2 | 3 | 4
  layout?: 'balanced' | 'emphasized'
  className?: string
}

/**
 * DataGrid - Asymmetric metric display
 *
 * Replaces card-based dashboard stats with clean metric grids.
 * Supports emphasized layout where first item is larger.
 */
export function DataGrid({
  metrics,
  columns = 3,
  layout = 'balanced',
  className = ''
}: DataGridProps) {
  const colorClasses = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    default: 'text-white',
  }

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  }

  const gridColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }

  if (layout === 'emphasized' && metrics.length > 0) {
    const [emphasized, ...rest] = metrics

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Emphasized first metric */}
        <div className="border-b border-zinc-800 pb-4">
          <div className="text-label-md uppercase tracking-wide text-zinc-500 font-semibold">
            {emphasized.label}
          </div>
          <div className={`text-display-md font-bold mt-2 ${colorClasses[emphasized.color || 'default']}`}>
            {emphasized.value}
            {emphasized.trend && (
              <span className="text-title-lg ml-2 opacity-60">
                {trendIcons[emphasized.trend]}
              </span>
            )}
          </div>
        </div>

        {/* Rest of metrics */}
        {rest.length > 0 && (
          <div className={`grid ${gridColumns[columns]} gap-6`}>
            {rest.map((metric, index) => (
              <div key={index}>
                <div className="text-label-sm uppercase tracking-wide text-zinc-500">
                  {metric.label}
                </div>
                <div className={`text-title-lg font-semibold mt-1 ${colorClasses[metric.color || 'default']}`}>
                  {metric.value}
                  {metric.trend && (
                    <span className="text-body-sm ml-1 opacity-60">
                      {trendIcons[metric.trend]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`grid ${gridColumns[columns]} gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <div key={index}>
          <div className="text-label-sm uppercase tracking-wide text-zinc-500">
            {metric.label}
          </div>
          <div className={`text-title-lg font-semibold mt-1 ${colorClasses[metric.color || 'default']}`}>
            {metric.value}
            {metric.trend && (
              <span className="text-body-sm ml-1 opacity-60">
                {trendIcons[metric.trend]}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
