'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTasks } from '@/contexts/TaskContext'
import { useProjects } from '@/contexts/ProjectContext'
import { TaskCard } from '@/components/tasks/TaskCard'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

export function BacklogView() {
  const { tasks, loading } = useTasks()
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
                    <TaskCard
                      key={task.id}
                      task={task}
                      variant="backlog"
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
