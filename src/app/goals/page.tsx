'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getLifeGoals, getProjects, getTasks } from '@/lib/actions/tasks'
import { LifeGoalFormModal } from '@/components/modals/LifeGoalFormModal'
import { ProjectFormModal } from '@/components/modals/ProjectFormModal'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import type { LifeGoal, Project, Task } from '@/types/database'

export default function VisionPage() {
  const [goals, setGoals] = useState<LifeGoal[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [selectedGoalForProject, setSelectedGoalForProject] = useState<string | undefined>()
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
      } else {
        setIsAuthenticated(true)
        loadData()
      }
    }
    checkAuth()
  }, [router])

  async function loadData() {
    try {
      setLoading(true)
      const [goalsData, projectsData, tasksData] = await Promise.all([
        getLifeGoals(false),
        getProjects(undefined, false),
        getTasks(),
      ])
      setGoals(goalsData)
      setProjects(projectsData)
      setTasks(tasksData)
    } catch (error) {
      console.error('Failed to load vision data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleGoal = (goalId: string) => {
    setExpandedGoals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(goalId)) {
        newSet.delete(goalId)
      } else {
        newSet.add(goalId)
      }
      return newSet
    })
  }

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  // Group projects by goal
  const projectsByGoal = projects.reduce((acc, project) => {
    const goalId = project.life_goal_id || 'orphaned'
    if (!acc[goalId]) acc[goalId] = []
    acc[goalId].push(project)
    return acc
  }, {} as Record<string, Project[]>)

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectId = task.project_id || 'orphaned'
    if (!acc[projectId]) acc[projectId] = []
    acc[projectId].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="px-4 py-4">
          <h1 className="text-3xl font-bold text-white mb-1">Goals</h1>
          <p className="text-sm text-zinc-400">Your life goals and projects</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No Life Goals Yet</h3>
            <p className="text-zinc-400">Create your first life goal to get started</p>
          </div>
        ) : (
          goals.map(goal => {
            const goalProjects = projectsByGoal[goal.id] || []
            const isGoalExpanded = expandedGoals.has(goal.id)

            return (
              <div key={goal.id} className="bg-zinc-900 rounded-lg border border-purple-500/30 overflow-hidden">
                {/* Goal Header */}
                <div className="flex items-center">
                  <button
                    onClick={() => toggleGoal(goal.id)}
                    className="flex-1 px-4 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <svg
                        className={`w-5 h-5 text-purple-400 transition-transform ${
                          isGoalExpanded ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-white text-lg">{goal.title}</div>
                        {goal.description && (
                          <div className="text-sm text-zinc-400 mt-1">{goal.description}</div>
                        )}
                        {goal.category && (
                          <div className="mt-2 inline-block px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded">
                            {goal.category}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-sm rounded">
                        {goalProjects.length} projects
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      triggerHapticFeedback(HapticPatterns.LIGHT)
                      setSelectedGoalForProject(goal.id)
                      setShowProjectModal(true)
                    }}
                    className="px-4 py-4 text-purple-400 hover:text-purple-300 transition-colors"
                    aria-label="Add project to this goal"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Goal Projects */}
                {isGoalExpanded && goalProjects.length > 0 && (
                  <div className="px-4 pb-4 space-y-2 ml-8">
                    {goalProjects.map(project => {
                      const projectTasks = tasksByProject[project.id] || []
                      const completedTasks = projectTasks.filter(t => t.status === 'completed')
                      const isProjectExpanded = expandedProjects.has(project.id)

                      return (
                        <div key={project.id} className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
                          {/* Project Header */}
                          <button
                            onClick={() => toggleProject(project.id)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <svg
                                className={`w-4 h-4 text-blue-400 transition-transform ${
                                  isProjectExpanded ? 'rotate-90' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-white">{project.title}</div>
                                {project.description && (
                                  <div className="text-xs text-zinc-500 mt-1">{project.description}</div>
                                )}
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-zinc-700 text-zinc-400 text-xs rounded">
                              {projectTasks.length} tasks
                            </span>
                          </button>

                          {/* Project Task Summary */}
                          {isProjectExpanded && (
                            <div className="px-4 pb-3 ml-6">
                              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-zinc-400">Task Progress</span>
                                  <span className="text-sm font-semibold text-white">
                                    {completedTasks.length}/{projectTasks.length}
                                  </span>
                                </div>
                                {projectTasks.length > 0 && (
                                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 transition-all"
                                      style={{
                                        width: `${(completedTasks.length / projectTasks.length) * 100}%`
                                      }}
                                    />
                                  </div>
                                )}
                                {projectTasks.length === 0 && (
                                  <p className="text-xs text-zinc-500 text-center py-2">No tasks yet</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Empty state for no projects */}
                {isGoalExpanded && goalProjects.length === 0 && (
                  <div className="px-4 pb-4 text-center">
                    <p className="text-sm text-zinc-500">No projects yet</p>
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Add Goal Button */}
        <button
          onClick={() => {
            triggerHapticFeedback(HapticPatterns.LIGHT)
            setShowGoalModal(true)
          }}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-white font-semibold"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Goal
        </button>

        {/* Orphaned Projects */}
        {projectsByGoal['orphaned'] && projectsByGoal['orphaned'].length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-zinc-400 mb-3 px-2">Unassigned Projects</h3>
            <div className="space-y-2">
              {projectsByGoal['orphaned'].map(project => {
                const projectTasks = tasksByProject[project.id] || []
                const completedTasks = projectTasks.filter(t => t.status === 'completed')
                const isProjectExpanded = expandedProjects.has(project.id)

                return (
                  <div key={project.id} className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
                    <button
                      onClick={() => toggleProject(project.id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <svg
                          className={`w-4 h-4 text-zinc-400 transition-transform ${
                            isProjectExpanded ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-white">{project.title}</div>
                          {project.description && (
                            <div className="text-xs text-zinc-500 mt-1">{project.description}</div>
                          )}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-zinc-700 text-zinc-400 text-xs rounded">
                        {projectTasks.length} tasks
                      </span>
                    </button>

                    {isProjectExpanded && (
                      <div className="px-4 pb-3">
                        <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-zinc-400">Task Progress</span>
                            <span className="text-sm font-semibold text-white">
                              {completedTasks.length}/{projectTasks.length}
                            </span>
                          </div>
                          {projectTasks.length > 0 && (
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all"
                                style={{
                                  width: `${(completedTasks.length / projectTasks.length) * 100}%`
                                }}
                              />
                            </div>
                          )}
                          {projectTasks.length === 0 && (
                            <p className="text-xs text-zinc-500 text-center py-2">No tasks yet</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Life Goal Modal */}
      <LifeGoalFormModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSuccess={() => {
          setShowGoalModal(false)
          loadData()
        }}
      />

      {/* Project Modal */}
      <ProjectFormModal
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false)
          setSelectedGoalForProject(undefined)
        }}
        defaultLifeGoalId={selectedGoalForProject}
        onSuccess={() => {
          setShowProjectModal(false)
          setSelectedGoalForProject(undefined)
          loadData()
        }}
      />
    </div>
  )
}
