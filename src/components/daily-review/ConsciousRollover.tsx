'use client'

import { useState, useEffect } from 'react'
import { useDrag } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'
import type { Task } from '@/types/database'
import { getIncompleteTasks, moveTaskToDate, moveToBacklog, deleteTask } from '@/lib/actions/tasks'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

interface ConsciousRolloverProps {
  onAllProcessed?: (rolledOverIds: string[]) => void
  disabled?: boolean
}

export default function ConsciousRollover({ onAllProcessed, disabled = false }: ConsciousRolloverProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [rolledOverTaskIds, setRolledOverTaskIds] = useState<string[]>([])

  useEffect(() => {
    loadIncompleteTasks()
  }, [])

  async function loadIncompleteTasks() {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const incompleteTasks = await getIncompleteTasks(today)
      setTasks(incompleteTasks)
    } catch (error) {
      console.error('Failed to load incomplete tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tasks.length === 0 && !loading) {
      onAllProcessed?.(rolledOverTaskIds)
    }
  }, [tasks.length, loading, rolledOverTaskIds, onAllProcessed])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-semibold text-white mb-2">All Tasks Processed!</h3>
        <p className="text-zinc-400">You can now continue to planning</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <h3 className="font-semibold text-white mb-2">Process Incomplete Tasks</h3>
        <p className="text-sm text-zinc-400 mb-3">
          You have {tasks.length} incomplete task{tasks.length !== 1 ? 's' : ''} from today. Decide what to do with each:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span>Swipe right → Move to tomorrow</span>
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            <span>Swipe left → Return to backlog</span>
          </div>
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Tap X → Delete task</span>
          </div>
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <SwipeableTaskCard
            key={task.id}
            task={task}
            onSwipeRight={async () => {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              const tomorrowStr = tomorrow.toISOString().split('T')[0]
              await moveTaskToDate(task.id, tomorrowStr)
              setRolledOverTaskIds(prev => [...prev, task.id])
              setTasks(prev => prev.filter(t => t.id !== task.id))
              triggerHapticFeedback(HapticPatterns.SUCCESS)
            }}
            onSwipeLeft={async () => {
              await moveToBacklog(task.id)
              setTasks(prev => prev.filter(t => t.id !== task.id))
              triggerHapticFeedback(HapticPatterns.MEDIUM)
            }}
            onDelete={async () => {
              if (confirm('Delete this task?')) {
                await deleteTask(task.id)
                setTasks(prev => prev.filter(t => t.id !== task.id))
                triggerHapticFeedback(HapticPatterns.SUCCESS)
              }
            }}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}

interface SwipeableTaskCardProps {
  task: Task
  onSwipeRight: () => void
  onSwipeLeft: () => void
  onDelete: () => void
  disabled?: boolean
}

function SwipeableTaskCard({ task, onSwipeRight, onSwipeLeft, onDelete, disabled }: SwipeableTaskCardProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }))
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)

  const bind = useDrag(
    ({ active, movement: [mx], velocity: [vx], direction: [dirX] }) => {
      if (disabled) return

      const trigger = vx > 0.2 || Math.abs(mx) > 100

      if (!active && trigger) {
        if (dirX > 0) {
          // Swipe right - tomorrow
          onSwipeRight()
          api.start({ x: 500, immediate: false })
        } else {
          // Swipe left - backlog
          onSwipeLeft()
          api.start({ x: -500, immediate: false })
        }
      } else if (!active) {
        api.start({ x: 0, immediate: false })
        setDirection(null)
      } else {
        api.start({ x: mx, immediate: true })
        setDirection(mx > 20 ? 'right' : mx < -20 ? 'left' : null)
      }
    },
    {
      axis: 'x',
      bounds: { left: -200, right: 200 },
      rubberband: true,
    }
  )

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div className={`flex items-center gap-2 transition-opacity ${direction === 'left' ? 'opacity-100' : 'opacity-30'}`}>
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          <span className="font-medium text-purple-400">Backlog</span>
        </div>
        <div className={`flex items-center gap-2 transition-opacity ${direction === 'right' ? 'opacity-100' : 'opacity-30'}`}>
          <span className="font-medium text-emerald-400">Tomorrow</span>
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>

      {/* Task Card */}
      <animated.div
        {...bind()}
        style={{ x, touchAction: 'pan-y' }}
        className="relative bg-zinc-800 rounded-lg p-4 border border-zinc-700 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white mb-1">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-zinc-400 line-clamp-2 mb-2">{task.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {task.tags && task.tags.length > 0 && (
                task.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-zinc-700 text-zinc-300 text-xs rounded">
                    {tag}
                  </span>
                ))
              )}
              {task.scheduled_time && (
                <span className="text-xs text-zinc-500">
                  {task.scheduled_time}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            disabled={disabled}
            className="p-2 text-zinc-500 hover:text-red-400 disabled:opacity-50 transition-colors"
            aria-label="Delete task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </animated.div>
    </div>
  )
}
