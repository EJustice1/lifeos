'use client'

import type { GoogleCalendarEvent } from '@/types/database'

interface CalendarEventCardProps {
  event: GoogleCalendarEvent
}

export function CalendarEventCard({ event }: CalendarEventCardProps) {
  const startTime = new Date(event.start_time)
  const endTime = new Date(event.end_time)
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60) // minutes

  return (
    <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-purple-400 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="font-semibold text-white">{event.summary}</h3>
          </div>

          {event.description && (
            <p className="text-sm text-zinc-300 mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>
      </div>

      {/* Time info */}
      <div className="mt-2 text-xs text-purple-300 flex items-center gap-2">
        {event.all_day ? (
          <span>All day</span>
        ) : (
          <>
            <span>{formatTime(startTime)}</span>
            <span>→</span>
            <span>{formatTime(endTime)}</span>
            <span>({Math.round(duration)}m)</span>
          </>
        )}
      </div>

      {/* Location */}
      {event.location && (
        <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="truncate">{event.location}</span>
        </div>
      )}
    </div>
  )
}

function formatTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}
