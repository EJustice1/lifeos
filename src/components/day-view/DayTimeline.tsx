'use client'

import { useMemo } from 'react'
import type { Task, GoogleCalendarEvent } from '@/types/database'
import { TimeGrid } from './TimeGrid'
import { TaskCard } from './TaskCard'
import { CalendarEventCard } from './CalendarEventCard'
import { UnscheduledTasksSection } from './UnscheduledTasksSection'

interface TimelineItem {
  id: string
  type: 'task' | 'calendar-event'
  time?: Date
  duration?: number
  data: Task | GoogleCalendarEvent
}

interface DayTimelineProps {
  tasks: Task[]
  calendarEvents: GoogleCalendarEvent[]
  onTaskClick?: (task: Task) => void
}

export function DayTimeline({ tasks, calendarEvents, onTaskClick }: DayTimelineProps) {
  const { scheduledItems, unscheduledTasks } = useMemo(() => {
    const scheduled: TimelineItem[] = []
    const unscheduled: Task[] = []

    // Process tasks
    tasks.forEach(task => {
      if (task.scheduled_time && task.scheduled_date) {
        const [hours, minutes] = task.scheduled_time.split(':').map(Number)
        const time = new Date(task.scheduled_date)
        time.setHours(hours, minutes, 0, 0)

        scheduled.push({
          id: task.id,
          type: 'task',
          time,
          duration: task.duration_minutes || 60,
          data: task,
        })
      } else {
        unscheduled.push(task)
      }
    })

    // Process calendar events
    calendarEvents.forEach(event => {
      if (!event.all_day) {
        scheduled.push({
          id: event.id,
          type: 'calendar-event',
          time: new Date(event.start_time),
          duration:
            (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) /
            (1000 * 60),
          data: event,
        })
      }
    })

    // Sort by time
    scheduled.sort((a, b) => {
      if (!a.time || !b.time) return 0
      return a.time.getTime() - b.time.getTime()
    })

    return { scheduledItems: scheduled, unscheduledTasks: unscheduled }
  }, [tasks, calendarEvents])

  return (
    <div className="relative">
      {/* Time Grid Background */}
      <div className="relative">
        <TimeGrid />

        {/* Scheduled Items Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative h-full pointer-events-auto">
            {scheduledItems.map(item => {
              if (!item.time) return null

              const position = calculatePosition(item.time, item.duration || 60)

              return (
                <div
                  key={item.id}
                  className="absolute left-20 right-4 z-10"
                  style={{
                    top: `${position.top}px`,
                    height: `${position.height}px`,
                  }}
                >
                  {item.type === 'task' ? (
                    <TaskCard task={item.data as Task} onClick={onTaskClick} />
                  ) : (
                    <CalendarEventCard event={item.data as GoogleCalendarEvent} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Unscheduled Tasks */}
      <UnscheduledTasksSection tasks={unscheduledTasks} />

      {/* Empty State */}
      {scheduledItems.length === 0 && unscheduledTasks.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-zinc-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-lg font-medium">No tasks scheduled for today</p>
          <p className="text-sm mt-1">Click the + button to add a task</p>
        </div>
      )}
    </div>
  )
}

/**
 * Calculate position of item on timeline
 * @param time Time of the item
 * @param duration Duration in minutes
 * @returns Position in pixels
 */
function calculatePosition(time: Date, duration: number): { top: number; height: number } {
  const hours = time.getHours()
  const minutes = time.getMinutes()

  // Timeline starts at 6 AM (hour 6)
  const startHour = 6
  const hourHeight = 64 // 64px per hour (h-16 = 4rem = 64px)

  // Calculate hours and minutes from start
  const hoursFromStart = hours - startHour
  const totalMinutesFromStart = hoursFromStart * 60 + minutes

  // Calculate position
  const top = (totalMinutesFromStart / 60) * hourHeight
  const height = (duration / 60) * hourHeight

  return { top, height }
}
