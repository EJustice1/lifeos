'use client'

import { useState, useEffect } from 'react'
import { useTasks } from '@/contexts/TaskContext'
import { getProjects } from '@/lib/actions/tasks'
import type { Task, Project } from '@/types/database'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { useDrag } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'

interface GroupedBacklog {
  [projectId: string]: {
    project: Project | null
    tasks: Task[]
  }
}

export function BacklogView() {
  const { tasks, loading, refreshTasks } = useTasks()
  const [projects, setProjects] = useState<Project[]>([])
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['orphaned']))

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const projectsData = await getProjects(undefined, false)
      setProjects(projectsData)
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  // Group backlog tasks by project
  const backlogTasks = tasks.filter(t => t.status === 'backlog')
  
  const groupedTasks: GroupedBacklog = backlogTasks.reduce((acc, task) => {
    const key = task.project_id || 'orphaned'
    if (!acc[key]) {
      acc[key] = { project: null, tasks: [] }
    }
    acc[key].tasks.push(task)
    return acc
  }, {} as GroupedBacklog)

  // Attach project names
  projects.forEach(p => {
    if (groupedTasks[p.id]) {
      groupedTasks[p.id].project = p
    }
  })

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (backlogTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-xl font-semibold text-white mb-2">Backlog is Empty</h3>
        <p className="text-zinc-400">Capture tasks using the Life Button</p>
      </div>
    )
  }

  const projectIds = Object.keys(groupedTasks).sort((a, b) => {
    // Orphaned tasks last
    if (a === 'orphaned') return 1
    if (b === 'orphaned') return -1
    // Sort by project title
    const projectA = groupedTasks[a].project
    const projectB = groupedTasks[b].project
    if (!projectA || !projectB) return 0
    return projectA.title.localeCompare(projectB.title)
  })

  return (
    <div className="space-y-4">
      {projectIds.map(projectId => {
        const group = groupedTasks[projectId]
        const isExpanded = expandedProjects.has(projectId)
        const projectName = projectId === 'orphaned' ? 'No Project' : group.project?.title || 'Unknown'

        return (
          <div key={projectId} className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            {/* Project Header */}
            <button
              onClick={() => toggleProject(projectId)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 text-zinc-400 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-semibold text-white">{projectName}</span>
              </div>
              <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-sm rounded">
                {group.tasks.length}
              </span>
            </button>

            {/* Project Tasks */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {group.tasks.map(task => (
                  <SwipeableBacklogTask
                    key={task.id}
                    task={task}
                    onRefresh={refreshTasks}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface SwipeableBacklogTaskProps {
  task: Task
  onRefresh: () => Promise<void>
}

function SwipeableBacklogTask({ task, onRefresh }: SwipeableBacklogTaskProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }))
  const [isPromoting, setIsPromoting] = useState(false)

  const bind = useDrag(
    ({ movement: [mx], last, velocity: [vx] }) => {
      // Swipe right to promote
      if (last) {
        if ((mx > 100 || vx > 0.5) && !isPromoting) {
          handlePromote()
        } else {
          api.start({ x: 0 })
        }
      } else {
        api.start({ x: mx > 0 ? Math.min(mx, 150) : 0, immediate: true })
      }
    },
    { axis: 'x' }
  )

  const handlePromote = async () => {
    try {
      setIsPromoting(true)
      // Import dynamically to avoid circular deps
      const { updateTask } = await import('@/lib/actions/tasks')
      
      const today = new Date().toISOString().split('T')[0]
      await updateTask(task.id, {
        status: 'today',
        scheduled_date: today,
      })

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      
      // Animate out
      api.start({ x: 300, config: { tension: 200, friction: 20 } })
      
      // Refresh after animation
      setTimeout(() => {
        onRefresh()
      }, 300)
    } catch (error) {
      console.error('Failed to promote task:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
      setIsPromoting(false)
      api.start({ x: 0 })
    }
  }

  return (
    <div className="relative">
      {/* Background hint (revealed on swipe) */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-500/30 rounded-lg flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>Move to Today</span>
        </div>
      </div>

      {/* Task Card */}
      <animated.div
        {...bind()}
        style={{ x }}
        className="relative bg-zinc-800 border border-zinc-700 rounded-lg p-4 touch-pan-y"
      >
        <div className="flex items-start gap-3">
          {/* Swipe indicator (left) */}
          <div className="flex flex-col gap-0.5 pt-1 flex-shrink-0 opacity-30">
            <div className="w-1 h-1 rounded-full bg-zinc-500"></div>
            <div className="w-1 h-1 rounded-full bg-zinc-500"></div>
            <div className="w-1 h-1 rounded-full bg-zinc-500"></div>
          </div>
          
          <div className="mt-0.5 w-6 h-6 rounded-full border-2 border-zinc-600 flex-shrink-0"></div>
          <div className="flex-1">
            <div className="text-white font-medium">{task.title}</div>
            {task.description && (
              <div className="text-sm text-zinc-400 mt-1">{task.description}</div>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {task.linked_domain && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded">
                {task.linked_domain === 'gym' ? '💪' : '📚'} {task.linked_domain}
              </div>
            )}
          </div>
          
          {/* Add to Today button (right) - always visible */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handlePromote()
            }}
            disabled={isPromoting}
            className="mt-0.5 w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50"
            aria-label="Add to Today"
          >
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </animated.div>
    </div>
  )
}
