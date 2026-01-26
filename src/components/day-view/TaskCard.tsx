'use client'

import { useRouter } from 'next/navigation'
import type { Task } from '@/types/database'
import { useTasks } from '@/contexts/TaskContext'

interface TaskCardProps {
  task: Task
  onClick?: (task: Task) => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const router = useRouter()
  const { completeTask } = useTasks()

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
      // Generic task → just complete it
      handleComplete()
    }
  }

  const handleComplete = async () => {
    try {
      await completeTask(task.id)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const projectColor = task.project_id ? '#3b82f6' : '#6b7280' // Default color

  return (
    <div
      className="bg-zinc-800 rounded-lg p-4 border-l-4 cursor-pointer hover:bg-zinc-750 transition-colors"
      style={{ borderLeftColor: projectColor }}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-white">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>

        <div className="ml-4 flex items-center gap-2">
          {/* Status badge */}
          <div
            className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyles(task.status)}`}
          >
            {task.status}
          </div>

          {/* Complete button */}
          {task.status !== 'completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleComplete()
              }}
              className="w-6 h-6 rounded-full border-2 border-zinc-600 hover:border-emerald-500 hover:bg-emerald-500/20 transition-colors"
              aria-label="Complete task"
            />
          )}
        </div>
      </div>

      {/* Time and duration */}
      {task.scheduled_time && (
        <div className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
          <span>{formatTime(task.scheduled_time)}</span>
          {task.duration_minutes && <span>• {task.duration_minutes}m</span>}
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-zinc-700 text-zinc-300 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Google Calendar sync indicator */}
      {task.gcal_event_id && (
        <div className="mt-2 flex items-center gap-1 text-xs text-purple-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path
              fillRule="evenodd"
              d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
              clipRule="evenodd"
            />
          </svg>
          <span>Synced with Google Calendar</span>
        </div>
      )}
    </div>
  )
}

function getStatusStyles(status: Task['status']): string {
  switch (status) {
    case 'today':
      return 'bg-blue-500/20 text-blue-400'
    case 'in_progress':
      return 'bg-yellow-500/20 text-yellow-400'
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-400'
    case 'inbox':
      return 'bg-zinc-600/20 text-zinc-400'
    case 'backlog':
      return 'bg-purple-500/20 text-purple-400'
    case 'cancelled':
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-zinc-600/20 text-zinc-400'
  }
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}
