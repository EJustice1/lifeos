import type { Task, Project } from '@/types/database'

export interface TaskStats {
  total: number
  completed: number
  completionRate: number
  byStatus: {
    backlog: number
    today: number
    in_progress: number
    completed: number
    cancelled: number
  }
  scheduled: number
  unscheduled: number
}

export interface DailyTaskStats extends TaskStats {
  date: string
  incomplete: number
  overdue: number
}

export interface ProjectTaskStats {
  projectId: string
  total: number
  completed: number
  completionRate: number
  inProgress: number
  pending: number
}

export interface DateRangeStats {
  startDate: string
  endDate: string
  totalTasks: number
  totalCompleted: number
  averageCompletionRate: number
  dailyStats: Record<string, DailyTaskStats>
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastCompletionDate: string | null
}

/**
 * Compute basic task statistics
 */
export function computeTaskStats(tasks: Task[]): TaskStats {
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  
  const byStatus = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    today: tasks.filter(t => t.status === 'today').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length,
  }
  
  const scheduled = tasks.filter(t => t.scheduled_date !== null).length
  const unscheduled = total - scheduled
  
  return {
    total,
    completed,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    byStatus,
    scheduled,
    unscheduled,
  }
}

/**
 * Compute task statistics for a specific date
 */
export function computeDailyStats(tasks: Task[], date: string): DailyTaskStats {
  const dateTasks = tasks.filter(t => t.scheduled_date === date)
  const baseStats = computeTaskStats(dateTasks)
  
  const incomplete = dateTasks.filter(t => 
    t.status !== 'completed' && t.status !== 'cancelled'
  ).length
  
  // Overdue: tasks with status not completed/cancelled and date before today
  const today = new Date().toISOString().split('T')[0]
  const isBeforeToday = date < today
  const overdue = isBeforeToday ? incomplete : 0
  
  return {
    ...baseStats,
    date,
    incomplete,
    overdue,
  }
}

/**
 * Compute completion rate as a percentage
 */
export function computeCompletionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0
  const completed = tasks.filter(t => t.status === 'completed').length
  return (completed / tasks.length) * 100
}

/**
 * Count tasks by status
 */
export function computeTaskCountsByStatus(tasks: Task[]): TaskStats['byStatus'] {
  return {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    today: tasks.filter(t => t.status === 'today').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length,
  }
}

/**
 * Compute project-specific statistics
 */
export function computeProjectStats(tasks: Task[], projects: Project[]): ProjectTaskStats[] {
  return projects.map(project => {
    const projectTasks = tasks.filter(t => t.project_id === project.id)
    const completed = projectTasks.filter(t => t.status === 'completed').length
    const inProgress = projectTasks.filter(t => t.status === 'in_progress').length
    const pending = projectTasks.filter(t => 
      t.status === 'today' || t.status === 'backlog'
    ).length
    
    return {
      projectId: project.id,
      total: projectTasks.length,
      completed,
      completionRate: projectTasks.length > 0 ? (completed / projectTasks.length) * 100 : 0,
      inProgress,
      pending,
    }
  })
}

/**
 * Compute statistics for a date range
 */
export function computeDateRangeStats(
  tasks: Task[], 
  startDate: string, 
  endDate: string
): DateRangeStats {
  // Filter tasks within the date range
  const rangeTasks = tasks.filter(t => {
    if (!t.scheduled_date) return false
    return t.scheduled_date >= startDate && t.scheduled_date <= endDate
  })
  
  // Group by date
  const tasksByDate: Record<string, Task[]> = {}
  rangeTasks.forEach(task => {
    if (task.scheduled_date) {
      if (!tasksByDate[task.scheduled_date]) {
        tasksByDate[task.scheduled_date] = []
      }
      tasksByDate[task.scheduled_date].push(task)
    }
  })
  
  // Compute daily stats
  const dailyStats: Record<string, DailyTaskStats> = {}
  Object.entries(tasksByDate).forEach(([date, dateTasks]) => {
    dailyStats[date] = computeDailyStats(tasks, date)
  })
  
  const totalCompleted = rangeTasks.filter(t => t.status === 'completed').length
  const totalTasks = rangeTasks.length
  
  // Calculate average completion rate across days
  const dailyRates = Object.values(dailyStats).map(s => s.completionRate)
  const averageCompletionRate = dailyRates.length > 0
    ? dailyRates.reduce((sum, rate) => sum + rate, 0) / dailyRates.length
    : 0
  
  return {
    startDate,
    endDate,
    totalTasks,
    totalCompleted,
    averageCompletionRate,
    dailyStats,
  }
}

/**
 * Compute streak data (consecutive days with completed tasks)
 */
export function computeStreakData(tasks: Task[]): StreakData {
  // Get all completed tasks sorted by completion date
  const completedTasks = tasks
    .filter(t => t.completed_at !== null)
    .sort((a, b) => {
      const dateA = a.completed_at || ''
      const dateB = b.completed_at || ''
      return dateA.localeCompare(dateB)
    })
  
  if (completedTasks.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
    }
  }
  
  // Get unique completion dates
  const completionDates = Array.from(
    new Set(completedTasks.map(t => t.completed_at?.split('T')[0]).filter((d): d is string => Boolean(d)))
  ).sort()
  
  if (completionDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
    }
  }
  
  const lastCompletionDate = completionDates[completionDates.length - 1]
  const today = new Date().toISOString().split('T')[0]
  
  // Calculate current streak (working backwards from today/yesterday)
  let currentStreak = 0
  const checkDate = new Date(today)
  
  // If last completion was today, start counting from today
  // If it was yesterday, that's still part of the current streak
  // Otherwise, streak is broken
  const lastDate = new Date(lastCompletionDate)
  const daysDiff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff <= 1) {
    // Streak is active, count backwards
    for (let i = completionDates.length - 1; i >= 0; i--) {
      const date = completionDates[i]
      const expectedDate = new Date(checkDate)
      expectedDate.setDate(expectedDate.getDate() - currentStreak)
      const expectedDateStr = expectedDate.toISOString().split('T')[0]
      
      if (date === expectedDateStr) {
        currentStreak++
      } else {
        break
      }
    }
  }
  
  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 1
  
  for (let i = 1; i < completionDates.length; i++) {
    const prevDate = new Date(completionDates[i - 1])
    const currDate = new Date(completionDates[i])
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak)
  
  return {
    currentStreak,
    longestStreak,
    lastCompletionDate,
  }
}

/**
 * Get tasks filtered by date
 */
export function filterTasksByDate(tasks: Task[], date: string): Task[] {
  return tasks.filter(t => t.scheduled_date === date)
}

/**
 * Get tasks filtered by date range
 */
export function filterTasksByDateRange(
  tasks: Task[], 
  startDate: string, 
  endDate: string
): Task[] {
  return tasks.filter(t => {
    if (!t.scheduled_date) return false
    return t.scheduled_date >= startDate && t.scheduled_date <= endDate
  })
}

/**
 * Get completed tasks, optionally filtered by date
 */
export function getCompletedTasks(tasks: Task[], date?: string): Task[] {
  let filtered = tasks.filter(t => t.status === 'completed')
  if (date) {
    filtered = filtered.filter(t => t.scheduled_date === date)
  }
  return filtered
}

/**
 * Get incomplete tasks, optionally filtered by date
 */
export function getIncompleteTasks(tasks: Task[], date?: string): Task[] {
  let filtered = tasks.filter(t => 
    t.status !== 'completed' && t.status !== 'cancelled'
  )
  if (date) {
    filtered = filtered.filter(t => t.scheduled_date === date)
  }
  return filtered
}
