'use client'

import { useRef, useEffect, useState } from 'react'

interface DailyScore {
  date: string
  execution_score: number
}

interface CalendarHeatmapProps {
  data: DailyScore[]
}

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [weeksToShow, setWeeksToShow] = useState(52)

  useEffect(() => {
    const calculateWeeks = () => {
      if (!containerRef.current) return
      
      const containerWidth = containerRef.current.offsetWidth
      const dayLabelWidth = 20 // Width of S M T W T F S column
      const availableWidth = containerWidth - dayLabelWidth - 32 // padding
      
      // Tile size + gap: 12px + 2px = 14px per week
      const maxWeeks = Math.floor(availableWidth / 14)
      setWeeksToShow(Math.max(20, Math.min(maxWeeks, 52))) // Min 20, max 52 weeks
    }
    
    calculateWeeks()
    window.addEventListener('resize', calculateWeeks)
    return () => window.removeEventListener('resize', calculateWeeks)
  }, [])

  // Get color based on execution score - GitHub style
  const getColor = (score: number) => {
    if (score >= 86) return 'bg-purple-500' // Apex
    if (score >= 71) return 'bg-emerald-500' // Velocity
    if (score >= 56) return 'bg-green-500' // Traction
    if (score >= 46) return 'bg-yellow-500' // Maintenance
    if (score >= 31) return 'bg-orange-500' // Unfocused
    if (score >= 16) return 'bg-red-400' // Decay
    return 'bg-red-600' // Sabotage
  }

  // Create a map of dates to scores
  const scoreMap = new Map(data.map(d => [d.date, d.execution_score]))

  // Calculate end date (today)
  const endDate = new Date()

  // Calculate start date based on weeks that fit
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - (weeksToShow * 7))
  
  // Adjust to start from beginning of month
  startDate.setDate(1)

  // Generate dates for the calculated range
  const allDates: string[] = []
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    allDates.push(d.toISOString().split('T')[0])
  }

  // Group by week (columns)
  const weeks: string[][] = []
  let currentWeek: string[] = []
  
  allDates.forEach((date) => {
    const dayOfWeek = new Date(date).getDay()
    
    // Start a new week on Sunday
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    
    currentWeek.push(date)
  })
  
  // Push the last week
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div ref={containerRef} className="w-full px-4">
      <div className="flex gap-0.5 justify-center">
        {/* Calendar grid - weeks as columns, NO overflow */}
        <div className="flex gap-0.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((date) => {
                const score = scoreMap.get(date)
                const hasScore = score !== undefined
                
                return (
                  <div
                    key={date}
                    className={`
                      w-3 h-3 rounded-[2px]
                      ${hasScore ? getColor(score) : 'bg-zinc-900'}
                      ${hasScore ? 'opacity-100' : 'border border-zinc-800'}
                      hover:ring-1 hover:ring-white/50
                      relative group cursor-pointer
                    `}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-950 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-zinc-700">
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {hasScore && (
                        <>
                          <br />
                          Score: {score}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Day of week labels */}
        <div className="flex flex-col gap-0.5 pl-1">
          {dayLabels.map((label, idx) => (
            <div key={idx} className="w-3 h-3 flex items-center justify-start text-[9px] text-zinc-600">
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
