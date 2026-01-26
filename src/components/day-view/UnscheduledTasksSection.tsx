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
    <div className="mt-6 bg-gradient-to-br from-zinc-900 to-zinc-900/80 rounded-lg border border-emerald-500/20 shadow-lg">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <svg
              className={`w-4 h-4 text-emerald-500 transition-transform ${
                expanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">Unscheduled Tasks</h3>
            <p className="text-xs text-zinc-400">Click tasks to complete or schedule a time</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full">
          {tasks.length}
        </span>
      </button>

      {/* Task List */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
