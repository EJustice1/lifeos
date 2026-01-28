'use client'

import React, { createContext, useContext, useEffect, useCallback } from 'react'
import type { Task, Project } from '@/types/database'
import { useTaskManager, type CreateTaskData } from '@/lib/hooks/useTaskManager'
import { manualSyncGoogleCalendar } from '@/lib/actions/google-calendar'
import { createClient } from '@/lib/supabase/client'
import type {
  TaskStats,
  DailyTaskStats,
  DateRangeStats,
  ProjectTaskStats,
  StreakData,
} from '@/lib/utils/task-stats'

interface TaskContextValue {
  tasks: Task[]
  loading: boolean
  error: Error | null

  // Task operations
  createTask: (data: CreateTaskData) => Promise<Task>
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  completeTask: (id: string) => Promise<void>
  uncompleteTask: (id: string) => Promise<void>

  // Status transitions
  promoteTaskToToday: (id: string) => Promise<void>
  moveTaskToBacklog: (id: string) => Promise<void>
  moveTaskToDate: (id: string, date: string) => Promise<void>
  scheduleTask: (id: string, date: string, time?: string, duration?: number) => Promise<void>

  // Bulk operations
  bulkUpdateStatus: (ids: string[], status: Task['status'], date?: string) => Promise<void>
  bulkDelete: (ids: string[]) => Promise<void>

  // Google Calendar integration
  syncWithGoogleCalendar: () => Promise<void>

  // Date-based filtering
  getTodayTasks: () => Task[]
  getBacklogTasks: () => Task[]
  getTasksByDate: (date: string) => Task[]
  getTasksByDateRange: (startDate: string, endDate: string) => Task[]
  getCompletedTasks: (date?: string) => Task[]
  getIncompleteTasks: (date?: string) => Task[]

  // Stats & Analytics
  getTaskStats: (date?: string) => TaskStats | DailyTaskStats
  getTaskStatsByDateRange: (startDate: string, endDate: string) => DateRangeStats
  getProjectProgress: (projects: Project[]) => ProjectTaskStats[]
  getStreakData: () => StreakData
  getCompletionRate: (date?: string) => number

  // Refresh
  refreshTasks: () => Promise<void>
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const taskManager = useTaskManager()

  // Load tasks on mount
  useEffect(() => {
    taskManager.refreshTasks()
  }, [])

  // Set up real-time sync with Supabase
  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to tasks table changes
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('Task change detected:', payload)
          // Debounce refresh to avoid excessive updates
          setTimeout(() => {
            taskManager.refreshTasks()
          }, 500)
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskManager])

  // Google Calendar sync
  const syncWithGoogleCalendar = useCallback(async (): Promise<void> => {
    try {
      await manualSyncGoogleCalendar()
      await taskManager.refreshTasks()
    } catch (err) {
      console.error('Sync failed:', err)
      throw err
    }
  }, [taskManager])

  const value: TaskContextValue = {
    tasks: taskManager.tasks,
    loading: taskManager.loading,
    error: taskManager.error,
    createTask: taskManager.createTask,
    updateTask: taskManager.updateTask,
    deleteTask: taskManager.deleteTask,
    completeTask: taskManager.completeTask,
    uncompleteTask: taskManager.uncompleteTask,
    promoteTaskToToday: taskManager.promoteTaskToToday,
    moveTaskToBacklog: taskManager.moveTaskToBacklog,
    moveTaskToDate: taskManager.moveTaskToDate,
    scheduleTask: taskManager.scheduleTask,
    bulkUpdateStatus: taskManager.bulkUpdateStatus,
    bulkDelete: taskManager.bulkDelete,
    syncWithGoogleCalendar,
    getTodayTasks: taskManager.getTodayTasks,
    getBacklogTasks: taskManager.getBacklogTasks,
    getTasksByDate: taskManager.getTasksByDate,
    getTasksByDateRange: taskManager.getTasksByDateRange,
    getCompletedTasks: taskManager.getCompletedTasksByDate,
    getIncompleteTasks: taskManager.getIncompleteTasksByDate,
    getTaskStats: taskManager.getTaskStats,
    getTaskStatsByDateRange: taskManager.getTaskStatsByDateRange,
    getProjectProgress: taskManager.getProjectProgress,
    getStreakData: taskManager.getStreakData,
    getCompletionRate: taskManager.getCompletionRate,
    refreshTasks: taskManager.refreshTasks,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
}
