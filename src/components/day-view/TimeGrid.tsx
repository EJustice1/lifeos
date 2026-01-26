'use client'

/**
 * TimeGrid Component
 * Displays time slots from 6 AM to 11 PM with hour markers
 */

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6 AM to 11 PM

export function TimeGrid() {
  return (
    <div className="relative">
      {HOURS.map(hour => (
        <div key={hour} className="relative h-16 border-b border-zinc-800">
          <div className="absolute -top-3 left-0 text-xs text-zinc-500 bg-zinc-950 px-2">
            {formatHour(hour)}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}
