'use client'

import { useMemo } from 'react'

interface WeeklyCalendarStripProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  hasEventsForDate?: (date: Date) => boolean
}

export function WeeklyCalendarStrip({
  selectedDate,
  onSelectDate,
  hasEventsForDate,
}: WeeklyCalendarStripProps) {
  const dates = useMemo(() => getNext7Days(), [])

  return (
    <div className="bg-zinc-900 border-b border-zinc-800">
      <div className="flex overflow-x-auto gap-2 px-4 py-3 scrollbar-hide">
        {dates.map(date => {
          const isSelected = isSameDay(date, selectedDate)
          const isToday = isSameDay(date, new Date())
          const hasEvents = hasEventsForDate?.(date) || false

          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-lg transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : isToday
                    ? 'bg-zinc-800 text-white border-2 border-emerald-600'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <span className="text-label-sm font-medium uppercase">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-headline-md font-bold mt-1">
                {date.getDate()}
              </span>
              {hasEvents && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function getNext7Days(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date)
  }

  return dates
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}
