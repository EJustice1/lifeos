'use client'

import { memo } from 'react'
import type { Task } from '@/types/database'
import { PromoteToTodayButton } from './PromoteToTodayButton'
import { useTasks } from '@/contexts/TaskContext'
import { ListItem, StatusBadge } from '@/components/editorial'

interface TaskListItemProps {
  task: Task
  showPromoteButton?: boolean
}

function TaskListItemComponent({ task, showPromoteButton = true }: TaskListItemProps) {
  const { deleteTask } = useTasks()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('Delete this task?')) return

    try {
      await deleteTask(task.id)
    } catch (error) {
      console.error('Failed to delete task:', error)
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

  const titleWithPriority = (
    <div className="flex items-center gap-2">
      {getPriorityIcon(task.priority)}
      <span>{task.title}</span>
    </div>
  )

  return (
    <ListItem
      title={task.title}
      description={task.description || undefined}
      status={task.status}
      metadata={
        <div className="flex items-center gap-3 flex-wrap">
          {task.tags && task.tags.length > 0 && (
            task.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-zinc-700/50 text-zinc-400 text-label-sm rounded">
                {tag}
              </span>
            ))
          )}

          {task.scheduled_date && (
            <span className="flex items-center gap-1 text-zinc-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(task.scheduled_date).toLocaleDateString()}
            </span>
          )}
        </div>
      }
      actions={
        <div className="flex items-center gap-1">
          <StatusBadge status={task.status} size="sm" />

          {showPromoteButton && task.status !== 'today' && task.status !== 'completed' && (
            <PromoteToTodayButton taskId={task.id} compact />
          )}

          <button
            onClick={handleDelete}
            className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
            aria-label="Delete task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      }
    />
  )
}

export const TaskListItem = memo(TaskListItemComponent)
