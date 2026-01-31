'use client'

import { TrendIndicator } from './TrendIndicator'
import { MiniSparkline } from './MiniSparkline'

interface MetricCardProps {
  title: string
  value: string | number
  current: number
  average: number
  trendData?: number[]
  format?: 'number' | 'minutes' | 'hours'
  higherIsBetter?: boolean
  color?: string
  warning?: boolean
  warningMessage?: string
}

export function MetricCard({
  title,
  value,
  current,
  average,
  trendData = [],
  format = 'number',
  higherIsBetter = true,
  color = 'rgb(168, 85, 247)', // Purple
  warning = false,
  warningMessage,
}: MetricCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
      {/* Top row: Title + Value + Trend */}
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-2 flex-1 min-w-0">
          <h3 className="text-label-sm text-zinc-400 uppercase tracking-wide">
            {title}:
          </h3>
          <div className="text-title-lg font-bold text-white">
            {value}
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <TrendIndicator 
            current={current}
            average={average}
            format={format}
            higherIsBetter={higherIsBetter}
          />
        </div>
      </div>
      
      {/* Sparkline below - full width */}
      {trendData && trendData.length > 0 && (
        <div className="mb-2">
          <MiniSparkline data={trendData} color={color} height={24} />
        </div>
      )}
      
      {/* Warning badge if applicable */}
      {warning && warningMessage && (
        <div className="flex items-center gap-1 text-orange-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-label-xs font-medium">{warningMessage}</span>
        </div>
      )}
    </div>
  )
}
