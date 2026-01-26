'use client'

import { useState } from 'react'
import type { LifeGoal, Project, Task } from '@/types/database'
import { ProjectCard } from './ProjectCard'
import { CollapsibleSection, ContentBlock, DataGrid, StatusBadge, Divider } from '@/components/editorial'

interface LifeGoalCardProps {
  goal: LifeGoal
  projects: Project[]
  tasksByProject: Record<string, Task[]>
  onUpdate?: () => void
}

export function LifeGoalCard({ goal, projects, tasksByProject, onUpdate }: LifeGoalCardProps) {
  const getCategoryColor = (category: LifeGoal['category']): string => {
    if (!category) return '#71717a'
    const colors: Record<string, string> = {
      health: '#34d399',       // emerald-400
      career: '#60a5fa',       // blue-400
      relationships: '#f9a8d4', // pink-300
      finance: '#fbbf24',      // yellow-400
      personal: '#c084fc',     // purple-400
    }
    return colors[category] || '#71717a'
  }

  const totalTasks = Object.values(tasksByProject).flat().length
  const completedTasks = Object.values(tasksByProject)
    .flat()
    .filter(t => t.status === 'completed').length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <CollapsibleSection
      title={goal.title}
      badge={`${totalTasks} tasks`}
      defaultExpanded={false}
    >
      <div
        className="border-l-[3px] pl-6 space-y-6"
        style={{ borderLeftColor: goal.category ? getCategoryColor(goal.category) : '#71717a' }}
      >
        {/* Asymmetric header layout */}
        <ContentBlock
          layout="split-right"
          primary={
            <div>
              <div className="flex items-center gap-3 mb-3">
                {goal.category && goal.category !== 'other' && (
                  <StatusBadge status={goal.category as any} size="sm" />
                )}
                <StatusBadge status={goal.status as any} size="sm" />
              </div>
              {goal.description && (
                <p className="text-body-md text-zinc-300 leading-relaxed">
                  {goal.description}
                </p>
              )}
              {goal.target_date && (
                <div className="mt-3 flex items-center gap-2 text-label-md text-zinc-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          }
          secondary={
            <DataGrid
              metrics={[
                { label: 'Projects', value: projects.length },
                { label: 'Tasks', value: totalTasks },
                { label: 'Progress', value: `${progress}%`, color: 'emerald' },
              ]}
              columns={1}
            />
          }
        />

        <Divider spacing="normal" />

        {/* Projects list - no nested cards */}
        <div className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-body-sm text-zinc-500 text-center py-4">No projects yet</p>
          ) : (
            projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                tasks={tasksByProject[project.id] || []}
                onUpdate={onUpdate}
              />
            ))
          )}
        </div>
      </div>
    </CollapsibleSection>
  )
}
