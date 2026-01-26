'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useGoals } from '@/contexts/GoalContext'
import { useProjects } from '@/contexts/ProjectContext'
import { useTasks } from '@/contexts/TaskContext'
import { LifeGoalFormModal } from '@/components/modals/LifeGoalFormModal'
import { ProjectFormModal } from '@/components/modals/ProjectFormModal'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

export default function VisionPage() {
  const { goals, loading: goalsLoading } = useGoals()
  const { projects, loading: projectsLoading } = useProjects()
  const { tasks, loading: tasksLoading } = useTasks()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [selectedGoalForProject, setSelectedGoalForProject] = useState<string | undefined>()
  const router = useRouter()

  const loading = goalsLoading || projectsLoading || tasksLoading

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
      } else {
        setIsAuthenticated(true)
      }
    }
    checkAuth()
  }, [router])

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

  // Memoize project grouping
  const projectsByGoal = useMemo(() => 
    projects.reduce((acc, project) => {
      const goalId = project.life_goal_id || 'orphaned'
      if (!acc[goalId]) acc[goalId] = []
      acc[goalId].push(project)
      return acc
    }, {} as Record<string, typeof projects>),
    [projects]
  )

  // Memoize task grouping
  const tasksByProject = useMemo(() => 
    tasks.reduce((acc, task) => {
      const projectId = task.project_id || 'orphaned'
      if (!acc[projectId]) acc[projectId] = []
      acc[projectId].push(task)
      return acc
    }, {} as Record<string, typeof tasks>),
    [tasks]
  )

  // Category colors
  const categoryColors: Record<string, string> = {
    health: '#10b981',
    career: '#3b82f6',
    personal: '#a855f7',
    finance: '#f59e0b',
    relationships: '#ec4899',
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* NO CARDS - Bold category zones */}

      {/* Massive header */}
      <div className="px-6 pt-12 pb-8">
        <h1 className="text-[4rem] leading-none font-black text-white mb-3">
          GOALS
        </h1>
        <div className="flex items-center gap-6 mt-6">
          <div>
            <div className="text-[3rem] leading-none font-black text-white">{goals.length}</div>
            <div className="text-sm text-zinc-500 font-bold uppercase tracking-wide">Life Goals</div>
          </div>
          <div>
            <div className="text-[3rem] leading-none font-black text-blue-400">{projects.length}</div>
            <div className="text-sm text-zinc-500 font-bold uppercase tracking-wide">Projects</div>
          </div>
        </div>
      </div>

      {/* Goals - category colored zones */}
      {goals.length === 0 ? (
        <div className="px-6 py-24 text-center">
          <div className="text-[4rem] mb-6">🎯</div>
          <h3 className="text-3xl font-black text-white mb-3">No Goals Yet</h3>
          <p className="text-lg text-zinc-500 mb-8">Create your first life goal</p>
          <button
            onClick={() => {
              triggerHapticFeedback(HapticPatterns.LIGHT)
              setShowGoalModal(true)
            }}
            className="px-8 py-4 bg-white text-black font-black text-lg rounded-lg hover:bg-zinc-200 transition-all active:scale-95"
          >
            CREATE GOAL
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {goals.map(goal => {
            const goalProjects = projectsByGoal[goal.id] || []
            const isExpanded = expandedGoals.has(goal.id)
            const categoryColor = goal.category ? categoryColors[goal.category] : '#71717a'

            // Calculate total tasks for this goal
            const totalTasks = goalProjects.reduce((sum, p) => sum + (tasksByProject[p.id] || []).length, 0)
            const completedTasks = goalProjects.reduce((sum, p) =>
              sum + (tasksByProject[p.id] || []).filter(t => t.status === 'completed').length, 0
            )
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            return (
              <div key={goal.id}>
                {/* Goal header - simplified */}
                <button
                  onClick={() => toggleGoal(goal.id)}
                  className="w-full px-6 py-8 transition-all hover:opacity-90"
                  style={{
                    backgroundColor: `${categoryColor}15`,
                    borderLeft: `8px solid ${categoryColor}`
                  }}
                >
                  <div className="flex items-center gap-5">
                    <svg
                      className="w-8 h-8 transition-transform flex-shrink-0"
                      style={{
                        color: categoryColor,
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="text-left flex-1">
                      <div className="text-3xl font-black text-white leading-tight">{goal.title}</div>
                      {goal.category && (
                        <span className="text-sm font-black uppercase tracking-wider mt-2 inline-block" style={{ color: categoryColor }}>
                          {goal.category}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Projects under goal */}
                {isExpanded && goalProjects.length > 0 && (
                  <div className="pl-12 py-4 space-y-2" style={{ backgroundColor: `${categoryColor}05` }}>
                    {goalProjects.map(project => {
                      const projectTasks = tasksByProject[project.id] || []
                      const projectCompleted = projectTasks.filter(t => t.status === 'completed').length
                      const projectProgress = projectTasks.length > 0
                        ? Math.round((projectCompleted / projectTasks.length) * 100)
                        : 0

                      return (
                        <div
                          key={project.id}
                          className="py-4 px-6 border-l-4 transition-all hover:opacity-80"
                          style={{ borderLeftColor: categoryColor }}
                        >
                          <div className="flex items-baseline justify-between gap-4">
                            <div className="flex-1">
                              <div className="text-xl font-bold text-white">{project.title}</div>
                              {project.description && (
                                <div className="text-sm text-zinc-500 mt-1">{project.description}</div>
                              )}
                              <div className="flex items-center gap-3 mt-3">
                                <span className="text-xs font-bold text-zinc-600 uppercase">
                                  {projectTasks.length} tasks
                                </span>
                                {projectTasks.length > 0 && (
                                  <div className="flex-1 max-w-[200px] h-1 bg-zinc-800 overflow-hidden">
                                    <div
                                      className="h-full"
                                      style={{
                                        backgroundColor: categoryColor,
                                        width: `${projectProgress}%`
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-2xl font-black" style={{ color: categoryColor }}>
                              {projectProgress}%
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add project button */}
                {isExpanded && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      triggerHapticFeedback(HapticPatterns.LIGHT)
                      setSelectedGoalForProject(goal.id)
                      setShowProjectModal(true)
                    }}
                    className="w-full py-4 px-6 text-left font-bold uppercase tracking-wider text-sm transition-all hover:opacity-60"
                    style={{
                      color: categoryColor,
                      backgroundColor: `${categoryColor}05`
                    }}
                  >
                    + Add Project
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create goal button - bold */}
      <div className="px-6 mt-8">
        <button
          onClick={() => {
            triggerHapticFeedback(HapticPatterns.LIGHT)
            setShowGoalModal(true)
          }}
          className="w-full py-6 bg-white text-black font-black text-xl rounded-lg hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          CREATE NEW GOAL
        </button>
      </div>

      {/* Life Goal Modal */}
      <LifeGoalFormModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSuccess={() => {
          setShowGoalModal(false)
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
        }}
      />
    </div>
  )
}
