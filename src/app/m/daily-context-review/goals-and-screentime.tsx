'use client'

import { useState, useEffect, useMemo } from 'react'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { useTasks } from '@/contexts/TaskContext'
import type { Task } from '@/types/database'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { getReviewDate } from '@/lib/utils/review-date'
import { getReviewCutoffHour } from '@/lib/actions/settings'

export default function TaskReviewStep() {
  const {
    tasks: allTasksFromContext,
    loading: tasksLoading,
    getTasksByDate,
    completeTask,
    uncompleteTask,
    refreshTasks,
    getCompletionRate,
  } = useTasks()

  const [reviewDate, setReviewDate] = useState<string>('')
  const [initializing, setInitializing] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [taskOrder, setTaskOrder] = useState<string[]>([])

  // Initialize review date
  useEffect(() => {
    async function init() {
      try {
        const cutoffHour = await getReviewCutoffHour()
        const date = getReviewDate(cutoffHour)
        setReviewDate(date)
      } catch (error) {
        console.error('Failed to get review date:', error)
      } finally {
        setInitializing(false)
      }
    }
    init()
  }, [])

  // Get tasks for the review date
  const reviewTasks = useMemo(() => {
    if (!reviewDate || tasksLoading || initializing) return []
    
    return getTasksByDate(reviewDate).filter(t => 
      ['today', 'in_progress', 'completed'].includes(t.status)
    )
  }, [reviewDate, tasksLoading, initializing, getTasksByDate])
  
  // Initialize or update task order when tasks change (but not when just status changes)
  useEffect(() => {
    const currentTaskIds = reviewTasks.map(t => t.id)
    
    // If we have new tasks or the task list has changed in composition
    if (currentTaskIds.length !== taskOrder.length || 
        !currentTaskIds.every(id => taskOrder.includes(id))) {
      
      // Sort once: uncompleted tasks first, then completed tasks
      const sorted = [...reviewTasks].sort((a, b) => {
        const aCompleted = a.status === 'completed' ? 1 : 0
        const bCompleted = b.status === 'completed' ? 1 : 0
        return aCompleted - bCompleted
      })
      
      setTaskOrder(sorted.map(t => t.id))
    }
  }, [reviewTasks, taskOrder])
  
  // Sort tasks based on the stored order
  const sortedTasks = useMemo(() => {
    if (taskOrder.length === 0) return reviewTasks
    
    return reviewTasks.sort((a, b) => {
      const indexA = taskOrder.indexOf(a.id)
      const indexB = taskOrder.indexOf(b.id)
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return 0
    })
  }, [reviewTasks, taskOrder])

  const loading = tasksLoading || initializing
  const completedCount = sortedTasks.filter(t => t.status === 'completed').length
  const totalTasks = sortedTasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  async function handleToggleComplete(task: Task) {
    try {
      setUpdating(true)
      if (task.status === 'completed') {
        await uncompleteTask(task.id)
      } else {
        await completeTask(task.id)
      }
      // Tasks will auto-update via real-time sync
      triggerHapticFeedback(HapticPatterns.SUCCESS)
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
      // Refresh on error to ensure consistency
      await refreshTasks()
    } finally {
      setUpdating(false)
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
    <div className="space-y-6">
      <h1 className="text-headline-md font-bold text-center mb-6">Today's Tasks</h1>

      {/* Task Statistics */}
      <div>
        <h3 className="text-title-lg font-semibold mb-4 text-white">Task Completion</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Completed</span>
            <span className={`text-title-md font-semibold ${
              completionRate === 100 ? 'text-emerald-400' :
              completionRate >= 50 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {completedCount}/{totalTasks} ({completionRate}%)
            </span>
          </div>
          
          {totalTasks > 0 && (
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  completionRate === 100 ? 'bg-emerald-500' :
                  completionRate >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* No Tasks Message */}
      {totalTasks === 0 && (
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">No Tasks</h3>
          <div className="text-center py-6">
            <svg className="w-12 h-12 mx-auto text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-zinc-400 text-body-sm">
              You had no tasks scheduled for today
            </p>
          </div>
        </div>
      )}

      {/* All Tasks - uncompleted at top, completed at bottom */}
      {sortedTasks.length > 0 && (
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Tasks</h3>
          <p className="text-label-sm text-zinc-400 mb-3">Tap to toggle completion</p>
          <div className="space-y-2">
            {sortedTasks.map((task) => {
              const isCompleted = task.status === 'completed'
              return (
                <button
                  key={task.id}
                  onClick={() => handleToggleComplete(task)}
                  disabled={updating}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left disabled:opacity-50"
                >
                  <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-zinc-600 hover:border-emerald-500'
                  }`}>
                    {isCompleted && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={isCompleted ? 'text-zinc-400 line-through' : 'text-white'}>{task.title}</span>
                    {task.description && (
                      <p className={`text-label-sm mt-1 line-clamp-1 ${isCompleted ? 'text-zinc-600 line-through' : 'text-zinc-500'}`}>
                        {task.description}
                      </p>
                    )}
                    {task.scheduled_time && (
                      <p className={`text-label-sm mt-1 ${isCompleted ? 'text-zinc-700' : 'text-zinc-600'}`}>
                        {task.scheduled_time}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
