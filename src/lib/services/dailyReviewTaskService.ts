'use client'

import { useCallback, useMemo } from 'react'
import type { Task } from '@/types/database'
import { useTasks } from '@/contexts/TaskContext'
import type { CreateTaskData } from '@/lib/hooks/useTaskManager'

export interface DailyReviewTaskService {
  reviewTasks: Task[]
  loading: boolean
  toggleTaskComplete: (task: Task) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  moveTaskToDate: (taskId: string, date: string) => Promise<void>
  moveTaskToBacklog: (taskId: string) => Promise<void>
  refreshTasks: () => Promise<void>
  createTaskForDate: (data: Omit<CreateTaskData, 'scheduled_date' | 'status'>) => Promise<Task>
}

export function useDailyReviewTaskService(reviewDate: string | null): DailyReviewTaskService {
  const {
    loading,
    getTasksByDate,
    createTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    moveTaskToDate,
    moveTaskToBacklog,
    refreshTasks,
  } = useTasks()

  const reviewTasks = useMemo(() => {
    if (!reviewDate || loading) return []
    return getTasksByDate(reviewDate).filter(t =>
      ['today', 'in_progress', 'completed'].includes(t.status)
    )
  }, [reviewDate, loading, getTasksByDate])

  const toggleTaskComplete = useCallback(
    async (task: Task) => {
      if (task.status === 'completed') {
        await uncompleteTask(task.id)
      } else {
        await completeTask(task.id)
      }
    },
    [completeTask, uncompleteTask]
  )

  const createTaskForDate = useCallback(
    (data: Omit<Parameters<typeof createTask>[0], 'scheduled_date' | 'status'>) => {
      if (!reviewDate) {
        throw new Error('Review date is required to create tasks')
      }
      return createTask({
        ...data,
        scheduled_date: reviewDate,
        status: 'today',
      })
    },
    [createTask, reviewDate]
  )

  return {
    reviewTasks,
    loading,
    toggleTaskComplete,
    deleteTask,
    moveTaskToDate,
    moveTaskToBacklog,
    refreshTasks,
    createTaskForDate,
  }
}
