'use client'

import { useState } from 'react'
import type { Task } from '@/types/database'
import { TaskCard } from './TaskCard'

interface UnscheduledTasksSectionProps {
  tasks: Task[]
  onScheduleTask?: (taskId: string, time: string) => void
}

export function UnscheduledTasksSection({
  tasks,
  onScheduleTask,
}: UnscheduledTasksSectionProps) {
  const [expanded, setExpanded] = useState(true)

  if (tasks.length === 0) return null

  return (
    <div className="mt-6 bg-zinc-900/50 rounded-lg border border-zinc-800">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-5 h-5 text-zinc-400 transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="font-semibold text-white">Unscheduled Tasks</h3>
          <span className="px-2 py-0.5 bg-zinc-700 text-zinc-300 text-xs rounded-full">
            {tasks.length}
          </span>
        </div>
      </button>

      {/* Task List */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}

          {tasks.length > 0 && (
            <div className="mt-4 p-3 bg-zinc-800/50 rounded border border-dashed border-zinc-700 text-center text-sm text-zinc-400">
              Drag tasks above to schedule them on the timeline
            </div>
          )}
        </div>
      )}
    </div>
  )
}
