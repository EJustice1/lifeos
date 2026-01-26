'use client'

import { useState } from 'react'
import type { LifeGoal, Project, Task } from '@/types/database'
import { ProjectCard } from './ProjectCard'

interface LifeGoalCardProps {
  goal: LifeGoal
  projects: Project[]
  tasksByProject: Record<string, Task[]>
  onUpdate?: () => void
}

export function LifeGoalCard({ goal, projects, tasksByProject, onUpdate }: LifeGoalCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getCategoryColor = (category: LifeGoal['category']) => {
    switch (category) {
      case 'health': return 'text-emerald-400 bg-emerald-500/20'
      case 'career': return 'text-blue-400 bg-blue-500/20'
      case 'relationships': return 'text-pink-400 bg-pink-500/20'
      case 'finance': return 'text-yellow-400 bg-yellow-500/20'
      case 'personal': return 'text-purple-400 bg-purple-500/20'
      default: return 'text-zinc-400 bg-zinc-600/20'
    }
  }

  const getStatusColor = (status: LifeGoal['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400'
      case 'completed': return 'bg-blue-500/20 text-blue-400'
      case 'abandoned': return 'bg-red-500/20 text-red-400'
      default: return 'bg-zinc-600/20 text-zinc-400'
    }
  }

  const totalTasks = Object.values(tasksByProject).flat().length
  const completedTasks = Object.values(tasksByProject)
    .flat()
    .filter(t => t.status === 'completed').length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 hover:bg-zinc-850 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-2">
              {goal.category && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(goal.category)}`}>
                  {goal.category}
                </span>
              )}
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(goal.status)}`}>
                {goal.status}
              </span>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">{goal.title}</h2>
            
            {goal.description && (
              <p className="text-sm text-zinc-400 mb-3">{goal.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
              <span>{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
              {goal.target_date && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Target: {new Date(goal.target_date).toLocaleDateString()}
                </span>
              )}
            </div>
            
            {totalTasks > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <svg
            className={`w-6 h-6 text-zinc-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {projects.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No projects yet</p>
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
      )}
    </div>
  )
}
