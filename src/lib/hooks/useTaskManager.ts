import { useState, useCallback, useMemo } from 'react'
import type { Task, Project } from '@/types/database'
import {
  getTasks,
  createTask as createTaskAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  completeTask as completeTaskAction,
  uncompleteTask as uncompleteTaskAction,
  promoteToToday,
  moveToBacklog,
  moveTaskToDate as moveTaskToDateAction,
  scheduleTask as scheduleTaskAction,
  bulkUpdateTaskStatus,
  bulkDeleteTasks,
} from '@/lib/actions/tasks'
import {
  computeTaskStats,
  computeDailyStats,
  computeCompletionRate,
  computeTaskCountsByStatus,
  computeProjectStats,
  computeDateRangeStats,
  computeStreakData,
  filterTasksByDate,
  filterTasksByDateRange,
  getCompletedTasks,
  getIncompleteTasks,
  type TaskStats,
  type DailyTaskStats,
  type ProjectTaskStats,
  type DateRangeStats,
  type StreakData,
} from '@/lib/utils/task-stats'
import { taskCache } from '@/lib/cache/task-cache'

export interface CreateTaskData {
  title: string
  description?: string
  status?: Task['status']
  project_id?: string
  scheduled_date?: string
  scheduled_time?: string
  duration_minutes?: number
  priority?: number
  tags?: string[]
  linked_domain?: 'gym' | 'study' | null
}

export interface UseTaskManagerReturn {
  // State
  tasks: Task[]
  loading: boolean
  error: Error | null

  // Core CRUD operations
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

  // Date-based filtering
  getTasksByDate: (date: string) => Task[]
  getTasksByDateRange: (startDate: string, endDate: string) => Task[]
  getTodayTasks: () => Task[]
  getCompletedTasksByDate: (date?: string) => Task[]
  getIncompleteTasksByDate: (date?: string) => Task[]
  getBacklogTasks: () => Task[]

  // Stats & Analytics
  getTaskStats: (date?: string) => TaskStats | DailyTaskStats
  getTaskStatsByDateRange: (startDate: string, endDate: string) => DateRangeStats
  getProjectProgress: (projects: Project[]) => ProjectTaskStats[]
  getStreakData: () => StreakData
  getCompletionRate: (date?: string) => number

  // Refresh
  refreshTasks: () => Promise<void>
}

export function useTaskManager(): UseTaskManagerReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true)
      
      // Check cache first
      const cachedTasks = taskCache.getTasks()
      if (cachedTasks) {
        setTasks(cachedTasks)
        setLoading(false)
        // Fetch in background to update cache
        getTasks().then(freshTasks => {
          setTasks(freshTasks)
          taskCache.setTasks(freshTasks)
        })
        return
      }
      
      // No cache, fetch from server
      const fetchedTasks = await getTasks()
      setTasks(fetchedTasks)
      taskCache.setTasks(fetchedTasks)
      setError(null)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError(err instanceof Error ? err : new Error('Failed to load tasks'))
    } finally {
      setLoading(false)
    }
  }, [])

  // Core CRUD operations with optimistic updates
  const createTask = useCallback(async (data: CreateTaskData): Promise<Task> => {
    const tempId = `temp-${Date.now()}`
    const optimisticTask: Task = {
      id: tempId,
      user_id: '',
      title: data.title,
      description: data.description || null,
      status: data.status || 'backlog',
      project_id: data.project_id || null,
      scheduled_date: data.scheduled_date || null,
      scheduled_time: data.scheduled_time || null,
      duration_minutes: data.duration_minutes || null,
      linked_domain: data.linked_domain || null,
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
      // Invalidate cache after mutation
      taskCache.invalidateAllTasks()
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
      const filteredUpdates: any = {}
      for (const [key, value] of Object.entries(updates)) {
        if (value !== null && value !== undefined) {
          filteredUpdates[key] = value
        }
      }
      
      const updatedTask = await updateTaskAction(id, filteredUpdates)
      setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)))
      // Invalidate cache after mutation
      taskCache.invalidateAllTasks()
      if (oldTask.scheduled_date) {
        taskCache.invalidateDate(oldTask.scheduled_date)
      }
      if (updatedTask.scheduled_date) {
        taskCache.invalidateDate(updatedTask.scheduled_date)
      }
      return updatedTask
    } catch (err) {
      // Rollback
      setTasks(prev => prev.map(t => (t.id === id ? oldTask : t)))
      throw err
    }
  }, [tasks])

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    const oldTasks = tasks
    const taskToDelete = tasks.find(t => t.id === id)

    // Optimistic delete
    setTasks(prev => prev.filter(t => t.id !== id))

    try {
      await deleteTaskAction(id)
      // Invalidate cache after mutation
      taskCache.invalidateAllTasks()
      if (taskToDelete?.scheduled_date) {
        taskCache.invalidateDate(taskToDelete.scheduled_date)
      }
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
      // Invalidate cache after mutation
      taskCache.invalidateAllTasks()
      if (oldTask.scheduled_date) {
        taskCache.invalidateDate(oldTask.scheduled_date)
      }
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
      // Invalidate cache after mutation
      taskCache.invalidateAllTasks()
      if (oldTask.scheduled_date) {
        taskCache.invalidateDate(oldTask.scheduled_date)
      }
    } catch (err) {
      // Rollback
      setTasks(prev => prev.map(t => (t.id === id ? oldTask : t)))
      throw err
    }
  }, [tasks])

  // Status transitions
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

  const moveTaskToDate = useCallback(async (id: string, date: string): Promise<void> => {
    await updateTask(id, { scheduled_date: date, status: 'today' })
  }, [updateTask])

  const scheduleTask = useCallback(
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

  // Bulk operations
  const bulkUpdateStatus = useCallback(
    async (ids: string[], status: Task['status'], date?: string): Promise<void> => {
      const oldTasks = [...tasks]
      
      // Optimistic update
      setTasks(prev => prev.map(t => 
        ids.includes(t.id) 
          ? { ...t, status, ...(date ? { scheduled_date: date } : {}) }
          : t
      ))

      try {
        await bulkUpdateTaskStatus(ids, status, date)
        await refreshTasks()
        // Invalidate cache after bulk mutation
        taskCache.invalidateAllTasks()
      } catch (err) {
        // Rollback
        setTasks(oldTasks)
        throw err
      }
    },
    [tasks, refreshTasks]
  )

  const bulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      const oldTasks = [...tasks]
      
      // Optimistic delete
      setTasks(prev => prev.filter(t => !ids.includes(t.id)))

      try {
        await bulkDeleteTasks(ids)
        // Invalidate cache after bulk deletion
        taskCache.invalidateAllTasks()
      } catch (err) {
        // Rollback
        setTasks(oldTasks)
        throw err
      }
    },
    [tasks]
  )

  // Memoized date-based filtering
  const getTasksByDate = useCallback((date: string): Task[] => {
    return filterTasksByDate(tasks, date)
  }, [tasks])

  const getTasksByDateRange = useCallback((startDate: string, endDate: string): Task[] => {
    return filterTasksByDateRange(tasks, startDate, endDate)
  }, [tasks])

  const getTodayTasks = useCallback((): Task[] => {
    const today = new Date().toISOString().split('T')[0]
    return tasks.filter(
      t => t.status === 'today' || (t.scheduled_date === today && t.status !== 'completed')
    )
  }, [tasks])

  const getCompletedTasksByDate = useCallback((date?: string): Task[] => {
    return getCompletedTasks(tasks, date)
  }, [tasks])

  const getIncompleteTasksByDate = useCallback((date?: string): Task[] => {
    return getIncompleteTasks(tasks, date)
  }, [tasks])

  const getBacklogTasks = useCallback((): Task[] => {
    return tasks.filter(t => t.status === 'backlog')
  }, [tasks])

  // Memoized stats & analytics with caching
  const getTaskStats = useCallback((date?: string): TaskStats | DailyTaskStats => {
    // Check cache first
    const cached = taskCache.getTaskStats(date)
    if (cached) return cached
    
    // Compute and cache
    const stats = date ? computeDailyStats(tasks, date) : computeTaskStats(tasks)
    taskCache.setTaskStats(date, stats)
    return stats
  }, [tasks])

  const getTaskStatsByDateRange = useCallback(
    (startDate: string, endDate: string): DateRangeStats => {
      // Check cache first
      const cached = taskCache.getDateRangeStats(startDate, endDate)
      if (cached) return cached
      
      // Compute and cache
      const stats = computeDateRangeStats(tasks, startDate, endDate)
      taskCache.setDateRangeStats(startDate, endDate, stats)
      return stats
    },
    [tasks]
  )

  const getProjectProgress = useCallback((projects: Project[]): ProjectTaskStats[] => {
    // Check cache first
    const cached = taskCache.getProjectStats()
    if (cached) return cached
    
    // Compute and cache
    const stats = computeProjectStats(tasks, projects)
    taskCache.setProjectStats(stats)
    return stats
  }, [tasks])

  const getStreakData = useCallback((): StreakData => {
    return computeStreakData(tasks)
  }, [tasks])

  const getCompletionRate = useCallback((date?: string): number => {
    if (date) {
      const dateTasks = filterTasksByDate(tasks, date)
      return computeCompletionRate(dateTasks)
    }
    return computeCompletionRate(tasks)
  }, [tasks])

  return {
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
    moveTaskToDate,
    scheduleTask,
    bulkUpdateStatus,
    bulkDelete,
    getTasksByDate,
    getTasksByDateRange,
    getTodayTasks,
    getCompletedTasksByDate,
    getIncompleteTasksByDate,
    getBacklogTasks,
    getTaskStats,
    getTaskStatsByDateRange,
    getProjectProgress,
    getStreakData,
    getCompletionRate,
    refreshTasks,
  }
}
