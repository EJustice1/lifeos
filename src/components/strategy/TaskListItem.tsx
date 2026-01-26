'use client'

import type { Task } from '@/types/database'
import { PromoteToTodayButton } from './PromoteToTodayButton'
import { deleteTask } from '@/lib/actions/tasks'
import { useState } from 'react'

interface TaskListItemProps {
  task: Task
  onUpdate?: () => void
  showPromoteButton?: boolean
}

export function TaskListItem({ task, onUpdate, showPromoteButton = true }: TaskListItemProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Delete this task?')) return
    
    try {
      setDeleting(true)
      await deleteTask(task.id)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to delete task:', error)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'backlog': return 'bg-purple-500/20 text-purple-400'
      case 'today': return 'bg-blue-500/20 text-blue-400'
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400'
      case 'completed': return 'bg-emerald-500/20 text-emerald-400'
      case 'cancelled': return 'bg-red-500/20 text-red-400'
      default: return 'bg-zinc-600/20 text-zinc-400'
    }
  }

  const getPriorityIcon = (priority: number) => {
    if (priority >= 4) {
      return (
        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    }
    return null
  }

  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700 hover:border-zinc-600 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getPriorityIcon(task.priority)}
            <h4 className="font-medium text-white truncate">{task.title}</h4>
          </div>
          
          {task.description && (
            <p className="text-sm text-zinc-400 line-clamp-2 mb-2">{task.description}</p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            
            {task.tags && task.tags.length > 0 && (
              task.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-zinc-700 text-zinc-300 text-xs rounded">
                  {tag}
                </span>
              ))
            )}
            
            {task.scheduled_date && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(task.scheduled_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {showPromoteButton && task.status !== 'today' && task.status !== 'completed' && (
            <PromoteToTodayButton taskId={task.id} onPromoted={onUpdate} compact />
          )}
          
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-zinc-500 hover:text-red-400 disabled:opacity-50 transition-colors"
            aria-label="Delete task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
