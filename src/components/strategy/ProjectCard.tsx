'use client'

import { useState } from 'react'
import type { Project, Task } from '@/types/database'
import { TaskListItem } from './TaskListItem'

interface ProjectCardProps {
  project: Project
  tasks: Task[]
  onUpdate?: () => void
}

export function ProjectCard({ project, tasks, onUpdate }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false)

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400'
      case 'completed': return 'bg-blue-500/20 text-blue-400'
      case 'on_hold': return 'bg-yellow-500/20 text-yellow-400'
      case 'archived': return 'bg-zinc-600/20 text-zinc-400'
      default: return 'bg-zinc-600/20 text-zinc-400'
    }
  }

  const progress = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100) 
    : 0

  return (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 hover:bg-zinc-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Color indicator */}
          <div
            className="w-1 h-12 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white">{project.title}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
            
            {project.description && (
              <p className="text-sm text-zinc-400 mb-2">{project.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span>{activeTasks.length} active</span>
              <span>{completedTasks.length} completed</span>
              {project.target_date && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(project.target_date).toLocaleDateString()}
                </span>
              )}
            </div>
            
            {/* Progress bar */}
            {tasks.length > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500 mt-1">{progress}% complete</span>
              </div>
            )}
          </div>
          
          <svg
            className={`w-5 h-5 text-zinc-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {activeTasks.length === 0 && completedTasks.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No tasks yet</p>
          ) : (
            <>
              {activeTasks.map(task => (
                <TaskListItem key={task.id} task={task} onUpdate={onUpdate} />
              ))}
              
              {completedTasks.length > 0 && (
                <details className="mt-4">
                  <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-400">
                    {completedTasks.length} completed task{completedTasks.length !== 1 ? 's' : ''}
                  </summary>
                  <div className="mt-2 space-y-2 opacity-60">
                    {completedTasks.map(task => (
                      <TaskListItem key={task.id} task={task} onUpdate={onUpdate} showPromoteButton={false} />
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
