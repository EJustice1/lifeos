'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Task } from '@/types/database'
import {
  getTasks,
  createTask as createTaskAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  completeTask as completeTaskAction,
  uncompleteTask as uncompleteTaskAction,
  promoteToToday,
  moveToBacklog,
  moveTaskToDate,
  scheduleTask,
} from '@/lib/actions/tasks'
import { manualSyncGoogleCalendar } from '@/lib/actions/google-calendar'

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

  // Google Calendar integration
  syncWithGoogleCalendar: () => Promise<void>

  // Filtering
  getTodayTasks: () => Task[]
  getBacklogTasks: () => Task[]
  getTasksByDate: (date: string) => Task[]

  // Refresh
  refreshTasks: () => Promise<void>
}

interface CreateTaskData {
  title: string
  description?: string
  status?: Task['status']
  project_id?: string
  bucket_id?: string
  scheduled_date?: string
  scheduled_time?: string
  duration_minutes?: number
  priority?: number
  tags?: string[]
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load tasks on mount
  useEffect(() => {
    refreshTasks()
  }, [])

  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true)
      const fetchedTasks = await getTasks()
      setTasks(fetchedTasks)
      setError(null)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError(err instanceof Error ? err : new Error('Failed to load tasks'))
    } finally {
      setLoading(false)
    }
  }, [])

  // Optimistic update pattern
  const createTask = useCallback(async (data: CreateTaskData): Promise<Task> => {
    const tempId = `temp-${Date.now()}`
    const optimisticTask: Task = {
      id: tempId,
      user_id: '', // Will be set by server
      title: data.title,
      description: data.description || null,
      status: data.status || 'backlog',
      project_id: data.project_id || null,
      bucket_id: data.bucket_id || null,
      scheduled_date: data.scheduled_date || null,
      scheduled_time: data.scheduled_time || null,
      duration_minutes: data.duration_minutes || null,
      linked_domain: null,
      gcal_event_id: null,
      gcal_sync_status: null,
      gcal_last_sync: null,
      priority: data.priority || 3,
      tags: data.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
      promoted_to_today_at: null,
      position_in_day: null,
    }

    setTasks(prev => [...prev, optimisticTask])

    try {
      const newTask = await createTaskAction(data)
      setTasks(prev => prev.map(t => (t.id === tempId ? newTask : t)))
      return newTask
    } catch (err) {
      setTasks(prev => prev.filter(t => t.id !== tempId))
      throw err
    }
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<Task> => {
    const oldTask = tasks.find(t => t.id === id)
    if (!oldTask) throw new Error('Task not found')

    // Optimistic update
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)))

    try {
      // Filter out null values and convert to the expected type
      const filteredUpdates: any = {}
      for (const [key, value] of Object.entries(updates)) {
        if (value !== null && value !== undefined) {
          filteredUpdates[key] = value
        }
      }
      
      const updatedTask = await updateTaskAction(id, filteredUpdates)
      setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)))
      return updatedTask
    } catch (err) {
      // Rollback
      setTasks(prev => prev.map(t => (t.id === id ? oldTask : t)))
      throw err
    }
  }, [tasks])

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    const oldTasks = tasks

    // Optimistic delete
    setTasks(prev => prev.filter(t => t.id !== id))

    try {
      await deleteTaskAction(id)
    } catch (err) {
      // Rollback
      setTasks(oldTasks)
      throw err
    }
  }, [tasks])

  const completeTask = useCallback(async (id: string): Promise<void> => {
    const oldTask = tasks.find(t => t.id === id)
    if (!oldTask) throw new Error('Task not found')

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === id 
        ? { ...t, status: 'completed' as const, completed_at: new Date().toISOString() }
        : t
    ))

    try {
      const updatedTask = await completeTaskAction(id)
      setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)))
    } catch (err) {
      // Rollback
      setTasks(prev => prev.map(t => (t.id === id ? oldTask : t)))
      throw err
    }
  }, [tasks])

  const uncompleteTask = useCallback(async (id: string): Promise<void> => {
    const oldTask = tasks.find(t => t.id === id)
    if (!oldTask) throw new Error('Task not found')

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === id 
        ? { ...t, status: 'today' as const, completed_at: null }
        : t
    ))

    try {
      const updatedTask = await uncompleteTaskAction(id)
      setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)))
    } catch (err) {
      // Rollback
      setTasks(prev => prev.map(t => (t.id === id ? oldTask : t)))
      throw err
    }
  }, [tasks])

  const promoteTaskToToday = useCallback(async (id: string): Promise<void> => {
    const today = new Date().toISOString().split('T')[0]
    await updateTask(id, { status: 'today', scheduled_date: today })
  }, [updateTask])

  const moveTaskToBacklog = useCallback(async (id: string): Promise<void> => {
    await updateTask(id, {
      status: 'backlog',
      scheduled_date: null,
      scheduled_time: null,
    })
  }, [updateTask])

  const moveTaskToDateCallback = useCallback(async (id: string, date: string): Promise<void> => {
    await updateTask(id, { scheduled_date: date, status: 'today' })
  }, [updateTask])

  const scheduleTaskCallback = useCallback(
    async (id: string, date: string, time?: string, duration?: number): Promise<void> => {
      await updateTask(id, {
        scheduled_date: date,
        scheduled_time: time || null,
        duration_minutes: duration || null,
        status: 'today',
      })
    },
    [updateTask]
  )

  const syncWithGoogleCalendar = useCallback(async (): Promise<void> => {
    try {
      await manualSyncGoogleCalendar()
      await refreshTasks()
    } catch (err) {
      console.error('Sync failed:', err)
      throw err
    }
  }, [refreshTasks])

  // Memoize filtered task views
  const getTodayTasks = useCallback((): Task[] => {
    const today = new Date().toISOString().split('T')[0]
    return tasks.filter(
      t => t.status === 'today' || (t.scheduled_date === today && t.status !== 'completed')
    )
  }, [tasks])

  const getBacklogTasks = useCallback((): Task[] => {
    return tasks.filter(t => t.status === 'backlog')
  }, [tasks])

  const getTasksByDate = useCallback(
    (date: string): Task[] => {
      return tasks.filter(t => 
        t.scheduled_date === date && 
        t.status !== 'cancelled' && 
        t.status !== 'backlog'
      )
    },
    [tasks]
  )

  const value: TaskContextValue = {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    promoteTaskToToday,
    moveTaskToBacklog,
    moveTaskToDate: moveTaskToDateCallback,
    scheduleTask: scheduleTaskCallback,
    syncWithGoogleCalendar,
    getTodayTasks,
    getBacklogTasks,
    getTasksByDate,
    refreshTasks,
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
