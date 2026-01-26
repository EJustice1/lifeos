'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTasks } from '@/contexts/TaskContext'
import { WeeklyCalendarStrip } from '@/components/day-view/WeeklyCalendarStrip'
import { getCalendarEvents } from '@/lib/actions/google-calendar'
import { DomainLaunchModal } from '@/components/modals/DomainLaunchModal'
import type { GoogleCalendarEvent, Task } from '@/types/database'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { useDrag } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'
import { Section, Timeline, Divider, StatusBadge } from '@/components/editorial'

export function TodayView() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([])
  const [domainLaunchTask, setDomainLaunchTask] = useState<Task | null>(null)
  const { getTasksByDate, completeTask, uncompleteTask, updateTask, loading } = useTasks()

  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const tasksForDate = getTasksByDate(selectedDateStr)

  // Separate completed and active tasks
  const activeTasks = tasksForDate.filter(t => t.status !== 'completed')
  const completedTasks = tasksForDate.filter(t => t.status === 'completed')

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
    return date.getDay() !== 0 && date.getDay() !== 6
  }

  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.status === 'completed') {
        await uncompleteTask(task.id)
      } else {
        await completeTask(task.id)
      }
      triggerHapticFeedback(HapticPatterns.SUCCESS)
    } catch (error) {
      console.error('Failed to toggle completion:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <Section spacing="normal">
      {/* Calendar Strip */}
      <WeeklyCalendarStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        hasEventsForDate={hasEventsForDate}
      />

      {/* Calendar Events */}
      {calendarEvents.length > 0 && (
        <>
          <Divider spacing="normal" label="Calendar Events" />
          <Timeline
            items={calendarEvents.map(event => ({
              time: event.start_time
                ? new Date(event.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : undefined,
              title: event.summary || 'Untitled Event',
              description: event.description || undefined,
            }))}
            variant="default"
          />
        </>
      )}

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <>
          <Divider spacing="normal" label={`Tasks (${activeTasks.length})`} />
          <div className="space-y-0">
            {activeTasks.map((task) => (
              <SwipeableTaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onUpdate={updateTask}
                onTap={(t) => {
                  if (t.linked_domain) {
                    setDomainLaunchTask(t)
                  }
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <>
          <Divider spacing="normal" label={`Completed (${completedTasks.length})`} variant="subtle" />
          <div className="space-y-0">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="border-b border-zinc-800 py-4 px-4 opacity-60 border-l-[3px] border-l-emerald-500"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="mt-0.5 w-6 h-6 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center flex-shrink-0"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <div className="flex-1">
                    <div className="text-title-md text-zinc-400 line-through">{task.title}</div>
                    {task.description && (
                      <div className="text-body-sm text-zinc-600 mt-1">{task.description}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {tasksForDate.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-headline-md font-semibold text-white mb-2">No Tasks Today</h3>
          <p className="text-body-md text-zinc-400">Add tasks from the backlog or use the + button</p>
        </div>
      )}

      {/* Quick Add FAB */}
      <QuickAddFAB selectedDate={selectedDateStr} onRefresh={() => {}} />

      {/* Domain Launch Modal */}
      {domainLaunchTask && domainLaunchTask.linked_domain && (
        <DomainLaunchModal
          task={domainLaunchTask}
          domain={domainLaunchTask.linked_domain}
          onClose={() => setDomainLaunchTask(null)}
        />
      )}
    </Section>
  )
}

interface SwipeableTaskCardProps {
  task: Task
  onToggleComplete: (task: Task) => void
  onUpdate: (id: string, updates: Partial<Task>) => Promise<Task>
  onTap?: (task: Task) => void
}

function SwipeableTaskCard({ task, onToggleComplete, onUpdate, onTap }: SwipeableTaskCardProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }))
  const [showActions, setShowActions] = useState(false)

  const bind = useDrag(
    ({ movement: [mx], last, velocity: [vx] }) => {
      // Swipe left to reveal actions
      if (last) {
        if (mx < -50 || vx < -0.5) {
          setShowActions(true)
          api.start({ x: -120 })
        } else {
          setShowActions(false)
          api.start({ x: 0 })
        }
      } else {
        api.start({ x: mx < 0 ? Math.max(mx, -120) : 0, immediate: true })
      }
    },
    { axis: 'x' }
  )

  const handleReschedule = async () => {
    // Simple reschedule to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    try {
      await onUpdate(task.id, { scheduled_date: tomorrowStr })
      triggerHapticFeedback(HapticPatterns.SUCCESS)
      setShowActions(false)
      api.start({ x: 0 })
    } catch (error) {
      console.error('Failed to reschedule:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* Action Buttons (Behind) */}
      {showActions && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-2">
          <button
            onClick={handleReschedule}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium"
          >
            Tomorrow
          </button>
        </div>
      )}

      {/* Task Card (Swipeable) */}
      <animated.div
        {...bind()}
        style={{ x }}
        onClick={() => onTap?.(task)}
        className="border-b border-zinc-800 py-4 px-4 touch-pan-y cursor-pointer hover:bg-zinc-900/50 transition-colors border-l-[3px] border-l-blue-400"
      >
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleComplete(task)
            }}
            className="mt-0.5 w-6 h-6 rounded-full border-2 border-zinc-600 hover:border-emerald-500 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            {task.status === 'completed' && (
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-title-md font-medium text-white">{task.title}</div>
            {task.description && (
              <div className="text-body-sm text-zinc-400 mt-1">{task.description}</div>
            )}
            <div className="flex items-center gap-3 mt-2">
              {task.scheduled_time && (
                <span className="text-label-md text-zinc-500 font-mono">{task.scheduled_time}</span>
              )}
              {task.linked_domain && (
                <StatusBadge
                  status={task.linked_domain === 'gym' ? 'in_progress' : 'today'}
                  label={`${task.linked_domain === 'gym' ? '💪' : '📚'} ${task.linked_domain}`}
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>
      </animated.div>
    </div>
  )
}

interface QuickAddFABProps {
  selectedDate: string
  onRefresh: () => void
}

function QuickAddFAB({ selectedDate, onRefresh }: QuickAddFABProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => {
        triggerHapticFeedback(HapticPatterns.LIGHT)
        router.push(`/tasks/new?date=${selectedDate}`)
      }}
      className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-40"
      aria-label="Add task"
    >
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
