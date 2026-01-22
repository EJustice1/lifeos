// Client-side cache utilities for better performance

const CACHE_PREFIX = 'lifeos_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class ClientCache {
  static set<T>(key: string, data: T, duration: number = CACHE_DURATION): void {
    try {
      const now = Date.now();
      const item: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt: now + duration
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(CACHE_PREFIX + key);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      const now = Date.now();

      // Check if expired
      if (now > item.expiresAt) {
        this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  static invalidatePattern(pattern: string): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to invalidate cache pattern:', error);
    }
  }
}

// Cache keys
export const CACHE_KEYS = {
  MUSCLE_GROUP_PERCENTILES: 'muscle_group_percentiles',
  PERSONAL_RECORDS: 'personal_records',
  WORKOUT_DATES: 'workout_dates',
  GYM_STATS: 'gym_stats',
  RECENT_WORKOUTS: (limit: number) => `recent_workouts_${limit}`,
  EXERCISES: 'predefined_exercises',
  WORKOUT_HISTORY_TRANSFORMED: (limit: number) => `workout_history_transformed_${limit}`,
};

// Cache durations
export const CACHE_DURATIONS = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
};
