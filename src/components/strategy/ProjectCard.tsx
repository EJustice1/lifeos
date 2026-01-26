'use client'

import { useState } from 'react'
import type { Project, Task } from '@/types/database'
import { TaskListItem } from './TaskListItem'
import { CollapsibleSection, StatusBadge, Divider } from '@/components/editorial'

interface ProjectCardProps {
  project: Project
  tasks: Task[]
  onUpdate?: () => void
}

export function ProjectCard({ project, tasks, onUpdate }: ProjectCardProps) {
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const progress = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0

  return (
    <div className="border-l-[3px] pl-4" style={{ borderLeftColor: project.color || '#71717a' }}>
      <CollapsibleSection
        title={project.title}
        badge={`${activeTasks.length} active • ${progress}%`}
        variant="minimal"
        defaultExpanded={false}
      >
        <div className="space-y-4">
          {/* Project header info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge
                status={project.status as any}
                label={project.status.replace('_', ' ')}
                size="sm"
              />
              {project.target_date && (
                <span className="flex items-center gap-1 text-label-md text-zinc-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(project.target_date).toLocaleDateString()}</span>
                </span>
              )}
            </div>

            {project.description && (
              <p className="text-body-sm text-zinc-400">{project.description}</p>
            )}

            {/* Progress indicator */}
            {tasks.length > 0 && (
              <div className="mt-3">
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <Divider spacing="compact" variant="subtle" />

          {/* Task list */}
          {activeTasks.length === 0 && completedTasks.length === 0 ? (
            <p className="text-body-sm text-zinc-500 text-center py-4">No tasks yet</p>
          ) : (
            <div className="space-y-0">
              {activeTasks.map(task => (
                <TaskListItem key={task.id} task={task} onUpdate={onUpdate} />
              ))}

              {completedTasks.length > 0 && (
                <details className="mt-4">
                  <summary className="text-label-md text-zinc-500 cursor-pointer hover:text-zinc-400 py-2">
                    {completedTasks.length} completed task{completedTasks.length !== 1 ? 's' : ''}
                  </summary>
                  <div className="mt-2 space-y-0 opacity-60">
                    {completedTasks.map(task => (
                      <TaskListItem key={task.id} task={task} onUpdate={onUpdate} showPromoteButton={false} />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  )
}
