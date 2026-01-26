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
import { Section, DataGrid, Divider } from '@/components/editorial'

export function DayViewClient() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([])
  const { getTasksByDate, loading: tasksLoading } = useTasks()
  const { syncing, connected, sync } = useGoogleCalendarSync()

  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const tasksForSelectedDate = getTasksByDate(selectedDateStr)

  // Calculate stats
  const completedTasks = tasksForSelectedDate.filter(t => t.status === 'completed')
  const incompleteTasks = tasksForSelectedDate.filter(t => t.status !== 'completed')
  const totalTasks = tasksForSelectedDate.length

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
          <h1 className="text-headline-lg font-bold text-white">Today</h1>

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

      {/* Summary Section */}
      {!tasksLoading && (totalTasks > 0 || calendarEvents.length > 0) && (
        <Section spacing="normal" className="px-4">
          <DataGrid
            metrics={[
              {
                label: 'Completed',
                value: `${completedTasks.length}/${totalTasks}`,
                color: 'emerald',
              },
              {
                label: 'Remaining',
                value: incompleteTasks.length,
                color: 'blue',
              },
              {
                label: 'Events',
                value: calendarEvents.length,
                color: 'purple',
              },
              {
                label: 'Progress',
                value: `${Math.round((completedTasks.length / totalTasks) * 100)}%`,
                color: 'emerald',
              },
            ]}
            columns={4}
            layout="balanced"
          />
        </Section>
      )}

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
    </div>
  )
}
