'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { LifeGoal, Project, Task } from '@/types/database'
import { getLifeGoals, getProjects, getTasks } from '@/lib/actions/tasks'
import { LifeGoalCard } from '@/components/strategy/LifeGoalCard'
import { ProjectCard } from '@/components/strategy/ProjectCard'
import { TaskListItem } from '@/components/strategy/TaskListItem'
import { QuickAddInboxFAB } from '@/components/strategy/QuickAddInboxFAB'

export function StrategyHubClient() {
  const [lifeGoals, setLifeGoals] = useState<LifeGoal[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'goals' | 'inbox' | 'backlog'>('goals')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [goalsData, projectsData, tasksData] = await Promise.all([
        getLifeGoals(false), // Don't include archived
        getProjects(undefined, false), // All projects, not archived
        getTasks(), // All tasks
      ])
      
      setLifeGoals(goalsData)
      setProjects(projectsData)
      setTasks(tasksData)
    } catch (error) {
      console.error('Failed to load strategy data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group projects by life goal
  const projectsByGoal = projects.reduce((acc, project) => {
    const goalId = project.life_goal_id || 'none'
    if (!acc[goalId]) acc[goalId] = []
    acc[goalId].push(project)
    return acc
  }, {} as Record<string, Project[]>)

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectId = task.project_id || 'none'
    if (!acc[projectId]) acc[projectId] = []
    acc[projectId].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  // Orphaned projects (no life goal)
  const orphanedProjects = projectsByGoal['none'] || []

  // Inbox and backlog tasks
  const inboxTasks = tasks.filter(t => t.status === 'inbox')
  const backlogTasks = tasks.filter(t => t.status === 'backlog')
  const orphanedTasks = tasks.filter(t => !t.project_id && t.status !== 'inbox' && t.status !== 'backlog')

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
            <h1 className="text-2xl font-bold text-white">Strategy Hub</h1>
            <p className="text-sm text-zinc-400">Goals, Projects & Tasks</p>
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
        <div className="flex border-t border-zinc-800">
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'goals'
                ? 'text-white bg-zinc-800 border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            Life Goals
            <span className="ml-2 text-xs opacity-60">({lifeGoals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'inbox'
                ? 'text-white bg-zinc-800 border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            Inbox
            <span className="ml-2 text-xs opacity-60">({inboxTasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('backlog')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'backlog'
                ? 'text-white bg-zinc-800 border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            Backlog
            <span className="ml-2 text-xs opacity-60">({backlogTasks.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {activeTab === 'goals' && (
          <div className="space-y-4">
            {lifeGoals.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No Life Goals Yet</h3>
                <p className="text-zinc-400 mb-4">Start by creating your first life goal</p>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
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
                      onUpdate={loadData}
                    />
                  )
                })}

                {/* Orphaned projects (no life goal) */}
                {orphanedProjects.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Unassigned Projects</h3>
                    <div className="space-y-3">
                      {orphanedProjects.map(project => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          tasks={tasksByProject[project.id] || []}
                          onUpdate={loadData}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="space-y-2">
            {inboxTasks.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">Inbox is Empty</h3>
                <p className="text-zinc-400">Quick capture tasks here and organize them later</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-zinc-400">
                    {inboxTasks.length} task{inboxTasks.length !== 1 ? 's' : ''} to organize
                  </p>
                </div>
                {inboxTasks.map(task => (
                  <TaskListItem key={task.id} task={task} onUpdate={loadData} />
                ))}
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
                <h3 className="text-xl font-semibold text-white mb-2">No Backlog Tasks</h3>
                <p className="text-zinc-400">Tasks moved from today will appear here</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-zinc-400">
                    {backlogTasks.length} task{backlogTasks.length !== 1 ? 's' : ''} in backlog
                  </p>
                </div>
                {backlogTasks.map(task => (
                  <TaskListItem key={task.id} task={task} onUpdate={loadData} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick Add FAB */}
      <QuickAddInboxFAB onTaskCreated={loadData} />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 pb-safe">
        <div className="flex items-center justify-around py-3">
          <Link href="/" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Today</span>
          </Link>

          <Link href="/strategy" className="flex flex-col items-center gap-1 text-emerald-500">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Strategy</span>
          </Link>

          <Link href="/m/gym" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs font-medium">Gym</span>
          </Link>

          <Link href="/m/study" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs font-medium">Study</span>
          </Link>

          <Link href="/m/daily-context-review" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Review</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
