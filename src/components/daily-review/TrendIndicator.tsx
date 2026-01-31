'use client'

interface TrendIndicatorProps {
  current: number
  average: number
  format?: 'number' | 'minutes' | 'hours'
  higherIsBetter?: boolean
}

export function TrendIndicator({ 
  current, 
  average, 
  format = 'number',
  higherIsBetter = true 
}: TrendIndicatorProps) {
  // Calculate percentage change
  const percentChange = average > 0 ? ((current - average) / average) * 100 : 0
  const isPositive = percentChange > 0
  
  // Determine if this is actually good based on higherIsBetter
  const isGood = higherIsBetter ? isPositive : !isPositive
  
  // Format the value based on type
  const formatValue = (value: number) => {
    if (format === 'minutes') {
      const hours = Math.floor(value / 60)
      const mins = value % 60
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }
    if (format === 'hours') {
      return `${Math.round(value / 60)}h`
    }
    return Math.round(value * 10) / 10 // Round to 1 decimal
  }

  // Don't show trend if change is negligible (<5%)
  if (Math.abs(percentChange) < 5) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-500 text-label-xs">
          {formatValue(average)} avg
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Arrow indicator */}
      <div className={`flex items-center ${isGood ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        <span className="text-label-xs font-semibold ml-0.5">
          {Math.abs(Math.round(percentChange))}%
        </span>
      </div>
      
      {/* Average label */}
      <span className="text-zinc-500 text-label-xs">
        vs {formatValue(average)} avg
      </span>
    </div>
  )
}
