import type { Task } from '@/types/database'
import type { TaskStats, DailyTaskStats, DateRangeStats, ProjectTaskStats } from '@/lib/utils/task-stats'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class TaskCache {
  private cache: Map<string, CacheEntry<any>>
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.cache = new Map()
  }

  /**
   * Generate a cache key
   */
  private generateKey(prefix: string, params?: Record<string, any>): string {
    if (!params) return prefix
    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|')
    return `${prefix}:${sortedParams}`
  }

  /**
   * Check if a cache entry is valid
   */
  private isValid<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return false
    const now = Date.now()
    return now - entry.timestamp < entry.ttl
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (this.isValid(entry)) {
      return entry!.data as T
    }
    // Remove expired entry
    if (entry) {
      this.cache.delete(key)
    }
    return null
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries matching a prefix
   */
  invalidatePrefix(prefix: string): void {
    const keysToDelete: string[] = []
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp >= entry.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Specialized cache methods for task data

  /**
   * Cache tasks list
   */
  setTasks(tasks: Task[]): void {
    this.set('tasks:all', tasks)
  }

  /**
   * Get cached tasks
   */
  getTasks(): Task[] | null {
    return this.get<Task[]>('tasks:all')
  }

  /**
   * Cache tasks by date
   */
  setTasksByDate(date: string, tasks: Task[]): void {
    this.set(`tasks:date:${date}`, tasks)
  }

  /**
   * Get cached tasks by date
   */
  getTasksByDate(date: string): Task[] | null {
    return this.get<Task[]>(`tasks:date:${date}`)
  }

  /**
   * Cache task stats
   */
  setTaskStats(date: string | undefined, stats: TaskStats | DailyTaskStats): void {
    const key = date ? `stats:date:${date}` : 'stats:all'
    this.set(key, stats)
  }

  /**
   * Get cached task stats
   */
  getTaskStats(date?: string): (TaskStats | DailyTaskStats) | null {
    const key = date ? `stats:date:${date}` : 'stats:all'
    return this.get<TaskStats | DailyTaskStats>(key)
  }

  /**
   * Cache date range stats
   */
  setDateRangeStats(startDate: string, endDate: string, stats: DateRangeStats): void {
    this.set(`stats:range:${startDate}:${endDate}`, stats)
  }

  /**
   * Get cached date range stats
   */
  getDateRangeStats(startDate: string, endDate: string): DateRangeStats | null {
    return this.get<DateRangeStats>(`stats:range:${startDate}:${endDate}`)
  }

  /**
   * Cache project stats
   */
  setProjectStats(stats: ProjectTaskStats[]): void {
    this.set('stats:projects', stats)
  }

  /**
   * Get cached project stats
   */
  getProjectStats(): ProjectTaskStats[] | null {
    return this.get<ProjectTaskStats[]>('stats:projects')
  }

  /**
   * Invalidate all task-related caches (call after mutations)
   */
  invalidateAllTasks(): void {
    this.invalidatePrefix('tasks:')
    this.invalidatePrefix('stats:')
  }

  /**
   * Invalidate caches for a specific date
   */
  invalidateDate(date: string): void {
    this.delete(`tasks:date:${date}`)
    this.delete(`stats:date:${date}`)
  }
}

// Export singleton instance
export const taskCache = new TaskCache()

// Auto-cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    taskCache.cleanup()
  }, 10 * 60 * 1000)
}

export default taskCache
