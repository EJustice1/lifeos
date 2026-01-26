'use client'

import { useState, useEffect } from 'react'
import { useTasks } from '@/contexts/TaskContext'
import { getProjects } from '@/lib/actions/tasks'
import type { Task, Project } from '@/types/database'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { useDrag } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'
import { Section, CollapsibleSection, StatusBadge } from '@/components/editorial'

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
        <h3 className="text-headline-md font-semibold text-white mb-2">Backlog is Empty</h3>
        <p className="text-body-md text-zinc-400">Capture tasks using the Life Button</p>
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
    <Section spacing="normal">
      {projectIds.map(projectId => {
        const group = groupedTasks[projectId]
        const projectName = projectId === 'orphaned' ? 'No Project' : group.project?.title || 'Unknown'

        return (
          <CollapsibleSection
            key={projectId}
            title={projectName}
            badge={`${group.tasks.length} tasks`}
            defaultExpanded={expandedProjects.has(projectId)}
          >
            <div className="space-y-0">
              {group.tasks.map(task => (
                <SwipeableBacklogTask
                  key={task.id}
                  task={task}
                  onRefresh={refreshTasks}
                />
              ))}
            </div>
          </CollapsibleSection>
        )
      })}
    </Section>
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
        className="relative border-b border-zinc-800 py-4 px-4 touch-pan-y border-l-[3px] border-l-purple-400 hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Swipe indicator (left) */}
          <div className="flex flex-col gap-0.5 pt-1 flex-shrink-0 opacity-30">
            <div className="w-1 h-1 rounded-full bg-zinc-500"></div>
            <div className="w-1 h-1 rounded-full bg-zinc-500"></div>
            <div className="w-1 h-1 rounded-full bg-zinc-500"></div>
          </div>

          <div className="mt-0.5 w-6 h-6 rounded-full border-2 border-zinc-600 flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="text-title-md font-medium text-white">{task.title}</div>
            {task.description && (
              <div className="text-body-sm text-zinc-400 mt-1">{task.description}</div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {task.tags && task.tags.length > 0 && task.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-zinc-700/50 text-zinc-400 text-label-sm rounded">
                  {tag}
                </span>
              ))}
              {task.linked_domain && (
                <StatusBadge
                  status={task.linked_domain === 'gym' ? 'in_progress' : 'today'}
                  label={`${task.linked_domain === 'gym' ? '💪' : '📚'} ${task.linked_domain}`}
                  size="sm"
                />
              )}
            </div>
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
