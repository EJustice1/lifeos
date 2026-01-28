'use client'

import { useState, useEffect } from 'react'
import { useDrag } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'
import type { Task } from '@/types/database'
import { useTasks } from '@/contexts/TaskContext'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { getReviewDate } from '@/lib/utils/review-date'
import { getReviewCutoffHour } from '@/lib/actions/settings'

interface ConsciousRolloverProps {
  onAllProcessed?: (rolledOverIds: string[]) => void
  disabled?: boolean
}

export default function ConsciousRollover({ onAllProcessed, disabled = false }: ConsciousRolloverProps) {
  const {
    tasks: allTasksFromContext,
    loading: tasksLoading,
    getTasksByDate,
    completeTask,
    uncompleteTask,
    moveTaskToDate,
    moveTaskToBacklog,
    deleteTask,
    refreshTasks,
  } = useTasks()

  const [reviewDate, setReviewDate] = useState<string>('')
  const [initializing, setInitializing] = useState(true)
  const [rolledOverTaskIds, setRolledOverTaskIds] = useState<string[]>([])
  const [taskChoices, setTaskChoices] = useState<Record<string, 'tomorrow' | 'backlog' | null>>({})
  const [processedTasks, setProcessedTasks] = useState<Set<string>>(new Set())

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
  const allTasks = reviewDate && !tasksLoading && !initializing
    ? getTasksByDate(reviewDate).filter(t => 
        ['today', 'in_progress', 'completed'].includes(t.status)
      )
    : []

  const loading = tasksLoading || initializing
  const completedTasks = allTasks.filter(t => t.status === 'completed')
  const incompleteTasks = allTasks.filter(t => t.status !== 'completed')

  async function handleToggleComplete(task: Task) {
    try {
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
    }
  }

  // Auto-process tasks when all have been marked, or when there are no incomplete tasks
  useEffect(() => {
    const unprocessedIncompleteTasks = incompleteTasks.filter(t => !processedTasks.has(t.id))
    
    // If there are no incomplete tasks at all, immediately signal completion
    if (incompleteTasks.length === 0 && !loading) {
      onAllProcessed?.([])
      return
    }
    
    const allMarked = unprocessedIncompleteTasks.every(t => taskChoices[t.id] !== undefined && taskChoices[t.id] !== null)
    
    if (allMarked && unprocessedIncompleteTasks.length > 0 && !loading) {
      // Process all marked tasks
      const processAll = async () => {
        const tomorrowIds: string[] = []
        const newProcessedIds = new Set(processedTasks)
        
        for (const task of unprocessedIncompleteTasks) {
          const choice = taskChoices[task.id]
          if (choice === 'tomorrow') {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const tomorrowStr = tomorrow.toISOString().split('T')[0]
            await moveTaskToDate(task.id, tomorrowStr)
            tomorrowIds.push(task.id)
          } else if (choice === 'backlog') {
            await moveTaskToBacklog(task.id)
          }
          newProcessedIds.add(task.id)
        }
        
        // Refresh tasks to sync with other views
        await refreshTasks()
        
        setProcessedTasks(newProcessedIds)
        setRolledOverTaskIds(tomorrowIds)
        onAllProcessed?.(tomorrowIds)
      }
      processAll()
    }
  }, [taskChoices, incompleteTasks, loading, processedTasks, onAllProcessed, moveTaskToDate, moveTaskToBacklog, refreshTasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (incompleteTasks.length === 0 && completedTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-title-lg font-semibold text-white mb-2">No Tasks Today!</h3>
        <p className="text-zinc-400">You had no tasks scheduled for today</p>
      </div>
    )
  }

  if (incompleteTasks.length === 0 && completedTasks.length > 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-title-lg font-semibold text-white mb-2">All Incomplete Tasks Processed!</h3>
          <p className="text-zinc-400">Review your completed tasks below</p>
        </div>

        {/* Completed Tasks Section */}
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completed Tasks ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <CompletedTaskCard
                key={task.id}
                task={task}
                onToggleComplete={() => handleToggleComplete(task)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completed Tasks ({completedTasks.length})
          </h3>
          <p className="text-body-sm text-zinc-400 mb-3">
            Great job! Tap any task to mark it as incomplete if needed.
          </p>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <CompletedTaskCard
                key={task.id}
                task={task}
                onToggleComplete={() => handleToggleComplete(task)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Incomplete Tasks Section */}
      {incompleteTasks.length > 0 && (
        <>
          {/* Instructions */}
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <h3 className="font-semibold text-white mb-2">Process Incomplete Tasks</h3>
            <p className="text-body-sm text-zinc-400">
              Tap on the left (Backlog) or right (Tomorrow) side of each task card to make your choice.
            </p>
          </div>

          {/* Task Cards */}
          <div className="space-y-3">
            {incompleteTasks.map((task) => (
              <TaskChoiceCard
                key={task.id}
                task={task}
                choice={taskChoices[task.id] || null}
                processed={processedTasks.has(task.id)}
                onChoose={(choice) => {
                  if (!processedTasks.has(task.id)) {
                    setTaskChoices(prev => ({ ...prev, [task.id]: choice }))
                    triggerHapticFeedback(HapticPatterns.LIGHT)
                  }
                }}
                onDelete={async () => {
                  if (confirm('Delete this task?')) {
                    try {
                      await deleteTask(task.id)
                      // Tasks will auto-update via real-time sync
                      triggerHapticFeedback(HapticPatterns.SUCCESS)
                    } catch (error) {
                      console.error('Failed to delete task:', error)
                      triggerHapticFeedback(HapticPatterns.FAILURE)
                      await refreshTasks()
                    }
                  }
                }}
                disabled={disabled || processedTasks.has(task.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface TaskChoiceCardProps {
  task: Task
  choice: 'tomorrow' | 'backlog' | null
  processed: boolean
  onChoose: (choice: 'tomorrow' | 'backlog') => void
  onDelete: () => void
  disabled?: boolean
}

function TaskChoiceCard({ task, choice, processed, onChoose, onDelete, disabled }: TaskChoiceCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Task Card with choice indicators */}
      <div className={`relative bg-zinc-800 rounded-lg border border-zinc-700 flex ${processed ? 'opacity-70' : ''}`}>
        {/* Left 20% - Backlog */}
        <button
          onClick={() => !disabled && !processed && onChoose('backlog')}
          disabled={disabled || processed}
          className={`w-[20%] flex flex-col items-center justify-center py-4 px-2 transition-all rounded-l-lg ${
            choice === 'backlog' 
              ? 'bg-purple-600/30 border-r-2 border-purple-500' 
              : processed ? '' : 'hover:bg-purple-900/20'
          }`}
        >
          <svg className={`w-6 h-6 mb-1 transition-colors ${
            choice === 'backlog' ? 'text-purple-400' : 'text-zinc-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          <span className={`text-label-sm font-medium transition-colors ${
            choice === 'backlog' ? 'text-purple-400' : 'text-zinc-600'
          }`}>
            Backlog
          </span>
        </button>

        {/* Center 60% - Task Info */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white mb-1">{task.title}</h4>
              {task.description && (
                <p className="text-body-sm text-zinc-400 line-clamp-2 mb-2">{task.description}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {task.scheduled_time && (
                  <span className="text-label-sm text-zinc-500">
                    {task.scheduled_time}
                  </span>
                )}
              </div>
            </div>
            {!processed && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                disabled={disabled}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {processed && (
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Right 20% - Tomorrow */}
        <button
          onClick={() => !disabled && !processed && onChoose('tomorrow')}
          disabled={disabled || processed}
          className={`w-[20%] flex flex-col items-center justify-center py-4 px-2 transition-all rounded-r-lg ${
            choice === 'tomorrow' 
              ? 'bg-emerald-600/30 border-l-2 border-emerald-500' 
              : processed ? '' : 'hover:bg-emerald-900/20'
          }`}
        >
          <svg className={`w-6 h-6 mb-1 transition-colors ${
            choice === 'tomorrow' ? 'text-emerald-400' : 'text-zinc-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className={`text-label-sm font-medium transition-colors ${
            choice === 'tomorrow' ? 'text-emerald-400' : 'text-zinc-600'
          }`}>
            Tomorrow
          </span>
        </button>
      </div>
    </div>
  )
}

interface CompletedTaskCardProps {
  task: Task
  onToggleComplete: () => void
  disabled?: boolean
}

function CompletedTaskCard({ task, onToggleComplete, disabled }: CompletedTaskCardProps) {
  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          disabled={disabled}
          className="mt-0.5 w-6 h-6 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center disabled:opacity-50 hover:bg-emerald-600 hover:border-emerald-600 transition-colors flex-shrink-0"
          aria-label="Mark as incomplete"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-zinc-400 line-through">{task.title}</h4>
          {task.description && (
            <p className="text-body-sm text-zinc-500 line-clamp-2 mt-1">{task.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {task.tags && task.tags.length > 0 && (
              task.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-label-sm rounded">
                  {tag}
                </span>
              ))
            )}
            {task.scheduled_time && (
              <span className="text-label-sm text-zinc-600">
                {task.scheduled_time}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
