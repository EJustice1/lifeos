'use client'

import { useState, useEffect } from 'react'
import type { Task } from '@/types/database'
import { getBacklogTasks, getInboxTasks, createTask, moveTaskToDate } from '@/lib/actions/tasks'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

interface PlanningStepProps {
  onTasksScheduled?: (taskIds: string[]) => void
  disabled?: boolean
}

export default function PlanningStep({ onTasksScheduled, disabled = false }: PlanningStepProps) {
  const [activeTab, setActiveTab] = useState<'backlog' | 'inbox'>('backlog')
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([])
  const [inboxTasks, setInboxTasks] = useState<Task[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [scheduling, setScheduling] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      setLoading(true)
      const [backlog, inbox] = await Promise.all([
        getBacklogTasks(),
        getInboxTasks(),
      ])
      setBacklogTasks(backlog)
      setInboxTasks(inbox)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentTasks = activeTab === 'backlog' ? backlogTasks : inboxTasks

  function toggleTask(taskId: string) {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  async function handleScheduleForTomorrow() {
    if (selectedTaskIds.size === 0) return

    try {
      setScheduling(true)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      // Schedule all selected tasks for tomorrow
      await Promise.all(
        Array.from(selectedTaskIds).map(taskId =>
          moveTaskToDate(taskId, tomorrowStr)
        )
      )

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      onTasksScheduled?.(Array.from(selectedTaskIds))
      
      // Clear selection and reload
      setSelectedTaskIds(new Set())
      await loadTasks()
    } catch (error) {
      console.error('Failed to schedule tasks:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setScheduling(false)
    }
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newTaskTitle.trim()) return

    try {
      setScheduling(true)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      await createTask({
        title: newTaskTitle.trim(),
        status: 'today',
        scheduled_date: tomorrowStr,
      })

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      setNewTaskTitle('')
      await loadTasks()
    } catch (error) {
      console.error('Failed to create task:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setScheduling(false)
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
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <h3 className="font-semibold text-white mb-2">Plan Tomorrow</h3>
        <p className="text-sm text-zinc-400">
          Pull tasks from your Strategy Hub to schedule for tomorrow. No limit!
        </p>
      </div>

      {/* Quick Add */}
      <form onSubmit={handleQuickAdd} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <label className="block text-sm font-medium text-white mb-2">
          Quick Add New Task
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done tomorrow?"
            className="flex-1 bg-zinc-900 text-white px-3 py-2 rounded border border-zinc-700 focus:border-emerald-500 focus:outline-none"
            disabled={disabled || scheduling}
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim() || disabled || scheduling}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-50 text-white rounded font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </form>

      {/* Tabs */}
      <div className="flex border-b border-zinc-700">
        <button
          onClick={() => setActiveTab('backlog')}
          className={`flex-1 px-4 py-3 font-medium transition-colors ${
            activeTab === 'backlog'
              ? 'text-white border-b-2 border-emerald-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Backlog
          <span className="ml-2 text-xs opacity-60">({backlogTasks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex-1 px-4 py-3 font-medium transition-colors ${
            activeTab === 'inbox'
              ? 'text-white border-b-2 border-emerald-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Inbox
          <span className="ml-2 text-xs opacity-60">({inboxTasks.length})</span>
        </button>
      </div>

      {/* Selected Tasks Summary */}
      {selectedTaskIds.size > 0 && (
        <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-400 font-medium">
              {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedTaskIds(new Set())}
              className="text-sm text-zinc-400 hover:text-white"
            >
              Clear all
            </button>
          </div>
          <button
            onClick={handleScheduleForTomorrow}
            disabled={disabled || scheduling}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-50 text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
          >
            {scheduling ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Scheduling...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule for Tomorrow
              </>
            )}
          </button>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {currentTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-500">
              {activeTab === 'backlog' ? 'No tasks in backlog' : 'Inbox is empty'}
            </p>
          </div>
        ) : (
          currentTasks.map(task => (
            <label
              key={task.id}
              className={`block bg-zinc-800 rounded-lg p-4 border transition-colors cursor-pointer ${
                selectedTaskIds.has(task.id)
                  ? 'border-emerald-500 bg-emerald-900/20'
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedTaskIds.has(task.id)}
                  onChange={() => toggleTask(task.id)}
                  disabled={disabled || scheduling}
                  className="mt-1 w-5 h-5 rounded border-zinc-600 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 bg-zinc-900"
                />
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
                    {task.priority >= 4 && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded font-medium">
                        High Priority
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  )
}
