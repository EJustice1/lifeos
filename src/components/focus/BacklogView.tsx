'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTasks } from '@/contexts/TaskContext'
import { useProjects } from '@/contexts/ProjectContext'
import type { Task } from '@/types/database'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { useDrag } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'
import { Section, CollapsibleSection, StatusBadge } from '@/components/editorial'

export function BacklogView() {
  const { tasks, loading, refreshTasks } = useTasks()
  const { projects } = useProjects()
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['orphaned']))

  // Memoize backlog tasks filtering - include all non-today tasks
  const backlogTasks = useMemo(() => 
    tasks.filter(t => t.status !== 'today' && t.status !== 'completed' && t.status !== 'cancelled'),
    [tasks]
  )
  
  // Memoize task grouping
  const groupedTasks = useMemo(() => {
    const grouped = backlogTasks.reduce((acc, task) => {
      const key = task.project_id || 'orphaned'
      if (!acc[key]) {
        acc[key] = { project: null, tasks: [] }
      }
      acc[key].tasks.push(task)
      return acc
    }, {} as Record<string, { project: typeof projects[number] | null; tasks: Task[] }>)

    // Attach project names
    projects.forEach(p => {
      if (grouped[p.id]) {
        grouped[p.id].project = p
      }
    })

    return grouped
  }, [backlogTasks, projects])

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

  const router = useRouter()

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Mobile-optimized header with stats */}
      <div className="px-6 pt-4 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[3rem] leading-none font-black text-purple-500">
              {backlogTasks.length}
            </div>
            <div className="text-sm text-zinc-500 font-bold uppercase tracking-wide">Backlog</div>
          </div>
          <div className="text-xs text-zinc-600">
            Swipe right →
          </div>
        </div>
      </div>

      {/* Project zones - colored, asymmetric */}
      <div className="space-y-6">
        {projectIds.map((projectId, index) => {
          const group = groupedTasks[projectId]
          const projectName = projectId === 'orphaned' ? 'No Project' : group.project?.title || 'Unknown'
          const projectColor = group.project?.color || '#a855f7' // default purple
          const isExpanded = expandedProjects.has(projectId)

          return (
            <div key={projectId} className="relative">
              {/* Project header - bold, colored */}
              <button
                onClick={() => toggleProject(projectId)}
                className="w-full px-6 py-6 transition-all hover:opacity-80 relative z-20"
                style={{
                  backgroundColor: `${projectColor}15`,
                  borderLeft: `6px solid ${projectColor}`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <svg
                      className="w-6 h-6 transition-transform"
                      style={{
                        color: projectColor,
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="text-left">
                      <div className="text-2xl font-black text-white">{projectName}</div>
                      <div className="text-sm font-bold mt-1" style={{ color: projectColor }}>
                        {group.tasks.length} TASKS
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Tasks in project */}
              {isExpanded && (
                <div className="space-y-2 mt-2">
                  {group.tasks.map(task => (
                    <SwipeableBacklogTask
                      key={task.id}
                      task={task}
                      onRefresh={refreshTasks}
                      projectColor={projectColor}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Add FAB */}
      <button
        onClick={() => {
          triggerHapticFeedback(HapticPatterns.LIGHT)
          router.push('/tasks/new')
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-purple-500/80 rounded-full shadow-lg hover:bg-purple-500 transition-colors flex items-center justify-center z-40"
        aria-label="Add task to backlog"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

interface SwipeableBacklogTaskProps {
  task: Task
  onRefresh: () => Promise<void>
  projectColor?: string
}

function SwipeableBacklogTask({ task, onRefresh, projectColor = '#a855f7' }: SwipeableBacklogTaskProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }))
  const [showPromoteButton, setShowPromoteButton] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)

  const bind = useDrag(
    ({ movement: [mx], last, velocity: [vx] }) => {
      // Swipe right to reveal promote button
      if (last) {
        if (mx > 50 || vx > 0.5) {
          setShowPromoteButton(true)
          api.start({ x: 120 })
        } else {
          setShowPromoteButton(false)
          api.start({ x: 0 })
        }
      } else {
        api.start({ x: mx > 0 ? Math.min(mx, 120) : 0, immediate: true })
      }
    },
    { axis: 'x' }
  )

  const handlePromote = async () => {
    if (isPromoting) return
    
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
    <div className="relative overflow-hidden">
      {/* Action Button (Behind - revealed on swipe) */}
      {showPromoteButton && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center pl-2 z-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handlePromote()
            }}
            disabled={isPromoting}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm"
          >
            {isPromoting ? 'Moving...' : 'To Today'}
          </button>
        </div>
      )}

      {/* Task Row - NO CARD */}
      <animated.div
        {...bind()}
        style={{ x }}
        className="relative py-4 px-6 touch-pan-y transition-colors bg-zinc-950 z-10"
      >
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-zinc-700 flex-shrink-0 mt-0.5"></div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-white leading-tight">{task.title}</div>
            {task.description && (
              <div className="text-sm text-zinc-500 mt-1">{task.description}</div>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {task.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-xs font-bold text-zinc-500 uppercase tracking-wide">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </animated.div>
    </div>
  )
}
