'use client'

import { useState, useEffect } from 'react'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { getTasks, completeTask, uncompleteTask } from '@/lib/actions/tasks'
import type { Task } from '@/types/database'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { getReviewDate } from '@/lib/utils/review-date'

export default function TaskReviewStep() {
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadTodayTasks()
  }, [])

  async function loadTodayTasks() {
    try {
      setLoading(true)
      const reviewDate = getReviewDate()
      const tasksData = await getTasks({ scheduled_date: reviewDate })
      // Filter to only show tasks that are 'today', 'in_progress', or 'completed'
      const relevantTasks = tasksData.filter(t => 
        ['today', 'in_progress', 'completed'].includes(t.status)
      )
      setAllTasks(relevantTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleComplete(task: Task) {
    try {
      setUpdating(true)
      if (task.status === 'completed') {
        await uncompleteTask(task.id)
      } else {
        await completeTask(task.id)
      }
      // Reload tasks to get updated status
      await loadTodayTasks()
      triggerHapticFeedback(HapticPatterns.SUCCESS)
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setUpdating(false)
    }
  }

  const completedTasks = allTasks.filter(t => t.status === 'completed')
  const incompleteTasks = allTasks.filter(t => t.status !== 'completed')
  const totalTasks = allTasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

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
              {completedTasks.length}/{totalTasks} ({completionRate}%)
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

      {/* Incomplete Tasks */}
      {incompleteTasks.length > 0 && (
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Incomplete Tasks ({incompleteTasks.length})</h3>
          <p className="text-label-sm text-zinc-400 mb-3">Tap to mark as completed</p>
          <div className="space-y-2">
            {incompleteTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleToggleComplete(task)}
                disabled={updating}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left disabled:opacity-50"
              >
                <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 border-zinc-600 flex items-center justify-center transition-all hover:border-emerald-500" />
                <div className="flex-1">
                  <span className="text-white">{task.title}</span>
                  {task.description && (
                    <p className="text-label-sm text-zinc-500 mt-1 line-clamp-1">{task.description}</p>
                  )}
                  {task.scheduled_time && (
                    <p className="text-label-sm text-zinc-600 mt-1">{task.scheduled_time}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Completed Tasks ({completedTasks.length})</h3>
          <p className="text-label-sm text-zinc-400 mb-3">Great job! Tap to mark as incomplete if needed</p>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleToggleComplete(task)}
                disabled={updating}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left disabled:opacity-50"
              >
                <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center transition-all">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-zinc-400 line-through">{task.title}</span>
                  {task.description && (
                    <p className="text-label-sm text-zinc-600 mt-1 line-clamp-1">{task.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
