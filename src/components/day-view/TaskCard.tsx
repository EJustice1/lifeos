'use client'

import { useRouter } from 'next/navigation'
import type { Task } from '@/types/database'
import { useTasks } from '@/contexts/TaskContext'
import { ListItem, StatusBadge } from '@/components/editorial'

interface TaskCardProps {
  task: Task
  onClick?: (task: Task) => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const router = useRouter()
  const { completeTask, uncompleteTask } = useTasks()

  const handleClick = () => {
    // Launchpad logic: route based on bucket_id or tags
    if (task.bucket_id) {
      // Task is linked to study bucket → open Study Timer
      router.push(`/m/study?task=${task.id}&bucket=${task.bucket_id}`)
    } else if (task.tags?.includes('workout')) {
      // Task is workout-related → open Gym Tracker
      router.push(`/m/gym?task=${task.id}`)
    } else if (onClick) {
      // Custom onClick handler
      onClick(task)
    } else {
      // Generic task → just toggle completion
      handleToggleComplete()
    }
  }

  const handleToggleComplete = async () => {
    try {
      if (task.status === 'completed') {
        await uncompleteTask(task.id)
      } else {
        await completeTask(task.id)
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
    }
  }

  const projectColor = task.project_id ? '#3b82f6' : '#71717a' // Default color

  return (
    <ListItem
      title={task.title}
      description={task.description || undefined}
      status={task.status === 'completed' ? 'completed' : task.status}
      interactive
      onClick={handleClick}
      style={{ borderLeftColor: projectColor }}
      metadata={
        <div className="flex items-center gap-3 text-label-md text-zinc-500">
          {task.scheduled_time && (
            <span className="font-mono">{formatTime(task.scheduled_time)}</span>
          )}
          {task.duration_minutes && <span>• {task.duration_minutes}m</span>}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-zinc-700/50 text-zinc-400 text-label-sm rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {task.gcal_event_id && (
            <span className="flex items-center gap-1 text-purple-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path
                  fillRule="evenodd"
                  d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-label-sm">Synced</span>
            </span>
          )}
        </div>
      }
      actions={
        <>
          <StatusBadge status={task.status} size="sm" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleComplete()
            }}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              task.status === 'completed'
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-zinc-600 hover:border-emerald-500 hover:bg-emerald-500/20'
            }`}
            aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Complete task'}
          >
            {task.status === 'completed' && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </>
      }
    />
  )
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}
