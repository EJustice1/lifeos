'use client'

import { useState } from 'react'
import { MobileCard } from '@/components/mobile/cards/MobileCard'

interface ExecutionData {
  date: string
  execution_score: number
}

interface ExecutionChartProps {
  data: ExecutionData[]
}

export function ExecutionChart({ data }: ExecutionChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)

  if (data.length === 0) {
    return null
  }

  // Get last 7 days (including today)
  const today = new Date()
  const last7Days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    last7Days.push(date.toISOString().split('T')[0])
  }

  // Map data to 7 day slots (null if no data for that day)
  const chartData = last7Days.map(dateStr => {
    const entry = data.find(d => d.date === dateStr)
    return {
      date: dateStr,
      score: entry?.execution_score || null,
    }
  })

  // Calculate positions for points (fixed 0-100 scale)
  type Point = { x: number; y: number; score: number; date: string; index: number }
  
  const points: Point[] = chartData
    .map((item, index) => {
      if (item.score === null) return null
      
      const x = (index / (chartData.length - 1)) * 100
      const y = 100 - item.score // Fixed 0-100 scale, no normalization
      
      return { x, y, score: item.score, date: item.date, index }
    })
    .filter((p): p is Point => p !== null)

  // Generate separate paths for solid and dashed lines
  const solidPaths: string[] = []
  const dashedPaths: string[] = []
  
  for (let i = 0; i < points.length - 1; i++) {
    const point1 = points[i]
    const point2 = points[i + 1]
    
    const index1 = chartData.findIndex(d => d.date === point1.date)
    const index2 = chartData.findIndex(d => d.date === point2.date)
    const hasGap = index2 - index1 > 1
    
    const pathSegment = `M ${point1.x} ${point1.y} L ${point2.x} ${point2.y}`
    
    if (hasGap) {
      dashedPaths.push(pathSegment)
    } else {
      solidPaths.push(pathSegment)
    }
  }

  return (
    <MobileCard title="Weekly Execution Trend">
      <div className="flex gap-4">
        {/* Y-axis scale (left side) */}
        <div className="flex flex-col justify-between text-xs text-zinc-600" style={{ height: '140px', paddingTop: '4px', paddingBottom: '4px' }}>
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="flex-1 space-y-3">
          {/* Chart */}
          <div className="relative" style={{ height: '140px' }}>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
            >
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((value) => (
                <line
                  key={value}
                  x1="0"
                  y1={100 - value}
                  x2="100"
                  y2={100 - value}
                  stroke="#3f3f46"
                  strokeWidth="0.3"
                  opacity="0.2"
                />
              ))}
              
              {/* Solid line segments (consecutive days) */}
              {solidPaths.map((path, index) => (
                <path
                  key={`solid-${index}`}
                  d={path}
                  fill="none"
                  stroke="#71717a"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              
              {/* Dashed line segments (gaps) */}
              {dashedPaths.map((path, index) => (
                <path
                  key={`dashed-${index}`}
                  d={path}
                  fill="none"
                  stroke="#71717a"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.5"
                />
              ))}
              
              {/* Data points */}
              {points.map((point) => (
                <g key={point.index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill={hoveredPoint === point.index ? "#a1a1aa" : "#71717a"}
                    stroke="#18181b"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint(point.index)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => setHoveredPoint(point.index === hoveredPoint ? null : point.index)}
                  />
                  {/* Score label on hover/click */}
                  {hoveredPoint === point.index && (
                    <text
                      x={point.x}
                      y={point.y - 8}
                      textAnchor="middle"
                      fill="#a1a1aa"
                      fontSize="6"
                      fontWeight="bold"
                    >
                      {point.score}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* Date labels */}
          <div className="flex justify-between text-xs text-zinc-600">
            {chartData.map((item, index) => (
              <div key={index} className="text-center" style={{ width: `${100 / chartData.length}%` }}>
                {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileCard>
  )
}
