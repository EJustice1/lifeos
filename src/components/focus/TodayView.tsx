'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTasks } from '@/contexts/TaskContext'
import { DomainLaunchModal } from '@/components/modals/DomainLaunchModal'
import type { Task } from '@/types/database'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { useDrag } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'

export function TodayView() {
  const [domainLaunchTask, setDomainLaunchTask] = useState<Task | null>(null)
  const { tasks, completeTask, uncompleteTask, updateTask, loading } = useTasks()

  // Get today's tasks including completed ones
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  
  // Store the initial sort order to prevent reordering when status changes
  const [taskOrder, setTaskOrder] = useState<string[]>([])
  
  // Get today's tasks
  const todayTasks = useMemo(() => 
    tasks.filter(t => 
      (t.status === 'today' || t.status === 'completed' || t.status === 'in_progress') && 
      t.scheduled_date === today
    ),
    [tasks, today]
  )
  
  // Initialize or update task order when tasks change (but not when just status changes)
  useEffect(() => {
    const currentTaskIds = todayTasks.map(t => t.id)
    
    // If we have new tasks or the task list has changed in composition (not just status)
    if (currentTaskIds.length !== taskOrder.length || 
        !currentTaskIds.every(id => taskOrder.includes(id))) {
      
      // Sort once: uncompleted tasks first, then completed tasks
      const sorted = [...todayTasks].sort((a, b) => {
        const aCompleted = a.status === 'completed' ? 1 : 0
        const bCompleted = b.status === 'completed' ? 1 : 0
        return aCompleted - bCompleted
      })
      
      setTaskOrder(sorted.map(t => t.id))
    }
  }, [todayTasks, taskOrder])
  
  // Sort tasks based on the stored order
  const sortedTasks = useMemo(() => {
    if (taskOrder.length === 0) return todayTasks
    
    return todayTasks.sort((a, b) => {
      const indexA = taskOrder.indexOf(a.id)
      const indexB = taskOrder.indexOf(b.id)
      
      // If both are in order, sort by order
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      // New tasks not in order go to the end
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return 0
    })
  }, [todayTasks, taskOrder])
  
  // Count completed tasks for stats
  const completedCount = sortedTasks.filter(t => t.status === 'completed').length

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
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile-optimized stats header */}
      <div className="px-6 pt-4 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[3rem] leading-none font-black text-white">
              {sortedTasks.length - completedCount}
            </div>
            <div className="text-sm text-zinc-500 font-bold uppercase tracking-wide">Active</div>
          </div>
          <div className="text-right">
            <div className="text-[2rem] leading-none font-black text-emerald-400">
              {completedCount}
            </div>
            <div className="text-xs text-zinc-500 font-bold uppercase">Done</div>
          </div>
        </div>

        {/* Progress visualization */}
        {sortedTasks.length > 0 && (
          <div className="relative h-2 bg-zinc-900 overflow-hidden mt-3 rounded-full">
            <div
              className="absolute left-0 top-0 bottom-0 bg-emerald-500"
              style={{ width: `${Math.round((completedCount / sortedTasks.length) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* All tasks in single list - uncompleted at top, completed at bottom */}
      {sortedTasks.length > 0 && (
        <div className="mt-4">
          <div className="space-y-2 pb-24">
            {sortedTasks.map((task) => (
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
        </div>
      )}

      {/* Empty State */}
      {sortedTasks.length === 0 && (
        <div className="px-6 py-24 text-center">
          <div className="text-[4rem] mb-6">✓</div>
          <h3 className="text-3xl font-black text-white mb-3">All Clear</h3>
          <p className="text-lg text-zinc-500">No tasks scheduled</p>
        </div>
      )}

      {/* Quick Add FAB */}
      <QuickAddFAB selectedDate={today} onRefresh={() => {}} />

      {/* Domain Launch Modal */}
      {domainLaunchTask && domainLaunchTask.linked_domain && (
        <DomainLaunchModal
          task={domainLaunchTask}
          domain={domainLaunchTask.linked_domain}
          onClose={() => setDomainLaunchTask(null)}
        />
      )}
    </div>
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
  const isCompleted = task.status === 'completed'

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

  const handleMoveToBacklog = async () => {
    try {
      await onUpdate(task.id, { 
        status: 'backlog',
        scheduled_date: null,
        scheduled_time: null
      })
      triggerHapticFeedback(HapticPatterns.SUCCESS)
      setShowActions(false)
      api.start({ x: 0 })
    } catch (error) {
      console.error('Failed to move to backlog:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* Action Buttons (Behind) */}
      {showActions && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-2">
          <button
            onClick={handleMoveToBacklog}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm"
          >
            Backlog
          </button>
        </div>
      )}

      {/* Task Row - NO CARD, bold design */}
      <animated.div
        {...bind()}
        style={{ x }}
        onClick={() => onTap?.(task)}
        className={`py-6 px-6 touch-pan-y cursor-pointer hover:bg-blue-500/10 transition-colors border-l-4 ${
          isCompleted 
            ? 'border-emerald-500 bg-emerald-500/5 opacity-70' 
            : 'border-blue-500 bg-blue-500/5'
        }`}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleComplete(task)
            }}
            className={`w-8 h-8 rounded-full border-3 flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
              isCompleted
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-blue-400 hover:border-emerald-500'
            }`}
          >
            {isCompleted && (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className={`text-2xl font-bold leading-tight ${isCompleted ? 'text-zinc-500 line-through' : 'text-white'}`}>
              {task.title}
            </div>
            {task.description && (
              <div className={`text-base mt-2 ${isCompleted ? 'text-zinc-600 line-through' : 'text-zinc-400'}`}>
                {task.description}
              </div>
            )}
            <div className="flex items-center gap-4 mt-3">
              {task.scheduled_time && (
                <span className={`text-sm font-bold font-mono ${isCompleted ? 'text-zinc-600' : 'text-blue-400'}`}>
                  {task.scheduled_time}
                </span>
              )}
              {task.linked_domain && (
                <span className={`text-sm font-bold ${isCompleted ? 'text-zinc-600' : 'text-blue-400'}`}>
                  {task.linked_domain === 'gym' ? '💪 GYM' : '📚 STUDY'}
                </span>
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
      className="fixed bottom-24 right-6 w-14 h-14 bg-blue-500/80 rounded-full shadow-lg hover:bg-blue-500 transition-colors flex items-center justify-center z-40"
      aria-label="Add task"
    >
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
