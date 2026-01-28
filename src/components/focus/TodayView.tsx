'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTasks } from '@/contexts/TaskContext'
import { TaskCard } from '@/components/tasks/TaskCard'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

export function TodayView() {
  const { tasks, loading } = useTasks()

  // Get today's tasks including completed ones
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  
  // Store the initial sort order to prevent reordering when status changes
  const [taskOrder, setTaskOrder] = useState<string[]>([])
  
  // Get today's tasks
  const todayTasks = useMemo(() => 
    tasks.filter(t => 
      (t.status === 'today' || t.status === 'completed' || t.status === 'in_progress') && 
      t.scheduled_date === today
    ),
    [tasks, today]
  )
  
  // Initialize or update task order when tasks change (but not when just status changes)
  useEffect(() => {
    const currentTaskIds = todayTasks.map(t => t.id)
    
    // If we have new tasks or the task list has changed in composition (not just status)
    if (currentTaskIds.length !== taskOrder.length || 
        !currentTaskIds.every(id => taskOrder.includes(id))) {
      
      // Sort: 1) completion status, 2) project grouping
      const sorted = [...todayTasks].sort((a, b) => {
        // First, sort by completion status
        const aCompleted = a.status === 'completed' ? 1 : 0
        const bCompleted = b.status === 'completed' ? 1 : 0
        if (aCompleted !== bCompleted) {
          return aCompleted - bCompleted
        }
        
        // Then, group by project (tasks with no project go last)
        const aProject = a.project_id || 'zzz_no_project'
        const bProject = b.project_id || 'zzz_no_project'
        return aProject.localeCompare(bProject)
      })
      
      setTaskOrder(sorted.map(t => t.id))
    }
  }, [todayTasks, taskOrder])
  
  // Sort tasks based on the stored order
  const sortedTasks = useMemo(() => {
    if (taskOrder.length === 0) return todayTasks
    
    return todayTasks.sort((a, b) => {
      const indexA = taskOrder.indexOf(a.id)
      const indexB = taskOrder.indexOf(b.id)
      
      // If both are in order, sort by order
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      // New tasks not in order go to the end
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return 0
    })
  }, [todayTasks, taskOrder])
  
  // Count completed tasks for stats
  const completedCount = sortedTasks.filter(t => t.status === 'completed').length


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile-optimized stats header */}
      <div className="px-6 pt-4 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[3rem] leading-none font-black text-white">
              {sortedTasks.length - completedCount}
            </div>
            <div className="text-sm text-zinc-500 font-bold uppercase tracking-wide">Active</div>
          </div>
          <div className="text-right">
            <div className="text-[2rem] leading-none font-black text-emerald-400">
              {completedCount}
            </div>
            <div className="text-xs text-zinc-500 font-bold uppercase">Done</div>
          </div>
        </div>

        {/* Progress visualization */}
        {sortedTasks.length > 0 && (
          <div className="relative h-2 bg-zinc-900 overflow-hidden mt-3 rounded-full">
            <div
              className="absolute left-0 top-0 bottom-0 bg-emerald-500"
              style={{ width: `${Math.round((completedCount / sortedTasks.length) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* All tasks sorted by project - uncompleted at top, completed at bottom */}
      {sortedTasks.length > 0 && (
        <div className="mt-4 pb-24 space-y-2">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              variant="today"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {sortedTasks.length === 0 && (
        <div className="px-6 py-24 text-center">
          <div className="text-[4rem] mb-6">✓</div>
          <h3 className="text-3xl font-black text-white mb-3">All Clear</h3>
          <p className="text-lg text-zinc-500">No tasks scheduled</p>
        </div>
      )}

      {/* Quick Add FAB */}
      <QuickAddFAB selectedDate={today} onRefresh={() => {}} />
    </div>
  )
}

interface QuickAddFABProps {
  selectedDate: string
  onRefresh: () => void
}

function QuickAddFAB({ selectedDate, onRefresh }: QuickAddFABProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => {
        triggerHapticFeedback(HapticPatterns.LIGHT)
        router.push(`/tasks/new?date=${selectedDate}`)
      }}
      className="fixed bottom-24 right-6 w-14 h-14 bg-blue-500/80 rounded-full shadow-lg hover:bg-blue-500 transition-colors flex items-center justify-center z-40"
      aria-label="Add task"
    >
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
