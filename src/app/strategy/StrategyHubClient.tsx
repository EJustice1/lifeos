'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useGoals } from '@/contexts/GoalContext'
import { useProjects } from '@/contexts/ProjectContext'
import { useTasks } from '@/contexts/TaskContext'
import { LifeGoalCard } from '@/components/strategy/LifeGoalCard'
import { ProjectCard } from '@/components/strategy/ProjectCard'
import { TaskListItem } from '@/components/strategy/TaskListItem'
import { LifeGoalFormModal } from '@/components/modals/LifeGoalFormModal'
import type { Task } from '@/types/database'

export function StrategyHubClient() {
  const { goals: lifeGoals, loading: goalsLoading } = useGoals()
  const { projects, loading: projectsLoading } = useProjects()
  const {
    tasks,
    loading: tasksLoading,
    getTodayTasks,
    getBacklogTasks,
    getTasksByDate,
    getTaskStats,
  } = useTasks()
  const [activeTab, setActiveTab] = useState<'today' | 'backlog' | 'projects' | 'goals'>('today')
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false)

  const loading = goalsLoading || projectsLoading || tasksLoading

  // Memoize project grouping
  const projectsByGoal = useMemo(() => 
    projects.reduce((acc, project) => {
      const goalId = project.life_goal_id || 'none'
      if (!acc[goalId]) acc[goalId] = []
      acc[goalId].push(project)
      return acc
    }, {} as Record<string, typeof projects>),
    [projects]
  )

  // Memoize task grouping
  const tasksByProject = useMemo(() => 
    tasks.reduce((acc, task) => {
      const projectId = task.project_id || 'none'
      if (!acc[projectId]) acc[projectId] = []
      acc[projectId].push(task)
      return acc
    }, {} as Record<string, typeof tasks>),
    [tasks]
  )

  // Memoize derived data using unified task manager methods
  const orphanedProjects = useMemo(() => projectsByGoal['none'] || [], [projectsByGoal])
  const backlogTasks = useMemo(() => getBacklogTasks(), [getBacklogTasks])
  const orphanedTasks = useMemo(() => tasks.filter(t => !t.project_id && t.status !== 'backlog'), [tasks])
  
  // Today's tasks using unified task manager
  const todayTasks = useMemo(() => getTodayTasks(), [getTodayTasks])
  
  // Get today's stats
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayStats = useMemo(() => getTaskStats(today), [getTaskStats, today])
  
  // Store the initial sort order to prevent reordering when status changes
  const [todayTaskOrder, setTodayTaskOrder] = useState<string[]>([])
  
  // Get today's tasks
  const todayTasksFiltered = useMemo(() => 
    tasks.filter(t => 
      (t.status === 'today' || t.status === 'completed' || t.status === 'in_progress') && 
      t.scheduled_date === today
    ),
    [tasks, today]
  )
  
  // Initialize or update task order when tasks change (but not when just status changes)
  useEffect(() => {
    const currentTaskIds = todayTasksFiltered.map(t => t.id)
    
    // If we have new tasks or the task list has changed in composition
    if (currentTaskIds.length !== todayTaskOrder.length || 
        !currentTaskIds.every(id => todayTaskOrder.includes(id))) {
      
      // Sort once: uncompleted tasks first, then completed tasks
      const sorted = [...todayTasksFiltered].sort((a, b) => {
        const aCompleted = a.status === 'completed' ? 1 : 0
        const bCompleted = b.status === 'completed' ? 1 : 0
        return aCompleted - bCompleted
      })
      
      setTodayTaskOrder(sorted.map(t => t.id))
    }
  }, [todayTasksFiltered, todayTaskOrder])
  
  // Sort tasks based on the stored order
  const allTodayTasks = useMemo(() => {
    if (todayTaskOrder.length === 0) return todayTasksFiltered
    
    return todayTasksFiltered.sort((a, b) => {
      const indexA = todayTaskOrder.indexOf(a.id)
      const indexB = todayTaskOrder.indexOf(b.id)
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return 0
    })
  }, [todayTasksFiltered, todayTaskOrder])

  if (loading) {
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
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-headline-md font-bold text-white">Strategy Hub</h1>
            <p className="text-body-sm text-zinc-400">Goals, Projects & Tasks</p>
          </div>

          <Link
            href="/"
            className="p-2 text-zinc-400 hover:text-white"
            aria-label="Back to Day View"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-zinc-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-shrink-0 px-4 py-3 font-medium transition-colors text-sm ${
              activeTab === 'today'
                ? 'text-white bg-zinc-800 border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            Today
            <span className="ml-2 text-label-sm opacity-60">({todayTasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('backlog')}
            className={`flex-shrink-0 px-4 py-3 font-medium transition-colors text-sm ${
              activeTab === 'backlog'
                ? 'text-white bg-zinc-800 border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            Backlog
            <span className="ml-2 text-xs opacity-60">({backlogTasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-shrink-0 px-4 py-3 font-medium transition-colors text-sm ${
              activeTab === 'projects'
                ? 'text-white bg-zinc-800 border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            Projects
            <span className="ml-2 text-xs opacity-60">({projects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-shrink-0 px-4 py-3 font-medium transition-colors text-sm ${
              activeTab === 'goals'
                ? 'text-white bg-zinc-800 border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            Goals
            <span className="ml-2 text-xs opacity-60">({lifeGoals.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {activeTab === 'today' && (
          <div className="space-y-2">
            {allTodayTasks.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-title-lg font-semibold text-white mb-2">No Tasks Today</h3>
                <p className="text-zinc-400">Schedule tasks for today from Inbox or Backlog</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-body-sm text-zinc-400">
                      {todayStats.completed}/{todayStats.total} completed ({todayStats.completionRate.toFixed(0)}%)
                    </p>
                  </div>
                </div>
                {allTodayTasks.map(task => (
                  <TaskListItem key={task.id} task={task} />
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            {lifeGoals.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h3 className="text-title-lg font-semibold text-white mb-2">No Life Goals Yet</h3>
                <p className="text-zinc-400 mb-4">Start by creating your first life goal</p>
                <button 
                  onClick={() => setShowCreateGoalModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Life Goal
                </button>
              </div>
            ) : (
              <>
                {lifeGoals.map(goal => {
                  const goalProjects = projectsByGoal[goal.id] || []
                  const goalTasksByProject = goalProjects.reduce((acc, proj) => {
                    acc[proj.id] = tasksByProject[proj.id] || []
                    return acc
                  }, {} as Record<string, Task[]>)
                  
                  return (
                    <LifeGoalCard
                      key={goal.id}
                      goal={goal}
                      projects={goalProjects}
                      tasksByProject={goalTasksByProject}
                    />
                  )
                })}

                {/* Orphaned projects (no life goal) */}
                {orphanedProjects.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-title-md font-semibold text-white mb-3">No Life Goal</h3>
                    <p className="text-body-sm text-zinc-400 mb-3">Projects not linked to a life goal</p>
                    <div className="space-y-3">
                      {orphanedProjects.map(project => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          tasks={tasksByProject[project.id] || []}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'backlog' && (
          <div className="space-y-2">
            {backlogTasks.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-title-lg font-semibold text-white mb-2">No Backlog Tasks</h3>
                <p className="text-zinc-400">Tasks moved from today will appear here</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-body-sm text-zinc-400">
                    {backlogTasks.length} task{backlogTasks.length !== 1 ? 's' : ''} in backlog
                  </p>
                </div>
                {backlogTasks.map(task => (
                  <TaskListItem key={task.id} task={task} />
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="text-title-lg font-semibold text-white mb-2">No Projects Yet</h3>
                <p className="text-zinc-400">Create projects from the Life Goals tab</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    tasks={tasksByProject[project.id] || []}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Life Goal FAB - shown on goals tab */}
      {activeTab === 'goals' && (
        <button
          onClick={() => setShowCreateGoalModal(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center justify-center z-30"
          aria-label="Create Life Goal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Create Life Goal Modal */}
      <LifeGoalFormModal
        isOpen={showCreateGoalModal}
        onClose={() => setShowCreateGoalModal(false)}
        onSuccess={() => {
          setShowCreateGoalModal(false)
        }}
      />
    </div>
  )
}
