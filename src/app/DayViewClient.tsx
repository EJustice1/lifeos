'use client'

import { useState, useEffect } from 'react'
import { useTasks } from '@/contexts/TaskContext'
import { useGoogleCalendarSync } from '@/lib/hooks/useGoogleCalendarSync'
import { getCalendarEvents } from '@/lib/actions/google-calendar'
import { WeeklyCalendarStrip } from '@/components/day-view/WeeklyCalendarStrip'
import { DayTimeline } from '@/components/day-view/DayTimeline'
import { QuickAddFAB } from '@/components/day-view/QuickAddFAB'
import type { GoogleCalendarEvent } from '@/types/database'
import Link from 'next/link'

export function DayViewClient() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([])
  const { getTasksByDate, loading: tasksLoading } = useTasks()
  const { syncing, connected, sync } = useGoogleCalendarSync()

  const tasksForSelectedDate = getTasksByDate(selectedDate.toISOString().split('T')[0])

  // Load calendar events for selected date
  useEffect(() => {
    loadCalendarEvents()
  }, [selectedDate])

  async function loadCalendarEvents() {
    const dateStr = selectedDate.toISOString().split('T')[0]
    const startOfDay = `${dateStr}T00:00:00.000Z`
    const endOfDay = `${dateStr}T23:59:59.999Z`

    try {
      const events = await getCalendarEvents(startOfDay, endOfDay)
      setCalendarEvents(events)
    } catch (error) {
      console.error('Failed to load calendar events:', error)
    }
  }

  function hasEventsForDate(date: Date): boolean {
    // Simplified check - could be enhanced to actually query events
    return date.getDay() !== 0 && date.getDay() !== 6 // Not weekend
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-2xl font-bold text-white">Today</h1>

          <div className="flex items-center gap-2">
            {/* Sync Button */}
            {connected && (
              <button
                onClick={sync}
                disabled={syncing}
                className="p-2 text-zinc-400 hover:text-white disabled:opacity-50"
                aria-label="Sync with Google Calendar"
              >
                <svg
                  className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}

            {/* Settings Link */}
            <Link
              href="/m/settings"
              className="p-2 text-zinc-400 hover:text-white"
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Weekly Calendar Strip */}
      <WeeklyCalendarStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        hasEventsForDate={hasEventsForDate}
      />

      {/* Timeline */}
      <div className="px-4 py-6">
        {tasksLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <DayTimeline tasks={tasksForSelectedDate} calendarEvents={calendarEvents} />
        )}
      </div>

      {/* Quick Add FAB */}
      <QuickAddFAB />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 pb-safe">
        <div className="flex items-center justify-around py-3">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-emerald-500"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs font-medium">Today</span>
          </Link>

          <Link
            href="/strategy"
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-xs font-medium">Strategy</span>
          </Link>

          <Link
            href="/m/gym"
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-xs font-medium">Gym</span>
          </Link>

          <Link
            href="/m/study"
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-xs font-medium">Study</span>
          </Link>

          <Link
            href="/m/daily-context-review"
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-medium">Review</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
